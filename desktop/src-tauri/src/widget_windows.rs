use serde::{Deserialize, Serialize};
use std::{
    env,
    fs,
    path::{Path, PathBuf},
};
use tauri::{
    AppHandle, Manager, PhysicalPosition, Position, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder,
};
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    BringWindowToTop, SetForegroundWindow, SetWindowPos, ShowWindow, HWND_NOTOPMOST,
    HWND_TOPMOST, SWP_ASYNCWINDOWPOS, SWP_NOMOVE, SWP_NOOWNERZORDER, SWP_NOSIZE,
    SWP_SHOWWINDOW, SW_SHOWNORMAL,
};

pub const MAIN_WINDOW_LABEL: &str = "main";
pub const STARTUP_WIDGET_LABEL: &str = "startup-widget";
pub const SESSION_WIDGET_LABEL: &str = "session-widget";

const WIDGET_OVERRIDE_DIRECTORY: &str = "widgets";

#[derive(Clone, Debug, PartialEq)]
struct AuxiliaryWindowConfig {
    title: String,
    width: f64,
    height: f64,
    min_width: f64,
    min_height: f64,
    max_width: f64,
    max_height: f64,
    center_on_create: bool,
    transparent: bool,
    decorations: bool,
    always_on_top: bool,
    visible_on_all_workspaces: bool,
    skip_taskbar: bool,
    resizable: bool,
    maximizable: bool,
    minimizable: bool,
    shadow: bool,
    top_offset: Option<f64>,
    focus_policy: Option<SessionWidgetFocusPolicy>,
    surface_variant: Option<SessionWidgetSurfaceVariant>,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct AuxiliaryWindowConfigOverride {
    title: Option<String>,
    width: Option<f64>,
    height: Option<f64>,
    min_width: Option<f64>,
    min_height: Option<f64>,
    max_width: Option<f64>,
    max_height: Option<f64>,
    center_on_create: Option<bool>,
    transparent: Option<bool>,
    decorations: Option<bool>,
    always_on_top: Option<bool>,
    visible_on_all_workspaces: Option<bool>,
    skip_taskbar: Option<bool>,
    resizable: Option<bool>,
    maximizable: Option<bool>,
    minimizable: Option<bool>,
    shadow: Option<bool>,
    top_offset: Option<f64>,
    focus_policy: Option<SessionWidgetFocusPolicy>,
    surface_variant: Option<SessionWidgetSurfaceVariant>,
}

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum SessionWidgetFocusPolicy {
    Aggressive,
    FocusOnOpen,
    Passive,
}

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum SessionWidgetSurfaceVariant {
    GlassDefault,
    StableWindows,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionWidgetProfile {
    pub focus_policy: SessionWidgetFocusPolicy,
    pub surface_variant: SessionWidgetSurfaceVariant,
    pub transparent_window: bool,
}

#[derive(Clone, Copy)]
enum WidgetWindowTarget {
    Session,
    Startup,
}

impl WidgetWindowTarget {
    fn default_config(self) -> AuxiliaryWindowConfig {
        match self {
            Self::Startup => AuxiliaryWindowConfig {
                title: "ExecuNow Widget".to_string(),
                width: 420.0,
                height: 560.0,
                min_width: 420.0,
                min_height: 560.0,
                max_width: 420.0,
                max_height: 560.0,
                center_on_create: true,
                transparent: false,
                decorations: false,
                always_on_top: true,
                visible_on_all_workspaces: false,
                skip_taskbar: true,
                resizable: false,
                maximizable: false,
                minimizable: false,
                shadow: false,
                top_offset: None,
                focus_policy: None,
                surface_variant: None,
            },
            Self::Session => {
                let stable_windows = cfg!(target_os = "windows");

                AuxiliaryWindowConfig {
                    title: "ExecuNow Session Widget".to_string(),
                    width: 820.0,
                    height: 96.0,
                    min_width: 820.0,
                    min_height: 96.0,
                    max_width: 820.0,
                    max_height: 96.0,
                    center_on_create: false,
                    transparent: !stable_windows,
                    decorations: false,
                    always_on_top: true,
                    visible_on_all_workspaces: true,
                    skip_taskbar: true,
                    resizable: false,
                    maximizable: false,
                    minimizable: false,
                    shadow: false,
                    top_offset: Some(24.0),
                    focus_policy: Some(SessionWidgetFocusPolicy::FocusOnOpen),
                    surface_variant: Some(if stable_windows {
                        SessionWidgetSurfaceVariant::StableWindows
                    } else {
                        SessionWidgetSurfaceVariant::GlassDefault
                    }),
                }
            }
        }
    }

    fn label(self) -> &'static str {
        match self {
            Self::Startup => STARTUP_WIDGET_LABEL,
            Self::Session => SESSION_WIDGET_LABEL,
        }
    }
}

impl AuxiliaryWindowConfig {
    fn apply_override(mut self, override_config: AuxiliaryWindowConfigOverride) -> Self {
        if let Some(title) = override_config.title {
            self.title = title;
        }
        if let Some(width) = override_config.width {
            self.width = width;
        }
        if let Some(height) = override_config.height {
            self.height = height;
        }
        if let Some(min_width) = override_config.min_width {
            self.min_width = min_width;
        }
        if let Some(min_height) = override_config.min_height {
            self.min_height = min_height;
        }
        if let Some(max_width) = override_config.max_width {
            self.max_width = max_width;
        }
        if let Some(max_height) = override_config.max_height {
            self.max_height = max_height;
        }
        if let Some(center_on_create) = override_config.center_on_create {
            self.center_on_create = center_on_create;
        }
        if let Some(transparent) = override_config.transparent {
            self.transparent = transparent;
        }
        if let Some(decorations) = override_config.decorations {
            self.decorations = decorations;
        }
        if let Some(always_on_top) = override_config.always_on_top {
            self.always_on_top = always_on_top;
        }
        if let Some(visible_on_all_workspaces) = override_config.visible_on_all_workspaces {
            self.visible_on_all_workspaces = visible_on_all_workspaces;
        }
        if let Some(skip_taskbar) = override_config.skip_taskbar {
            self.skip_taskbar = skip_taskbar;
        }
        if let Some(resizable) = override_config.resizable {
            self.resizable = resizable;
        }
        if let Some(maximizable) = override_config.maximizable {
            self.maximizable = maximizable;
        }
        if let Some(minimizable) = override_config.minimizable {
            self.minimizable = minimizable;
        }
        if let Some(shadow) = override_config.shadow {
            self.shadow = shadow;
        }
        if let Some(top_offset) = override_config.top_offset {
            self.top_offset = Some(top_offset);
        }
        if let Some(focus_policy) = override_config.focus_policy {
            self.focus_policy = Some(focus_policy);
        }
        if let Some(surface_variant) = override_config.surface_variant {
            self.surface_variant = Some(surface_variant);
        }

        self
    }
}

pub fn create_startup_widget(app: &AppHandle) -> tauri::Result<()> {
    let config = resolve_window_config(app, WidgetWindowTarget::Startup);
    let window = ensure_auxiliary_window(app, STARTUP_WIDGET_LABEL, &config)?;

    if let Err(error) = reinforce_widget_priority(
        &window,
        config.always_on_top,
        config.visible_on_all_workspaces,
        true,
    ) {
        eprintln!("{}", error);
    }

    Ok(())
}

pub fn hide_session_widget_window(app: &AppHandle) -> Result<(), String> {
    hide_auxiliary_window(app, SESSION_WIDGET_LABEL)
}

pub fn reinforce_session_widget_z_order(
    window: &WebviewWindow,
    app: &AppHandle,
    force_focus: bool,
) -> Result<(), String> {
    let config = resolve_window_config(app, WidgetWindowTarget::Session);

    reinforce_widget_priority(
        window,
        config.always_on_top,
        config.visible_on_all_workspaces,
        force_focus,
    )
}

pub fn get_session_widget_profile(app: &AppHandle) -> SessionWidgetProfile {
    let config = resolve_window_config(app, WidgetWindowTarget::Session);
    build_session_widget_profile(&config)
}

pub fn show_main_window(app: &AppHandle) -> Result<(), String> {
    let main_window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window not found".to_string())?;

    if main_window.is_minimized().map_err(|error| error.to_string())? {
        main_window
            .unminimize()
            .map_err(|error| error.to_string())?;
    }

    main_window.show().map_err(|error| error.to_string())?;
    main_window
        .set_focus()
        .map_err(|error| error.to_string())?;

    hide_auxiliary_window(app, STARTUP_WIDGET_LABEL)?;
    hide_auxiliary_window(app, SESSION_WIDGET_LABEL)?;

    Ok(())
}

pub fn show_session_widget_window(app: &AppHandle) -> Result<(), String> {
    let main_window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window not found".to_string())?;
    let config = resolve_window_config(app, WidgetWindowTarget::Session);
    let widget_window = ensure_auxiliary_window(app, SESSION_WIDGET_LABEL, &config)
        .map_err(|error| error.to_string())?;

    position_session_widget(&main_window, &widget_window, &config)?;
    widget_window.show().map_err(|error| error.to_string())?;
    reinforce_widget_priority(
        &widget_window,
        config.always_on_top,
        config.visible_on_all_workspaces,
        true,
    )?;
    main_window.hide().map_err(|error| error.to_string())?;

    Ok(())
}

pub fn show_startup_widget_window(app: &AppHandle) -> Result<(), String> {
    let main_window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window not found".to_string())?;
    let config = resolve_window_config(app, WidgetWindowTarget::Startup);
    let widget_window = ensure_auxiliary_window(app, STARTUP_WIDGET_LABEL, &config)
        .map_err(|error| error.to_string())?;

    widget_window.show().map_err(|error| error.to_string())?;
    reinforce_widget_priority(
        &widget_window,
        config.always_on_top,
        config.visible_on_all_workspaces,
        true,
    )?;
    main_window.hide().map_err(|error| error.to_string())?;

    Ok(())
}

pub fn start_widget_window_drag(window: &WebviewWindow) -> Result<(), String> {
    window.start_dragging().map_err(|error| error.to_string())
}

fn ensure_auxiliary_window(
    app: &AppHandle,
    label: &str,
    config: &AuxiliaryWindowConfig,
) -> tauri::Result<WebviewWindow> {
    if let Some(window) = app.get_webview_window(label) {
        return Ok(window);
    }

    let mut builder = WebviewWindowBuilder::new(app, label, WebviewUrl::App("index.html".into()))
        .title(&config.title)
        .inner_size(config.width, config.height)
        .min_inner_size(config.min_width, config.min_height)
        .max_inner_size(config.max_width, config.max_height)
        .transparent(config.transparent)
        .decorations(config.decorations)
        .always_on_top(config.always_on_top)
        .visible_on_all_workspaces(config.visible_on_all_workspaces)
        .skip_taskbar(config.skip_taskbar)
        .resizable(config.resizable)
        .maximizable(config.maximizable)
        .minimizable(config.minimizable)
        .shadow(config.shadow);

    if config.center_on_create {
        builder = builder.center();
    }

    builder.build()
}

fn hide_auxiliary_window(app: &AppHandle, label: &str) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(label) {
        window.hide().map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn position_session_widget(
    main_window: &WebviewWindow,
    widget_window: &WebviewWindow,
    config: &AuxiliaryWindowConfig,
) -> Result<(), String> {
    let Some(monitor) = main_window
        .current_monitor()
        .map_err(|error| error.to_string())?
    else {
        return Ok(());
    };

    let monitor_position = monitor.position();
    let monitor_size = monitor.size();
    let width = config.width.round() as i32;
    let x = monitor_position.x + ((monitor_size.width as i32 - width) / 2);
    let y = monitor_position.y + config.top_offset.unwrap_or(24.0).round() as i32;

    widget_window
        .set_position(Position::Physical(PhysicalPosition::new(x, y)))
        .map_err(|error| error.to_string())
}

fn resolve_window_config(
    app: &AppHandle,
    target: WidgetWindowTarget,
) -> AuxiliaryWindowConfig {
    resolve_window_config_from_sources(
        target,
        &[
            app.path().app_config_dir().ok(),
            portable_config_directory(),
        ],
    )
}

fn resolve_window_config_from_sources(
    target: WidgetWindowTarget,
    override_roots: &[Option<PathBuf>],
) -> AuxiliaryWindowConfig {
    let defaults = target.default_config();
    let mut resolved = defaults;

    for override_root in override_roots.iter().flatten() {
        if let Some(override_config) =
            load_window_override_from_dir(Some(override_root.as_path()), target.label())
        {
            resolved = resolved.apply_override(override_config);
            break;
        }
    }

    resolved
}

fn load_window_override_from_dir(
    config_directory: Option<&Path>,
    label: &str,
) -> Option<AuxiliaryWindowConfigOverride> {
    let path = build_window_override_path(config_directory?, label);
    let raw = fs::read(&path).ok()?;

    match serde_json::from_slice::<AuxiliaryWindowConfigOverride>(&raw) {
        Ok(config) => Some(config),
        Err(error) => {
            eprintln!(
                "failed to parse widget window override {}: {}",
                path.display(),
                error
            );
            None
        }
    }
}

fn build_window_override_path(config_directory: &Path, label: &str) -> PathBuf {
    config_directory.join(WIDGET_OVERRIDE_DIRECTORY).join(format!(
        "{}.{}.json",
        label,
        env::consts::OS
    ))
}

fn portable_config_directory() -> Option<PathBuf> {
    let executable_path = env::current_exe().ok()?;
    let executable_directory = executable_path.parent()?;

    Some(executable_directory.join("config"))
}

fn build_session_widget_profile(config: &AuxiliaryWindowConfig) -> SessionWidgetProfile {
    SessionWidgetProfile {
        focus_policy: config
            .focus_policy
            .unwrap_or(SessionWidgetFocusPolicy::FocusOnOpen),
        surface_variant: config
            .surface_variant
            .unwrap_or(if config.transparent {
                SessionWidgetSurfaceVariant::GlassDefault
            } else {
                SessionWidgetSurfaceVariant::StableWindows
            }),
        transparent_window: config.transparent,
    }
}

fn reinforce_widget_priority(
    window: &WebviewWindow,
    always_on_top: bool,
    visible_on_all_workspaces: bool,
    force_focus: bool,
) -> Result<(), String> {
    window
        .set_always_on_top(always_on_top)
        .map_err(|error| error.to_string())?;
    window
        .set_visible_on_all_workspaces(visible_on_all_workspaces)
        .map_err(|error| error.to_string())?;

    #[cfg(windows)]
    {
        reinforce_widget_priority_windows(window, force_focus)?;
    }

    #[cfg(not(windows))]
    if force_focus {
        window.set_focus().map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[cfg(windows)]
fn reinforce_widget_priority_windows(
    window: &WebviewWindow,
    force_focus: bool,
) -> Result<(), String> {
    let hwnd = window.hwnd().map_err(|error| error.to_string())?;

    unsafe {
        let _ = ShowWindow(hwnd, SW_SHOWNORMAL);
        let _ = SetWindowPos(
            hwnd,
            Some(HWND_NOTOPMOST),
            0,
            0,
            0,
            0,
            SWP_ASYNCWINDOWPOS | SWP_NOMOVE | SWP_NOSIZE | SWP_NOOWNERZORDER,
        );
        let _ = SetWindowPos(
            hwnd,
            Some(HWND_TOPMOST),
            0,
            0,
            0,
            0,
            SWP_ASYNCWINDOWPOS
                | SWP_NOMOVE
                | SWP_NOSIZE
                | SWP_NOOWNERZORDER
                | SWP_SHOWWINDOW,
        );
        let _ = BringWindowToTop(hwnd);

        if force_focus {
            let _ = SetForegroundWindow(hwnd);
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        fs,
        sync::atomic::{AtomicU64, Ordering},
        time::{SystemTime, UNIX_EPOCH},
    };

    #[test]
    fn resolve_window_config_uses_defaults_when_override_is_missing() {
        let config = resolve_window_config_from_sources(WidgetWindowTarget::Startup, &[]);

        assert_eq!(config, WidgetWindowTarget::Startup.default_config());
    }

    #[test]
    fn resolve_window_config_applies_platform_override() {
        let temp_dir = create_temp_config_dir();
        let widgets_dir = temp_dir.join(WIDGET_OVERRIDE_DIRECTORY);
        fs::create_dir_all(&widgets_dir).unwrap();
        let override_path =
            build_window_override_path(&temp_dir, WidgetWindowTarget::Startup.label());

        fs::write(
            &override_path,
            r#"{"width":480,"alwaysOnTop":false,"title":"Windows Startup Widget"}"#,
        )
        .unwrap();

        let config = resolve_window_config_from_sources(
            WidgetWindowTarget::Startup,
            &[Some(temp_dir.clone())],
        );

        assert_eq!(config.width, 480.0);
        assert!(!config.always_on_top);
        assert_eq!(config.title, "Windows Startup Widget");

        fs::remove_dir_all(&temp_dir).unwrap();
    }

    #[test]
    fn resolve_window_config_ignores_invalid_override_files() {
        let temp_dir = create_temp_config_dir();
        let widgets_dir = temp_dir.join(WIDGET_OVERRIDE_DIRECTORY);
        fs::create_dir_all(&widgets_dir).unwrap();
        let override_path =
            build_window_override_path(&temp_dir, WidgetWindowTarget::Session.label());

        fs::write(&override_path, "{not-json").unwrap();

        let config = resolve_window_config_from_sources(
            WidgetWindowTarget::Session,
            &[Some(temp_dir.clone())],
        );

        assert_eq!(config, WidgetWindowTarget::Session.default_config());

        fs::remove_dir_all(&temp_dir).unwrap();
    }

    #[test]
    fn resolve_window_config_prefers_app_config_dir_over_portable_override() {
        let app_config_dir = create_temp_config_dir();
        let portable_config_dir = create_temp_config_dir();
        fs::create_dir_all(app_config_dir.join(WIDGET_OVERRIDE_DIRECTORY)).unwrap();
        fs::create_dir_all(portable_config_dir.join(WIDGET_OVERRIDE_DIRECTORY)).unwrap();

        fs::write(
            build_window_override_path(&app_config_dir, WidgetWindowTarget::Session.label()),
            r#"{"title":"App Config Session","surfaceVariant":"stable-windows","transparent":false}"#,
        )
        .unwrap();
        fs::write(
            build_window_override_path(&portable_config_dir, WidgetWindowTarget::Session.label()),
            r#"{"title":"Portable Session","surfaceVariant":"glass-default","transparent":true}"#,
        )
        .unwrap();

        let config = resolve_window_config_from_sources(
            WidgetWindowTarget::Session,
            &[Some(app_config_dir.clone()), Some(portable_config_dir.clone())],
        );

        assert_eq!(config.title, "App Config Session");
        assert_eq!(config.surface_variant, Some(SessionWidgetSurfaceVariant::StableWindows));
        assert_eq!(config.transparent, false);

        fs::remove_dir_all(app_config_dir).unwrap();
        fs::remove_dir_all(portable_config_dir).unwrap();
    }

    #[test]
    fn session_widget_profile_matches_stable_windows_defaults() {
        let mut config = WidgetWindowTarget::Session.default_config();
        config.transparent = false;
        config.focus_policy = Some(SessionWidgetFocusPolicy::FocusOnOpen);
        config.surface_variant = Some(SessionWidgetSurfaceVariant::StableWindows);

        let profile = build_session_widget_profile(&config);

        assert_eq!(profile.transparent_window, false);
        assert_eq!(profile.focus_policy, SessionWidgetFocusPolicy::FocusOnOpen);
        assert_eq!(profile.surface_variant, SessionWidgetSurfaceVariant::StableWindows);
    }

    fn create_temp_config_dir() -> PathBuf {
        static NEXT_ID: AtomicU64 = AtomicU64::new(0);

        let suffix = NEXT_ID.fetch_add(1, Ordering::Relaxed);
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = env::temp_dir().join(format!(
            "execunow-widget-config-test-{}-{}",
            now, suffix
        ));

        fs::create_dir_all(&path).unwrap();

        path
    }
}

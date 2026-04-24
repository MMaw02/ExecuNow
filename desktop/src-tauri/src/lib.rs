pub mod blocking;

use serde::Deserialize;
use tauri::{
    Manager, PhysicalPosition, Position, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    BringWindowToTop, SetForegroundWindow, SetWindowPos, ShowWindow, HWND_NOTOPMOST, HWND_TOPMOST,
    SWP_ASYNCWINDOWPOS, SWP_NOMOVE, SWP_NOOWNERZORDER, SWP_NOSIZE, SWP_SHOWWINDOW,
    SW_SHOWNORMAL,
};

const MAIN_WINDOW_LABEL: &str = "main";
const STARTUP_WIDGET_LABEL: &str = "startup-widget";
const SESSION_WIDGET_LABEL: &str = "session-widget";
const STARTUP_WIDGET_CONFIG_JSON: &str =
    include_str!("../../src/features/widget/widget.window.config.json");
const SESSION_WIDGET_CONFIG_JSON: &str =
    include_str!("../../src/features/session/session-widget.window.config.json");

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
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
    visible_on_all_workspaces: Option<bool>,
    skip_taskbar: bool,
    resizable: bool,
    maximizable: bool,
    minimizable: bool,
    shadow: bool,
    top_offset: Option<f64>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn apply_web_blocking(domains: Vec<String>) -> Result<blocking::BlockingApplyResult, String> {
    blocking::apply_web_blocking(domains)
}

#[tauri::command]
fn clear_web_blocking() -> Result<(), String> {
    blocking::clear_web_blocking()
}

#[tauri::command]
fn get_web_blocking_status() -> Result<blocking::WebBlockingStatus, String> {
    blocking::get_web_blocking_status()
}

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    let main_window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window not found".to_string())?;

    if main_window.is_minimized().map_err(|error| error.to_string())? {
        main_window
            .unminimize()
            .map_err(|error| error.to_string())?;
    }

    main_window.show().map_err(|error| error.to_string())?;
    main_window.set_focus().map_err(|error| error.to_string())?;

    hide_auxiliary_window(&app, STARTUP_WIDGET_LABEL)?;
    hide_auxiliary_window(&app, SESSION_WIDGET_LABEL)?;

    Ok(())
}

#[tauri::command]
fn show_widget_window(app: tauri::AppHandle) -> Result<(), String> {
    let main_window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window not found".to_string())?;

    if let Some(widget_window) = app.get_webview_window(STARTUP_WIDGET_LABEL) {
        widget_window.show().map_err(|error| error.to_string())?;
        widget_window
            .set_focus()
            .map_err(|error| error.to_string())?;
    } else {
        create_startup_widget(&app).map_err(|error| error.to_string())?;
    }

    main_window.hide().map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
fn show_session_widget_window(app: tauri::AppHandle) -> Result<(), String> {
    let main_window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window not found".to_string())?;
    let config = load_session_widget_window_config().map_err(|error| error.to_string())?;
    let widget_window =
        ensure_auxiliary_window(&app, SESSION_WIDGET_LABEL, &config).map_err(|error| error.to_string())?;

    position_session_widget(&main_window, &widget_window, &config)?;
    widget_window.show().map_err(|error| error.to_string())?;
    reinforce_widget_priority(
        &widget_window,
        config.always_on_top,
        config.visible_on_all_workspaces.unwrap_or(false),
        true,
    )?;
    main_window.hide().map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
fn reinforce_session_widget_z_order(
    window: tauri::WebviewWindow,
    force_focus: bool,
) -> Result<(), String> {
    let config = load_session_widget_window_config().map_err(|error| error.to_string())?;

    reinforce_widget_priority(
        &window,
        config.always_on_top,
        config.visible_on_all_workspaces.unwrap_or(false),
        force_focus,
    )
}

#[tauri::command]
fn hide_session_widget_window(app: tauri::AppHandle) -> Result<(), String> {
    hide_auxiliary_window(&app, SESSION_WIDGET_LABEL)
}

#[tauri::command]
fn start_widget_window_drag(window: tauri::WebviewWindow) -> Result<(), String> {
    window.start_dragging().map_err(|error| error.to_string())
}

fn create_startup_widget(app: &tauri::AppHandle) -> tauri::Result<()> {
    let config = load_startup_widget_window_config()?;
    ensure_auxiliary_window(app, STARTUP_WIDGET_LABEL, &config).map(|_| ())
}

fn ensure_auxiliary_window(
    app: &tauri::AppHandle,
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
        .visible_on_all_workspaces(config.visible_on_all_workspaces.unwrap_or(false))
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

fn hide_auxiliary_window(app: &tauri::AppHandle, label: &str) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(label) {
        window.hide().map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn load_startup_widget_window_config() -> tauri::Result<AuxiliaryWindowConfig> {
    serde_json::from_str(STARTUP_WIDGET_CONFIG_JSON).map_err(Into::into)
}

fn load_session_widget_window_config() -> tauri::Result<AuxiliaryWindowConfig> {
    serde_json::from_str(SESSION_WIDGET_CONFIG_JSON).map_err(Into::into)
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if let Err(error) = blocking::cleanup_stale_web_blocking() {
                eprintln!("{}", error);
            }
            create_startup_widget(&app.handle())?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            apply_web_blocking,
            clear_web_blocking,
            get_web_blocking_status,
            show_main_window,
            show_widget_window,
            show_session_widget_window,
            reinforce_session_widget_z_order,
            hide_session_widget_window,
            start_widget_window_drag
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

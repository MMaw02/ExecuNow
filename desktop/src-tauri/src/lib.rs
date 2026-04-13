use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

const MAIN_WINDOW_LABEL: &str = "main";
const STARTUP_WIDGET_LABEL: &str = "startup-widget";

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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

    if let Some(widget_window) = app.get_webview_window(STARTUP_WIDGET_LABEL) {
        widget_window.close().map_err(|error| error.to_string())?;
    }

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

fn create_startup_widget(app: &tauri::AppHandle) -> tauri::Result<()> {
    if app.get_webview_window(STARTUP_WIDGET_LABEL).is_some() {
        return Ok(());
    }

    WebviewWindowBuilder::new(
        app,
        STARTUP_WIDGET_LABEL,
        WebviewUrl::App("index.html".into()),
    )
    .title("ExecuNow Widget")
    .inner_size(420.0, 560.0)
    .min_inner_size(420.0, 560.0)
    .max_inner_size(420.0, 560.0)
    .center()
    .transparent(true)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .maximizable(false)
    .minimizable(false)
    .shadow(false)
    .build()?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            create_startup_widget(&app.handle())?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            show_main_window,
            show_widget_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

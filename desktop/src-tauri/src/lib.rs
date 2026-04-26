pub mod blocking;
mod widget_windows;

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
    widget_windows::show_main_window(&app)
}

#[tauri::command]
fn show_startup_widget_window(app: tauri::AppHandle) -> Result<(), String> {
    widget_windows::show_startup_widget_window(&app)
}

#[tauri::command]
fn show_session_widget_window(app: tauri::AppHandle) -> Result<(), String> {
    widget_windows::show_session_widget_window(&app)
}

#[tauri::command]
fn get_session_widget_profile(app: tauri::AppHandle) -> widget_windows::SessionWidgetProfile {
    widget_windows::get_session_widget_profile(&app)
}

#[tauri::command]
fn reinforce_session_widget_z_order(
    window: tauri::WebviewWindow,
    app: tauri::AppHandle,
    force_focus: bool,
) -> Result<(), String> {
    widget_windows::reinforce_session_widget_z_order(&window, &app, force_focus)
}

#[tauri::command]
fn hide_session_widget_window(app: tauri::AppHandle) -> Result<(), String> {
    widget_windows::hide_session_widget_window(&app)
}

#[tauri::command]
fn start_widget_window_drag(window: tauri::WebviewWindow) -> Result<(), String> {
    widget_windows::start_widget_window_drag(&window)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if let Err(error) = blocking::cleanup_stale_web_blocking() {
                eprintln!("{}", error);
            }
            widget_windows::create_startup_widget(&app.handle())?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            apply_web_blocking,
            clear_web_blocking,
            get_web_blocking_status,
            show_main_window,
            show_startup_widget_window,
            show_session_widget_window,
            get_session_widget_profile,
            reinforce_session_widget_z_order,
            hide_session_widget_window,
            start_widget_window_drag
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

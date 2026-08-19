use tauri::AppHandle;

#[tauri::command]
fn show_notification(app: AppHandle, title: String, body: String) {
    #[cfg(desktop)]
    {
        use tauri_plugin_notification::NotificationExt;
        let _ = app
            .notification()
            .builder()
            .title(&title)
            .body(&body)
            .show();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![show_notification])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

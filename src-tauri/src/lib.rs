use std::process::Command;
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

#[tauri::command]
fn get_system_volume() -> u32 {
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("osascript")
            .args(["-e", "output volume of (get volume settings)"])
            .output();
        if let Ok(out) = output {
            if let Ok(s) = String::from_utf8(out.stdout) {
                if let Ok(v) = s.trim().parse::<u32>() {
                    return v;
                }
            }
        }
    }
    50
}

#[tauri::command]
fn set_system_volume(volume: u32) {
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("osascript")
            .args([
                "-e",
                &format!("set volume output volume {}", volume),
            ])
            .output();
    }
}

#[tauri::command]
fn lower_volume_for_alarm() -> u32 {
    let original = get_system_volume();
    let lower = if original < 30 { original } else { 20 };
    set_system_volume(lower);
    original
}

#[tauri::command]
fn restore_volume(volume: u32) {
    set_system_volume(volume);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            show_notification,
            get_system_volume,
            set_system_volume,
            lower_volume_for_alarm,
            restore_volume
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

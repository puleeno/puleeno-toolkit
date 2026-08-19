use std::process::Command;
use tauri::{
    AppHandle, Manager,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    menu::{Menu, MenuItem},
};

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

#[tauri::command]
fn set_dock_icon_visible(visible: bool) {
    #[cfg(target_os = "macos")]
    {
        let script = if visible {
            r#"tell application "System Events" to set visible of process "puleeno-toolkit" to true"#
        } else {
            r#"tell application "System Events" to set visible of process "puleeno-toolkit" to false"#
        };
        let _ = Command::new("osascript")
            .args(["-e", script])
            .output();
    }
    let _ = visible;
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let show_item = MenuItem::with_id(app, "show", "Show Timer", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Puleeno Toolkit - Timer")
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    let app = tray.app_handle();
                    match event {
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        TrayIconEvent::DoubleClick {
                            button: MouseButton::Left,
                            ..
                        } => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            show_notification,
            get_system_volume,
            set_system_volume,
            lower_volume_for_alarm,
            restore_volume,
            set_dock_icon_visible
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

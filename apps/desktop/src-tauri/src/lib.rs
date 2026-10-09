mod claude;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .manage(claude::ClaudeProcess::default())
        .setup(|app| {
            app.manage(claude::start_mcp_server()?);
            // macOS keeps native decorations + the transparent overlay title bar.
            // Windows goes fully borderless; we render our own controls.
            #[cfg(target_os = "windows")]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_decorations(false);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            claude::claude_start,
            claude::claude_send,
            claude::claude_stop
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                app.state::<claude::ClaudeProcess>().kill();
            }
        });
}

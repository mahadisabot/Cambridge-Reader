mod commands;
pub mod session;

use commands::{login, list_books, restore_session, logout, create_account, search_books, add_to_library, fetch_cover, download_book, delete_book, launch_readest, patch_readest_settings, patch_book_config, AppState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .manage(AppState::new())
    .invoke_handler(tauri::generate_handler![login, list_books, restore_session, logout, create_account, search_books, add_to_library, fetch_cover, download_book, delete_book, launch_readest, patch_readest_settings, patch_book_config])
    .setup(|app| {
      if cfg!(debug_assertions) {
        /*
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
        */
      }
      Ok(())
    })
    .on_window_event(|window, event| {
        if let tauri::WindowEvent::CloseRequested { .. } = event {
             std::process::exit(0);
        }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

// Module declarations
mod config;
mod ffmpeg;
mod recorder;
mod native_recorder;
// mod cache;  // Disabled - placeholder implementation not needed for MVP

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .manage(recorder::RecordingState::new())
    .manage(native_recorder::NativeRecorderState::new())
    .invoke_handler(tauri::generate_handler![
      ffmpeg::export_video,
      recorder::start_screen_record,
      recorder::stop_screen_record,
      recorder::get_recording_status,
      recorder::save_recording,
      native_recorder::start_native_recording,
      native_recorder::stop_native_recording,
      native_recorder::get_native_recording_status,
      native_recorder::list_displays
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Cache module disabled for MVP - placeholder implementation only
      // TODO: Initialize cache service when Redis is fully configured
      // let cache = cache::CacheService::new("redis://localhost:6379")?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

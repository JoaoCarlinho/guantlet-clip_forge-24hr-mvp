// Module declarations
mod config;
mod cache;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // TODO: Initialize cache service when Redis is fully configured
      // let cache = cache::CacheService::new("redis://localhost:6379")?;
      log::info!("Cache module loaded (placeholder mode)");

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

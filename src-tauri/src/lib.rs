// Module declarations
mod config;
// mod cache;  // Disabled - placeholder implementation not needed for MVP

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

      // Cache module disabled for MVP - placeholder implementation only
      // TODO: Initialize cache service when Redis is fully configured
      // let cache = cache::CacheService::new("redis://localhost:6379")?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

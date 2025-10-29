use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub redis_url: String,
    pub redis_host: String,
    pub redis_port: u16,
    pub ffmpeg_path: String,
    pub log_level: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            redis_url: "redis://localhost:6379".to_string(),
            redis_host: "localhost".to_string(),
            redis_port: 6379,
            ffmpeg_path: "/opt/homebrew/bin/ffmpeg".to_string(),
            log_level: "info".to_string(),
        }
    }
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            redis_host: env::var("REDIS_HOST").unwrap_or_else(|_| "localhost".to_string()),
            redis_port: env::var("REDIS_PORT")
                .unwrap_or_else(|_| "6379".to_string())
                .parse()
                .unwrap_or(6379),
            ffmpeg_path: env::var("FFMPEG_PATH")
                .unwrap_or_else(|_| "/opt/homebrew/bin/ffmpeg".to_string()),
            log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
        }
    }
}

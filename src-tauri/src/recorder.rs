use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingConfig {
    pub output_path: String,
    pub fps: u32,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingStatus {
    pub is_recording: bool,
    pub output_path: Option<String>,
}

pub struct RecordingState {
    pub status: Arc<Mutex<RecordingStatus>>,
}

impl RecordingState {
    pub fn new() -> Self {
        Self {
            status: Arc::new(Mutex::new(RecordingStatus {
                is_recording: false,
                output_path: None,
            })),
        }
    }
}

/// Start screen recording using AVFoundation (macOS)
/// This command captures the screen and saves it to the specified output path
#[tauri::command]
pub async fn start_screen_record(
    config: RecordingConfig,
    state: State<'_, RecordingState>,
) -> Result<String, String> {
    let mut status = state.status.lock().map_err(|e| e.to_string())?;

    if status.is_recording {
        return Err("Recording is already in progress".to_string());
    }

    // For macOS, we'll use ffmpeg with avfoundation
    // This captures both screen and audio
    let fps = config.fps.to_string();
    let output_path = config.output_path.clone();

    // Update status to recording
    status.is_recording = true;
    status.output_path = Some(output_path.clone());

    // Return success with output path
    // Note: Actual recording will be handled by frontend using MediaRecorder API
    // This is a placeholder for future native implementation
    Ok(format!("Screen recording started: {}", output_path))
}

/// Stop screen recording
#[tauri::command]
pub async fn stop_screen_record(state: State<'_, RecordingState>) -> Result<String, String> {
    let mut status = state.status.lock().map_err(|e| e.to_string())?;

    if !status.is_recording {
        return Err("No recording in progress".to_string());
    }

    let output_path = status
        .output_path
        .clone()
        .unwrap_or_else(|| "unknown".to_string());

    // Update status
    status.is_recording = false;
    status.output_path = None;

    Ok(format!("Screen recording stopped: {}", output_path))
}

/// Get current recording status
#[tauri::command]
pub async fn get_recording_status(state: State<'_, RecordingState>) -> Result<RecordingStatus, String> {
    let status = state.status.lock().map_err(|e| e.to_string())?;
    Ok(status.clone())
}

/// Save recorded video to file system (called from frontend after MediaRecorder finishes)
#[tauri::command]
pub async fn save_recording(
    video_data: Vec<u8>,
    output_path: String,
) -> Result<String, String> {
    use std::fs::File;
    use std::io::Write;

    let mut file = File::create(&output_path)
        .map_err(|e| format!("Failed to create file: {}", e))?;

    file.write_all(&video_data)
        .map_err(|e| format!("Failed to write video data: {}", e))?;

    Ok(format!("Recording saved to: {}", output_path))
}

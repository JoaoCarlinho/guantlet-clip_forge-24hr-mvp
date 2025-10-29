use serde::{Deserialize, Serialize};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::State;
use anyhow::{Result, anyhow};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeRecordingConfig {
    pub output_path: String,
    pub fps: u32,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub audio: bool,
    pub display_id: Option<u32>, // For multi-monitor support
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeRecordingStatus {
    pub is_recording: bool,
    pub output_path: Option<String>,
    pub error: Option<String>,
}

pub struct NativeRecorderState {
    pub status: Arc<Mutex<NativeRecordingStatus>>,
    pub process: Arc<Mutex<Option<Child>>>,
}

impl NativeRecorderState {
    pub fn new() -> Self {
        Self {
            status: Arc::new(Mutex::new(NativeRecordingStatus {
                is_recording: false,
                output_path: None,
                error: None,
            })),
            process: Arc::new(Mutex::new(None)),
        }
    }
}

/// Start native screen recording using platform-specific methods
#[tauri::command]
pub async fn start_native_recording(
    config: NativeRecordingConfig,
    state: State<'_, NativeRecorderState>,
) -> Result<String, String> {
    let mut status = state.status.lock().map_err(|e| e.to_string())?;

    if status.is_recording {
        return Err("Recording is already in progress".to_string());
    }

    log::info!("Starting native recording with config: {:?}", config);

    // Start platform-specific recording
    let child = match start_platform_recording(&config) {
        Ok(child) => child,
        Err(e) => {
            let error_msg = format!("Failed to start recording: {}", e);
            log::error!("{}", error_msg);
            status.error = Some(error_msg.clone());
            return Err(error_msg);
        }
    };

    // Store the process
    let mut process = state.process.lock().map_err(|e| e.to_string())?;
    *process = Some(child);

    // Update status
    status.is_recording = true;
    status.output_path = Some(config.output_path.clone());
    status.error = None;

    log::info!("Native recording started successfully: {}", config.output_path);
    Ok(format!("Native screen recording started: {}", config.output_path))
}

/// Stop native screen recording
#[tauri::command]
pub async fn stop_native_recording(
    state: State<'_, NativeRecorderState>,
) -> Result<String, String> {
    let mut status = state.status.lock().map_err(|e| e.to_string())?;

    if !status.is_recording {
        return Err("No recording in progress".to_string());
    }

    let output_path = status
        .output_path
        .clone()
        .unwrap_or_else(|| "unknown".to_string());

    log::info!("Stopping native recording: {}", output_path);

    // Stop the recording process
    let mut process = state.process.lock().map_err(|e| e.to_string())?;
    if let Some(mut child) = process.take() {
        // Send SIGINT to gracefully stop recording
        #[cfg(unix)]
        {
            use std::os::unix::process::CommandExt;
            unsafe {
                libc::kill(child.id() as i32, libc::SIGINT);
            }

            // Wait a bit for graceful shutdown
            std::thread::sleep(std::time::Duration::from_millis(500));

            // Force kill if still running
            let _ = child.kill();
        }

        #[cfg(windows)]
        {
            let _ = child.kill();
        }

        let _ = child.wait();
        log::info!("Recording process terminated");
    }

    // Update status
    status.is_recording = false;
    status.output_path = None;

    Ok(format!("Native screen recording stopped: {}", output_path))
}

/// Get current native recording status
#[tauri::command]
pub async fn get_native_recording_status(
    state: State<'_, NativeRecorderState>,
) -> Result<NativeRecordingStatus, String> {
    let status = state.status.lock().map_err(|e| e.to_string())?;
    Ok(status.clone())
}

/// Platform-specific recording implementation
#[cfg(target_os = "macos")]
fn start_platform_recording(config: &NativeRecordingConfig) -> Result<Child> {
    log::info!("Starting macOS screen recording using ffmpeg with avfoundation");

    // Check if ffmpeg is available
    let ffmpeg_check = Command::new("ffmpeg")
        .arg("-version")
        .output();

    if ffmpeg_check.is_err() {
        return Err(anyhow!("FFmpeg not found. Please install FFmpeg: brew install ffmpeg"));
    }

    // Build ffmpeg command for macOS screen capture
    // Use avfoundation for screen capture
    let mut cmd = Command::new("ffmpeg");

    // Input from screen capture
    // Capture device format: [desktop index]:[audio device index or "none"]
    cmd.arg("-f").arg("avfoundation");
    cmd.arg("-capture_cursor").arg("1");
    cmd.arg("-capture_mouse_clicks").arg("1");
    cmd.arg("-framerate").arg(config.fps.to_string());

    // Input device selection
    // "1" is typically the main display, "none" for no audio
    let input_device = if config.audio {
        "1:0" // Screen + default audio input
    } else {
        "1:none" // Screen only
    };
    cmd.arg("-i").arg(input_device);

    // Video codec settings
    cmd.arg("-c:v").arg("libx264");
    cmd.arg("-preset").arg("ultrafast");
    cmd.arg("-crf").arg("23");

    // Resolution (if specified)
    if let (Some(width), Some(height)) = (config.width, config.height) {
        cmd.arg("-s").arg(format!("{}x{}", width, height));
    }

    // Audio codec settings (if audio enabled)
    if config.audio {
        cmd.arg("-c:a").arg("aac");
        cmd.arg("-b:a").arg("128k");
    }

    // Output file
    cmd.arg("-y"); // Overwrite output file
    cmd.arg(&config.output_path);

    // Set up process I/O
    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::null());

    log::info!("FFmpeg command: {:?}", cmd);

    // Spawn the process
    let child = cmd.spawn()
        .map_err(|e| anyhow!("Failed to spawn ffmpeg process: {}", e))?;

    Ok(child)
}

#[cfg(target_os = "linux")]
fn start_platform_recording(config: &NativeRecordingConfig) -> Result<Child> {
    log::info!("Starting Linux screen recording using ffmpeg with x11grab");

    // Check if ffmpeg is available
    let ffmpeg_check = Command::new("ffmpeg")
        .arg("-version")
        .output();

    if ffmpeg_check.is_err() {
        return Err(anyhow!("FFmpeg not found. Please install FFmpeg: sudo apt install ffmpeg"));
    }

    // Build ffmpeg command for Linux screen capture using x11grab
    let mut cmd = Command::new("ffmpeg");

    // Input from X11 display
    cmd.arg("-f").arg("x11grab");
    cmd.arg("-framerate").arg(config.fps.to_string());

    // Get display resolution or use config
    let video_size = if let (Some(width), Some(height)) = (config.width, config.height) {
        format!("{}x{}", width, height)
    } else {
        // Try to detect screen resolution
        "1920x1080".to_string() // Default fallback
    };
    cmd.arg("-video_size").arg(&video_size);

    // Input device (display)
    cmd.arg("-i").arg(":0.0");

    // Audio input (if enabled)
    if config.audio {
        cmd.arg("-f").arg("pulse");
        cmd.arg("-i").arg("default");
        cmd.arg("-c:a").arg("aac");
        cmd.arg("-b:a").arg("128k");
    }

    // Video codec settings
    cmd.arg("-c:v").arg("libx264");
    cmd.arg("-preset").arg("ultrafast");
    cmd.arg("-crf").arg("23");

    // Output file
    cmd.arg("-y"); // Overwrite output file
    cmd.arg(&config.output_path);

    // Set up process I/O
    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::null());

    log::info!("FFmpeg command: {:?}", cmd);

    // Spawn the process
    let child = cmd.spawn()
        .map_err(|e| anyhow!("Failed to spawn ffmpeg process: {}", e))?;

    Ok(child)
}

#[cfg(target_os = "windows")]
fn start_platform_recording(config: &NativeRecordingConfig) -> Result<Child> {
    log::info!("Starting Windows screen recording using ffmpeg with gdigrab");

    // Check if ffmpeg is available
    let ffmpeg_check = Command::new("ffmpeg")
        .arg("-version")
        .output();

    if ffmpeg_check.is_err() {
        return Err(anyhow!("FFmpeg not found. Please install FFmpeg from https://ffmpeg.org/download.html"));
    }

    // Build ffmpeg command for Windows screen capture using gdigrab
    let mut cmd = Command::new("ffmpeg");

    // Input from desktop
    cmd.arg("-f").arg("gdigrab");
    cmd.arg("-framerate").arg(config.fps.to_string());
    cmd.arg("-draw_mouse").arg("1");

    // Input device (desktop)
    cmd.arg("-i").arg("desktop");

    // Audio input (if enabled)
    if config.audio {
        cmd.arg("-f").arg("dshow");
        cmd.arg("-i").arg("audio=\"Microphone\"");
        cmd.arg("-c:a").arg("aac");
        cmd.arg("-b:a").arg("128k");
    }

    // Video codec settings
    cmd.arg("-c:v").arg("libx264");
    cmd.arg("-preset").arg("ultrafast");
    cmd.arg("-crf").arg("23");

    // Resolution (if specified)
    if let (Some(width), Some(height)) = (config.width, config.height) {
        cmd.arg("-s").arg(format!("{}x{}", width, height));
    }

    // Output file
    cmd.arg("-y"); // Overwrite output file
    cmd.arg(&config.output_path);

    // Set up process I/O
    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::null());

    log::info!("FFmpeg command: {:?}", cmd);

    // Spawn the process
    let child = cmd.spawn()
        .map_err(|e| anyhow!("Failed to spawn ffmpeg process: {}", e))?;

    Ok(child)
}

/// List available display/screen devices
#[tauri::command]
pub async fn list_displays() -> Result<Vec<String>, String> {
    #[cfg(target_os = "macos")]
    {
        // Use ffmpeg to list AVFoundation devices
        let output = Command::new("ffmpeg")
            .arg("-f")
            .arg("avfoundation")
            .arg("-list_devices")
            .arg("true")
            .arg("-i")
            .arg("")
            .output()
            .map_err(|e| format!("Failed to list devices: {}", e))?;

        let stderr = String::from_utf8_lossy(&output.stderr);

        // Parse the output to extract display devices
        let displays: Vec<String> = stderr
            .lines()
            .filter(|line| line.contains("AVFoundation video devices"))
            .map(|line| line.to_string())
            .collect();

        Ok(displays)
    }

    #[cfg(not(target_os = "macos"))]
    {
        // For other platforms, return a simple list
        Ok(vec!["Primary Display".to_string()])
    }
}

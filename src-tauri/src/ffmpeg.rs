use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ClipSegment {
    pub file_path: String,
    pub source_start: f64,
    pub source_end: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportOptions {
    pub clips: Vec<ClipSegment>,
    pub output_path: String,
    pub quality: String, // "low", "medium", "high"
}

#[derive(Debug, Serialize)]
pub struct ExportProgress {
    pub progress: f64,
    pub message: String,
}

fn get_quality_params(quality: &str) -> (&str, &str) {
    match quality {
        "low" => ("28", "fast"),
        "high" => ("18", "slow"),
        _ => ("23", "medium"), // default medium
    }
}

#[tauri::command]
pub async fn export_video(options: ExportOptions) -> Result<String, String> {
    let (crf, preset) = get_quality_params(&options.quality);

    if options.clips.is_empty() {
        return Err("No clips to export".to_string());
    }

    // Check if FFmpeg is available
    let ffmpeg_check = Command::new("ffmpeg")
        .arg("-version")
        .output();

    if ffmpeg_check.is_err() {
        return Err("FFmpeg is not installed or not in PATH. Please install FFmpeg to use the export feature.".to_string());
    }

    if options.clips.len() == 1 {
        // Single clip export - simple trim
        let clip = &options.clips[0];
        let duration = clip.source_end - clip.source_start;

        let output = Command::new("ffmpeg")
            .arg("-i")
            .arg(&clip.file_path)
            .arg("-ss")
            .arg(clip.source_start.to_string())
            .arg("-t")
            .arg(duration.to_string())
            .arg("-c:v")
            .arg("libx264")
            .arg("-crf")
            .arg(crf)
            .arg("-preset")
            .arg(preset)
            .arg("-c:a")
            .arg("aac")
            .arg("-movflags")
            .arg("+faststart")
            .arg("-y") // Overwrite output file
            .arg(&options.output_path)
            .output()
            .map_err(|e| format!("Failed to execute FFmpeg: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("FFmpeg error: {}", stderr));
        }

        Ok(options.output_path)
    } else {
        // Multiple clips - need to concatenate
        // Create a temporary directory for intermediate files
        let temp_dir = std::env::temp_dir().join("clipforge_export");
        std::fs::create_dir_all(&temp_dir)
            .map_err(|e| format!("Failed to create temp directory: {}", e))?;

        let mut trimmed_files = Vec::new();

        // Step 1: Trim each clip
        for (i, clip) in options.clips.iter().enumerate() {
            let duration = clip.source_end - clip.source_start;
            let trimmed_path = temp_dir.join(format!("trimmed_{}.mp4", i));

            let output = Command::new("ffmpeg")
                .arg("-i")
                .arg(&clip.file_path)
                .arg("-ss")
                .arg(clip.source_start.to_string())
                .arg("-t")
                .arg(duration.to_string())
                .arg("-c")
                .arg("copy")
                .arg("-avoid_negative_ts")
                .arg("make_zero")
                .arg("-y")
                .arg(&trimmed_path)
                .output()
                .map_err(|e| format!("Failed to trim clip {}: {}", i, e))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("FFmpeg trim error for clip {}: {}", i, stderr));
            }

            trimmed_files.push(trimmed_path);
        }

        // Step 2: Create concat file
        let concat_file = temp_dir.join("concat_list.txt");
        let concat_content = trimmed_files
            .iter()
            .map(|p| format!("file '{}'", p.display()))
            .collect::<Vec<_>>()
            .join("\n");

        std::fs::write(&concat_file, concat_content)
            .map_err(|e| format!("Failed to write concat file: {}", e))?;

        // Step 3: Concatenate and encode
        let output = Command::new("ffmpeg")
            .arg("-f")
            .arg("concat")
            .arg("-safe")
            .arg("0")
            .arg("-i")
            .arg(&concat_file)
            .arg("-c:v")
            .arg("libx264")
            .arg("-crf")
            .arg(crf)
            .arg("-preset")
            .arg(preset)
            .arg("-c:a")
            .arg("aac")
            .arg("-b:a")
            .arg("192k")
            .arg("-movflags")
            .arg("+faststart")
            .arg("-y")
            .arg(&options.output_path)
            .output()
            .map_err(|e| format!("Failed to concatenate clips: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // Clean up temp files before returning error
            let _ = std::fs::remove_dir_all(&temp_dir);
            return Err(format!("FFmpeg concatenation error: {}", stderr));
        }

        // Clean up temp files
        std::fs::remove_dir_all(&temp_dir)
            .map_err(|e| format!("Warning: Failed to clean up temp files: {}", e))?;

        Ok(options.output_path)
    }
}

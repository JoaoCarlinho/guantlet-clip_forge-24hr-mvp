import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Clip } from '../logic/timelineLogic';
import type { ExportSettings, ExportQuality } from '../logic/projectLogic';

let ffmpeg: FFmpeg | null = null;

export interface ExportOptions {
  clips: Clip[];
  settings?: ExportSettings;
  onProgress?: (progress: number) => void;
  onLog?: (message: string) => void;
  signal?: AbortSignal; // Cancellation support
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  error?: string;
}

/**
 * Get quality parameters for FFmpeg encoding
 */
function getQualityParams(quality?: ExportQuality): { crf: string; preset: string } {
  const ExportQualityEnum = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  };

  switch (quality) {
    case ExportQualityEnum.LOW:
      return { crf: '28', preset: 'fast' };
    case ExportQualityEnum.HIGH:
      return { crf: '18', preset: 'slow' };
    case ExportQualityEnum.MEDIUM:
    default:
      return { crf: '23', preset: 'medium' };
  }
}

/**
 * Initialize FFmpeg instance
 */
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  // Set up progress callback
  ffmpeg.on('progress', ({ progress }) => {
    console.log(`FFmpeg progress: ${(progress * 100).toFixed(2)}%`);
  });

  // Load FFmpeg
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
}

/**
 * Export a single video clip with trim points applied (optimized path)
 */
async function exportSingleClip(options: ExportOptions): Promise<ExportResult> {
  const { clips, onProgress, onLog, signal } = options;

  try {
    const clip = clips[0];

    // Check for cancellation
    if (signal?.aborted) {
      throw new Error('Export cancelled by user');
    }

    onLog?.('Initializing FFmpeg...');
    const ffmpegInstance = await getFFmpeg();

    onLog?.(`Loading video file: ${clip.name}`);

    // Fetch the video file
    // Note: In a real Tauri app, you'd use the file system API
    // For now, we'll use the file path directly
    const videoData = await fetchFile(clip.filePath);
    await ffmpegInstance.writeFile('input.mp4', videoData);

    // Calculate duration based on source start/end
    const sourceStart = clip.sourceStart || 0;
    const sourceEnd = clip.sourceEnd || clip.duration;
    const exportDuration = sourceEnd - sourceStart;

    onLog?.(`Extracting from ${sourceStart}s to ${sourceEnd}s (duration: ${exportDuration}s)`);

    // Set up progress tracking
    if (onProgress) {
      ffmpegInstance.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    // Get quality settings
    const { crf, preset } = getQualityParams(options.settings?.quality);

    // Build FFmpeg command
    // -ss: start time (source start)
    // -t: duration (export duration)
    // -c:v libx264: H.264 codec
    // -crf: Constant Rate Factor (quality)
    // -preset: encoding speed preset
    // -c:a aac: AAC audio codec
    const args = [
      '-i', 'input.mp4',
      '-ss', sourceStart.toString(),
      '-t', exportDuration.toString(),
      '-c:v', 'libx264',
      '-crf', crf,
      '-preset', preset,
      '-c:a', 'aac',
      '-movflags', '+faststart', // Web optimization
      'output.mp4',
    ];

    onLog?.('Starting export...');
    await ffmpegInstance.exec(args);

    onLog?.('Reading output file...');
    const data = await ffmpegInstance.readFile('output.mp4');

    // Create blob from output
    const uint8Data = new Uint8Array(data as Uint8Array);
    const blob = new Blob([uint8Data], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    // Cleanup
    await ffmpegInstance.deleteFile('input.mp4');
    await ffmpegInstance.deleteFile('output.mp4');

    onLog?.('Export complete!');

    return {
      success: true,
      blob,
      url,
    };
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Export multiple clips as a single stitched video using FFmpeg concat demuxer
 */
async function exportMultipleClips(options: ExportOptions): Promise<ExportResult> {
  const { clips, onProgress, onLog, signal } = options;

  try {
    // Step 1: Initialize FFmpeg
    onLog?.('Initializing FFmpeg...');
    const ffmpegInstance = await getFFmpeg();

    // Check for cancellation
    if (signal?.aborted) {
      throw new Error('Export cancelled by user');
    }

    // Step 2: Write all video files to FFmpeg virtual filesystem
    onLog?.('Loading video files...');
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const filename = `input_${i}.mp4`;

      // Check for cancellation
      if (signal?.aborted) {
        throw new Error('Export cancelled by user');
      }

      // Fetch video file as array buffer
      const response = await fetch(clip.filePath);
      const arrayBuffer = await response.arrayBuffer();

      // Write to FFmpeg virtual FS
      await ffmpegInstance.writeFile(filename, new Uint8Array(arrayBuffer));
      onProgress?.(5 + (i / clips.length) * 15); // 5-20% for file loading
      onLog?.(`Loaded clip ${i + 1}/${clips.length}: ${clip.name}`);
    }

    // Step 3: Trim each clip individually (create intermediate files)
    onLog?.('Processing clips...');
    const trimmedFiles: string[] = [];

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const inputFile = `input_${i}.mp4`;
      const trimmedFile = `trimmed_${i}.mp4`;

      // Check for cancellation
      if (signal?.aborted) {
        throw new Error('Export cancelled by user');
      }

      // Calculate duration based on source start/end
      const sourceStart = clip.sourceStart || 0;
      const sourceEnd = clip.sourceEnd || clip.duration;
      const exportDuration = sourceEnd - sourceStart;

      // FFmpeg trim command
      await ffmpegInstance.exec([
        '-i', inputFile,
        '-ss', sourceStart.toString(),
        '-t', exportDuration.toString(),
        '-c', 'copy', // Use stream copy for speed (re-encode later)
        '-avoid_negative_ts', 'make_zero', // Fix timestamp issues
        trimmedFile
      ]);

      trimmedFiles.push(trimmedFile);
      onProgress?.(20 + (i / clips.length) * 30); // 20-50% for trimming
      onLog?.(`Trimmed clip ${i + 1}/${clips.length}`);

      // Cleanup original input to save memory
      await ffmpegInstance.deleteFile(inputFile);
    }

    // Check for cancellation
    if (signal?.aborted) {
      throw new Error('Export cancelled by user');
    }

    // Step 4: Create concat demuxer file list
    onLog?.('Preparing concatenation...');
    const concatFileContent = trimmedFiles
      .map(file => `file '${file}'`)
      .join('\n');

    await ffmpegInstance.writeFile(
      'concat_list.txt',
      new TextEncoder().encode(concatFileContent)
    );

    // Step 5: Concatenate with re-encoding for compatibility
    onLog?.('Stitching clips together...');

    // Get quality settings
    const { crf, preset } = getQualityParams(options.settings?.quality);

    // Set up progress tracking for encoding step
    if (onProgress) {
      ffmpegInstance.on('progress', ({ progress }) => {
        // Map FFmpeg's progress (0-1) to our range (50-90% for encoding step)
        const mappedProgress = 50 + (progress * 40);
        onProgress(Math.floor(mappedProgress));
      });
    }

    await ffmpegInstance.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat_list.txt',
      '-c:v', 'libx264',      // Re-encode video
      '-crf', crf,             // Dynamic quality
      '-preset', preset,       // Dynamic encoding speed
      '-c:a', 'aac',           // Re-encode audio
      '-b:a', '192k',          // Audio bitrate
      '-movflags', '+faststart', // Enable progressive playback
      'output.mp4'
    ]);

    onProgress?.(90);
    onLog?.('Finalizing export...');

    // Step 6: Read output file
    const data = await ffmpegInstance.readFile('output.mp4');
    const uint8Data = new Uint8Array(data as Uint8Array);
    const blob = new Blob([uint8Data], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    // Step 7: Cleanup virtual filesystem
    onLog?.('Cleaning up...');
    await ffmpegInstance.deleteFile('concat_list.txt');
    await ffmpegInstance.deleteFile('output.mp4');
    for (const file of trimmedFiles) {
      await ffmpegInstance.deleteFile(file);
    }

    onProgress?.(100);
    onLog?.('Export complete!');

    return {
      success: true,
      blob,
      url,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    onLog?.(`Export failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if we're running in Tauri desktop environment
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Export video using Tauri's native FFmpeg command (desktop only)
 */
async function exportVideoNative(options: ExportOptions): Promise<ExportResult> {
  const { clips, settings, onProgress, onLog } = options;

  try {
    onLog?.('Using native FFmpeg export...');

    // Import Tauri API
    const { invoke } = await import('@tauri-apps/api/core');
    const { save } = await import('@tauri-apps/plugin-dialog');

    // Show save dialog to get output path
    const outputPath = await save({
      defaultPath: `export-${Date.now()}.mp4`,
      filters: [{
        name: 'Video',
        extensions: ['mp4']
      }]
    });

    if (!outputPath) {
      return {
        success: false,
        error: 'Export cancelled by user',
      };
    }

    onLog?.('Preparing clips for export...');

    // Convert clips to format expected by Rust backend
    const clipSegments = clips.map(clip => ({
      file_path: clip.filePath,
      source_start: clip.sourceStart || 0,
      source_end: clip.sourceEnd || clip.duration,
    }));

    const quality = settings?.quality || 'medium';

    onProgress?.(10);
    onLog?.(`Exporting ${clips.length} clip(s) to ${outputPath}...`);

    // Call Tauri backend
    await invoke<string>('export_video', {
      options: {
        clips: clipSegments,
        output_path: outputPath,
        quality: quality,
      }
    });

    onProgress?.(90);
    onLog?.('Reading exported file...');

    // Read the exported file
    const { readFile } = await import('@tauri-apps/plugin-fs');
    const fileData = await readFile(outputPath);

    // Create blob from file
    const blob = new Blob([fileData], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    onProgress?.(100);
    onLog?.('Export complete!');

    return {
      success: true,
      blob,
      url,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    onLog?.(`Export failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Export video clips with trim points applied
 * Routes to native FFmpeg (desktop) or FFmpeg.wasm (browser) based on environment
 */
export async function exportVideo(options: ExportOptions): Promise<ExportResult> {
  const { clips, onLog } = options;

  if (clips.length === 0) {
    return {
      success: false,
      error: 'No clips to export',
    };
  }

  // Check if running in Tauri (desktop app)
  if (isTauri()) {
    onLog?.('🖥️ Desktop mode: Using native FFmpeg');
    return exportVideoNative(options);
  }

  // Browser mode: Use FFmpeg.wasm
  onLog?.('🌐 Browser mode: Using FFmpeg.wasm');

  if (clips.length === 1) {
    // Use optimized single-clip export
    return exportSingleClip(options);
  }

  // Use multi-clip concatenation
  return exportMultipleClips(options);
}

/**
 * Download the exported video file using Tauri save dialog
 */
export async function downloadVideo(blob: Blob, defaultFilename: string = 'exported-video.mp4'): Promise<void> {
  try {
    // Try to use Tauri's save dialog
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeFile } = await import('@tauri-apps/plugin-fs');

    // Show save dialog
    const filePath = await save({
      defaultPath: defaultFilename,
      filters: [{
        name: 'Video',
        extensions: ['mp4']
      }]
    });

    if (filePath) {
      // Convert blob to Uint8Array
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Write file using Tauri's fs plugin
      await writeFile(filePath, uint8Array);
      console.log(`✅ Video saved to: ${filePath}`);
    }
  } catch (error) {
    // Fallback to browser download if Tauri is not available
    console.log('Tauri not available, using browser download:', error);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

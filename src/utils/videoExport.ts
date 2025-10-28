import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Clip } from '../logic/timelineLogic';

let ffmpeg: FFmpeg | null = null;

export interface ExportOptions {
  clips: Clip[];
  onProgress?: (progress: number) => void;
  onLog?: (message: string) => void;
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  error?: string;
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
 * Export video clips with trim points applied
 */
export async function exportVideo(options: ExportOptions): Promise<ExportResult> {
  const { clips, onProgress, onLog } = options;

  try {
    if (clips.length === 0) {
      return {
        success: false,
        error: 'No clips to export',
      };
    }

    onLog?.('Initializing FFmpeg...');
    const ffmpegInstance = await getFFmpeg();

    onLog?.('Processing clips...');

    // For MVP, we'll export the first clip with trim points
    // Multi-clip concatenation can be added post-MVP
    const clip = clips[0];

    onLog?.(`Loading video file: ${clip.name}`);

    // Fetch the video file
    // Note: In a real Tauri app, you'd use the file system API
    // For now, we'll use the file path directly
    const videoData = await fetchFile(clip.filePath);
    await ffmpegInstance.writeFile('input.mp4', videoData);

    // Calculate trim duration
    const trimDuration = clip.trimEnd - clip.trimStart;

    onLog?.(`Trimming from ${clip.trimStart}s to ${clip.trimEnd}s (duration: ${trimDuration}s)`);

    // Set up progress tracking
    if (onProgress) {
      ffmpegInstance.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    // Build FFmpeg command
    // -ss: start time (trim start)
    // -t: duration (trim duration)
    // -c:v libx264: H.264 codec
    // -crf 23: Constant Rate Factor (quality, 23 is default/good quality)
    // -preset medium: encoding speed preset
    // -c:a aac: AAC audio codec
    const args = [
      '-i', 'input.mp4',
      '-ss', clip.trimStart.toString(),
      '-t', trimDuration.toString(),
      '-c:v', 'libx264',
      '-crf', '23',
      '-preset', 'medium',
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
 * Download the exported video file
 */
export function downloadVideo(blob: Blob, filename: string = 'exported-video.mp4') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

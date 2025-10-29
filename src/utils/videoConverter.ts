import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isFFmpegLoaded = false;

/**
 * Load FFmpeg.js (only needs to be done once)
 */
export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && isFFmpegLoaded) {
    return ffmpegInstance;
  }

  console.log('📦 Loading FFmpeg.js...');

  ffmpegInstance = new FFmpeg();

  // Load FFmpeg from CDN
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  isFFmpegLoaded = true;
  console.log('✅ FFmpeg.js loaded successfully');

  return ffmpegInstance;
}

/**
 * Convert WebM blob to MP4
 * @param webmBlob - The WebM video blob from MediaRecorder
 * @param onProgress - Optional callback for conversion progress
 * @returns MP4 blob
 */
export async function convertWebMToMP4(
  webmBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  console.log('🎬 Starting WebM to MP4 conversion...');
  console.log(`📊 Input size: ${(webmBlob.size / 1024 / 1024).toFixed(2)} MB`);

  try {
    // Load FFmpeg if not already loaded
    const ffmpeg = await loadFFmpeg();

    // Set up progress logging
    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        const percentage = Math.round(progress * 100);
        onProgress(percentage);
        console.log(`⏳ Conversion progress: ${percentage}%`);
      });
    }

    // Write input file to FFmpeg's virtual file system
    console.log('📝 Writing input file to FFmpeg...');
    const inputData = await fetchFile(webmBlob);
    await ffmpeg.writeFile('input.webm', inputData);

    // Run FFmpeg conversion
    // -i input.webm: input file
    // -c:v libx264: use H.264 video codec (MP4 standard)
    // -preset fast: balance between speed and quality
    // -crf 23: quality (18-28, lower = better quality)
    // -c:a aac: use AAC audio codec (MP4 standard)
    // -b:a 128k: audio bitrate
    // -movflags +faststart: optimize for web streaming
    console.log('🔄 Running FFmpeg conversion...');
    await ffmpeg.exec([
      '-i', 'input.webm',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      'output.mp4'
    ]);

    // Read output file from FFmpeg's virtual file system
    console.log('📖 Reading output file from FFmpeg...');
    const outputData = await ffmpeg.readFile('output.mp4');

    // Create blob from output data
    const mp4Blob = new Blob([outputData as BlobPart], { type: 'video/mp4' });
    console.log(`✅ Conversion complete! Output size: ${(mp4Blob.size / 1024 / 1024).toFixed(2)} MB`);

    // Clean up files from virtual file system
    await ffmpeg.deleteFile('input.webm');
    await ffmpeg.deleteFile('output.mp4');

    return mp4Blob;

  } catch (error) {
    console.error('❌ FFmpeg conversion failed:', error);
    throw new Error(`Failed to convert video to MP4: ${error}`);
  }
}

/**
 * Check if FFmpeg is supported in the current environment
 */
export function isFFmpegSupported(): boolean {
  // FFmpeg.js requires SharedArrayBuffer, which requires specific headers
  // Check if it's available
  return typeof SharedArrayBuffer !== 'undefined';
}

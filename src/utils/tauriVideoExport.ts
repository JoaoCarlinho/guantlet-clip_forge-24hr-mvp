import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import type { Clip } from '../logic/timelineLogic';
import type { ExportSettings } from '../logic/projectLogic';

export interface ExportOptions {
  clips: Clip[];
  settings?: ExportSettings;
  onProgress?: (progress: number) => void;
  onLog?: (message: string) => void;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

interface TauriClipSegment {
  file_path: string;
  source_start: number;
  source_end: number;
}

interface TauriExportOptions {
  clips: TauriClipSegment[];
  output_path: string;
  quality: string;
}

/**
 * Export video using Tauri's native FFmpeg integration
 */
export async function exportVideoNative(options: ExportOptions): Promise<ExportResult> {
  const { clips, settings, onProgress, onLog } = options;

  try {
    if (clips.length === 0) {
      return {
        success: false,
        error: 'No clips to export',
      };
    }

    // Show save dialog first
    onLog?.('Choosing save location...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const defaultFilename = `clipforge-export-${timestamp}.mp4`;

    const outputPath = await save({
      defaultPath: defaultFilename,
      filters: [{
        name: 'Video',
        extensions: ['mp4']
      }]
    });

    if (!outputPath) {
      // User cancelled
      return {
        success: false,
        error: 'Export cancelled by user',
      };
    }

    onLog?.(`Saving to: ${outputPath}`);
    onProgress?.(5);

    // Convert clips to Tauri format, handling blob URLs by saving to temp files
    const tauriClips: TauriClipSegment[] = [];
    const tempFiles: string[] = []; // Track temp files for cleanup

    for (const clip of clips) {
      let filePath = clip.originalFilePath || clip.filePath;

      // If we have a blob URL, we need to save it to a temp file first
      if (filePath.startsWith('blob:')) {
        try {
          onLog?.(`Converting blob URL for ${clip.name} to temporary file...`);

          // Fetch the blob data
          const response = await fetch(filePath);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // Create temp file using Tauri's temp directory
          const tempFileName = `clipforge_temp_${Date.now()}_${clip.name}`;

          // Write blob to temp file in the Temp base directory
          await writeFile(tempFileName, uint8Array, { baseDir: BaseDirectory.Temp });

          // Get the full path for FFmpeg (platform-specific temp dir + filename)
          const { tempDir } = await import('@tauri-apps/api/path');
          const tempDirPath = await tempDir();
          const tempFilePath = `${tempDirPath}${tempDirPath.endsWith('/') ? '' : '/'}${tempFileName}`;

          tempFiles.push(tempFileName); // Store just the filename for cleanup

          filePath = tempFilePath;
          onLog?.(`Saved to temporary file: ${tempFileName}`);
        } catch (error) {
          throw new Error(`Failed to convert blob URL for "${clip.name}": ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      tauriClips.push({
        file_path: filePath,
        source_start: clip.sourceStart || 0,
        source_end: clip.sourceEnd || clip.duration,
      });
    }

    onLog?.('Processing video...');
    onProgress?.(10);

    const tauriOptions: TauriExportOptions = {
      clips: tauriClips,
      output_path: outputPath,
      quality: settings?.quality || 'medium',
    };

    onLog?.('Calling FFmpeg...');

    try {
      const result = await invoke<string>('export_video', { options: tauriOptions });

      onProgress?.(100);
      onLog?.('Export complete!');

      // Cleanup temp files
      if (tempFiles.length > 0) {
        onLog?.('Cleaning up temporary files...');
        const { remove } = await import('@tauri-apps/plugin-fs');
        for (const tempFile of tempFiles) {
          try {
            await remove(tempFile, { baseDir: BaseDirectory.Temp });
          } catch (cleanupError) {
            console.warn(`Failed to cleanup temp file ${tempFile}:`, cleanupError);
          }
        }
      }

      return {
        success: true,
        filePath: result,
      };
    } catch (exportError) {
      // Cleanup temp files even if export fails
      if (tempFiles.length > 0) {
        const { remove } = await import('@tauri-apps/plugin-fs');
        for (const tempFile of tempFiles) {
          try {
            await remove(tempFile, { baseDir: BaseDirectory.Temp });
          } catch (cleanupError) {
            console.warn(`Failed to cleanup temp file ${tempFile}:`, cleanupError);
          }
        }
      }
      throw exportError;
    }
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

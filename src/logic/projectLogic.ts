import { kea, path, actions, reducers, listeners, connect } from 'kea';
import { timelineLogic } from './timelineLogic';
import { exportVideoNative } from '../utils/tauriVideoExport';

export enum ExportQuality {
  LOW = 'low',      // CRF 28, preset fast
  MEDIUM = 'medium', // CRF 23, preset medium (default)
  HIGH = 'high',     // CRF 18, preset slow
}

export interface ExportSettings {
  quality: ExportQuality;
  outputFormat: 'mp4'; // Future: add 'mov', 'webm'
}

export interface ProjectState {
  projectName: string;
  isExporting: boolean;
  exportProgress: number;
  exportError: string | null;
  exportSuccess: boolean;
  exportLog: string[];
  exportedVideoUrl: string | null;
  exportAbortController: AbortController | null;
  exportSettings: ExportSettings;
}

export const projectLogic = kea([
  path(['logic', 'projectLogic']),

  connect({
    values: [timelineLogic, ['clips']],
  }),

  actions({
    setProjectName: (name) => ({ name }),
    startExport: true,
    updateExportProgress: (progress) => ({ progress }),
    addExportLog: (message) => ({ message }),
    exportComplete: (videoUrl) => ({ videoUrl }),
    exportFailed: (error) => ({ error }),
    resetExport: true,
    downloadExportedVideo: true,
    cancelExport: true,
    setExportQuality: (quality) => ({ quality }),
  }),

  reducers({
    projectName: [
      'Untitled Project' as string,
      {
        setProjectName: (_, { name }) => name,
      },
    ],
    isExporting: [
      false as boolean,
      {
        startExport: () => true,
        exportComplete: () => false,
        exportFailed: () => false,
        resetExport: () => false,
      },
    ],
    exportProgress: [
      0 as number,
      {
        updateExportProgress: (_, { progress }) => progress,
        startExport: () => 0,
        exportComplete: () => 100,
        resetExport: () => 0,
      },
    ],
    exportError: [
      null as string | null,
      {
        exportFailed: (_, { error }) => error,
        startExport: () => null,
        exportComplete: () => null,
        resetExport: () => null,
      },
    ],
    exportSuccess: [
      false as boolean,
      {
        exportComplete: () => true,
        startExport: () => false,
        exportFailed: () => false,
        resetExport: () => false,
      },
    ],
    exportLog: [
      [] as string[],
      {
        addExportLog: (state, { message }) => [...state, message],
        startExport: () => [],
        resetExport: () => [],
      },
    ],
    exportedVideoUrl: [
      null as string | null,
      {
        exportComplete: (_, { videoUrl }) => videoUrl,
        resetExport: () => null,
        startExport: () => null,
      },
    ],
    exportAbortController: [
      null as AbortController | null,
      {
        startExport: () => new AbortController(),
        exportComplete: () => null,
        exportFailed: () => null,
        cancelExport: (controller) => {
          controller?.abort();
          return null;
        },
      },
    ],
    exportSettings: [
      { quality: ExportQuality.MEDIUM, outputFormat: 'mp4' } as ExportSettings,
      {
        setExportQuality: (state, { quality }) => ({
          ...state,
          quality,
        }),
      },
    ],
  }),

  listeners(({ actions, values }) => ({
    startExport: async () => {
      try {
        console.log('🎬 Export started');

        // Clean up previous export blob URL to prevent memory leaks
        const prevUrl = (values as any).exportedVideoUrl;
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }

        const clips = (values as any).clips;
        console.log('📦 Clips to export:', clips);

        if (!clips || clips.length === 0) {
          console.error('❌ No clips to export');
          actions.exportFailed('No clips to export');
          return;
        }

        actions.addExportLog('Starting export...');
        console.log('🚀 Calling exportVideoNative...');

        const result = await exportVideoNative({
          clips,
          settings: (values as any).exportSettings,
          onProgress: (progress) => {
            console.log(`📊 Progress: ${progress}%`);
            actions.updateExportProgress(progress);
          },
          onLog: (message) => {
            console.log(`📝 Log: ${message}`);
            actions.addExportLog(message);
          },
        });

        console.log('✅ Export result:', result);

        if (result.success && result.filePath) {
          actions.addExportLog(`Export completed successfully! Saved to: ${result.filePath}`);
          // For native export, we don't need a URL since file is already saved
          actions.exportComplete(result.filePath);
        } else {
          console.error('❌ Export failed:', result.error);
          actions.exportFailed(result.error || 'Unknown error occurred');
        }
      } catch (error) {
        console.error('❌ Export error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Export failed';
        const errorStack = error instanceof Error ? error.stack : '';
        console.error('Error stack:', errorStack);
        actions.exportFailed(errorMessage);
      }
    },

    resetExport: () => {
      // Clean up blob URL when resetting export
      const url = (values as any).exportedVideoUrl;
      if (url) {
        URL.revokeObjectURL(url);
      }
    },

    downloadExportedVideo: async () => {
      const { exportedVideoUrl } = values;

      if (exportedVideoUrl) {
        // For native Tauri export, the file is already saved
        // Just open the folder containing the file
        try {
          const { open } = await import('@tauri-apps/plugin-shell');
          // Open the file location in the system file browser
          await open(exportedVideoUrl);
          actions.addExportLog('Opened file location');
        } catch (error) {
          console.error('Failed to open file location:', error);
          actions.addExportLog(`File saved to: ${exportedVideoUrl}`);
        }
      }
    },

    cancelExport: () => {
      actions.addExportLog('Export cancelled by user');
      actions.exportFailed('Export cancelled');
    },
  })),
]);

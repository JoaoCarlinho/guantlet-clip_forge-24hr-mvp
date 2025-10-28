import { kea, path, actions, reducers, listeners, connect } from 'kea';
import { timelineLogic } from './timelineLogic';
import { exportVideo, downloadVideo } from '../utils/videoExport';

export interface ProjectState {
  projectName: string;
  isExporting: boolean;
  exportProgress: number;
  exportError: string | null;
  exportSuccess: boolean;
  exportLog: string[];
  exportedVideoUrl: string | null;
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
  }),

  listeners(({ actions, values }) => ({
    startExport: async () => {
      try {
        // Clean up previous export blob URL to prevent memory leaks
        const prevUrl = (values as any).exportedVideoUrl;
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }

        const clips = (values as any).clips;

        if (!clips || clips.length === 0) {
          actions.exportFailed('No clips to export');
          return;
        }

        actions.addExportLog('Starting export...');

        const result = await exportVideo({
          clips,
          onProgress: (progress) => {
            actions.updateExportProgress(progress);
          },
          onLog: (message) => {
            actions.addExportLog(message);
          },
        });

        if (result.success && result.url) {
          actions.addExportLog('Export completed successfully!');
          actions.exportComplete(result.url);
        } else {
          actions.exportFailed(result.error || 'Unknown error occurred');
        }
      } catch (error) {
        actions.exportFailed(error instanceof Error ? error.message : 'Export failed');
      }
    },

    resetExport: () => {
      // Clean up blob URL when resetting export
      const url = (values as any).exportedVideoUrl;
      if (url) {
        URL.revokeObjectURL(url);
      }
    },

    downloadExportedVideo: async (_, breakpoint) => {
      await breakpoint(100);
      const { exportedVideoUrl } = values;

      if (exportedVideoUrl) {
        // Fetch the blob from the URL
        const response = await fetch(exportedVideoUrl);
        const blob = await response.blob();

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `clipforge-export-${timestamp}.mp4`;

        downloadVideo(blob, filename);
        actions.addExportLog(`Downloaded as: ${filename}`);
      }
    },
  })),
]);

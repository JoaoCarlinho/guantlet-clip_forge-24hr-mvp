import { kea, path, actions, reducers, listeners } from 'kea';

export interface ProjectState {
  projectName: string;
  isExporting: boolean;
  exportProgress: number;
  exportError: string | null;
}

export const projectLogic = kea([
  path(['logic', 'projectLogic']),

  actions({
    setProjectName: (name) => ({ name }),
    startExport: true,
    updateExportProgress: (progress) => ({ progress }),
    exportComplete: true,
    exportFailed: (error) => ({ error }),
    resetExport: true,
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
        resetExport: () => null,
      },
    ],
  }),

  listeners(({ actions }) => ({
    startExport: async () => {
      try {
        // Placeholder for export logic
        // This will be implemented in Phase 2, Step 5
        console.log('Starting export...');

        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
          actions.updateExportProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        actions.exportComplete();
      } catch (error) {
        actions.exportFailed(error instanceof Error ? error.message : 'Export failed');
      }
    },
  })),
]);

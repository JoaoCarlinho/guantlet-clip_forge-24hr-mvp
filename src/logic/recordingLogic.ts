import { kea, actions, reducers, listeners } from 'kea';
import type { RecordedClip } from '../hooks/useRecorder';
import { timelineLogic } from './timelineLogic';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  error: string | null;
  lastRecording: RecordedClip | null;
}

export const recordingLogic = kea([
  // Add a stable path to prevent logic re-creation on every render
  {
    path: ['recording'],
  },

  actions({
    startRecording: (config) => ({ config }),
    stopRecording: true,
    pauseRecording: true,
    resumeRecording: true,
    setRecordingState: (state) => ({ state }),
    setError: (error) => ({ error }),
    setLastRecording: (recording) => ({ recording }),
    saveToTimeline: true,
    clearLastRecording: true,
  }),

  reducers({
    isRecording: [
      false,
      {
        setRecordingState: (state, { state: newState }) =>
          newState.isRecording !== undefined ? newState.isRecording : state,
      },
    ],
    isPaused: [
      false,
      {
        setRecordingState: (state, { state: newState }) =>
          newState.isPaused !== undefined ? newState.isPaused : state,
      },
    ],
    recordingTime: [
      0,
      {
        setRecordingState: (state, { state: newState }) =>
          newState.recordingTime !== undefined ? newState.recordingTime : state,
      },
    ],
    error: [
      null as string | null,
      {
        setError: (_, { error }) => error,
        startRecording: () => null, // Clear error when starting recording
        setRecordingState: (state, { state: newState }) =>
          newState.error !== undefined ? newState.error : state,
      },
    ],
    lastRecording: [
      null as RecordedClip | null,
      {
        setLastRecording: (_, { recording }) => recording,
        clearLastRecording: () => null,
        startRecording: () => null, // Clear last recording when starting new one
      },
    ],
  }),

  listeners(({ actions, values }) => ({
    saveToTimeline: () => {
      const { lastRecording } = values;

      if (!lastRecording) {
        actions.setError('No recording to save');
        return;
      }

      try {
        // Add the recording to the timeline as a new clip
        const clipId = `clip-${Date.now()}`;
        const clip = {
          id: clipId,
          name: `Recording ${new Date().toLocaleTimeString()}`,
          filePath: lastRecording.url,
          duration: lastRecording.duration,
          startTime: 0,
          endTime: lastRecording.duration,
          trimStart: 0,
          trimEnd: lastRecording.duration,
          sourceDuration: lastRecording.duration,
          sourceStart: 0,
          sourceEnd: lastRecording.duration,
        };

        // Use the timeline logic to add the clip
        timelineLogic.actions.addClip(clip);

        // Clear the last recording after saving
        actions.clearLastRecording();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save to timeline';
        actions.setError(errorMessage);
      }
    },
  })),
]);

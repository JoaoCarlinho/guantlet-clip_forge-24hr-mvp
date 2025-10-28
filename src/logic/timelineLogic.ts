import { kea, path, actions, reducers, selectors } from 'kea';

export interface Clip {
  id: string;
  name: string;
  filePath: string;
  duration: number;
  startTime: number;
  endTime: number;
  trimStart: number; // in/out points for trimming
  trimEnd: number;
}

export interface TimelineState {
  clips: Clip[];
  currentTime: number;
  isPlaying: boolean;
  selectedClipId: string | null;
}

export const timelineLogic = kea([
  path(['logic', 'timelineLogic']),

  actions({
    addClip: (clip) => ({ clip }),
    removeClip: (clipId) => ({ clipId }),
    updateClip: (clipId, updates) => ({ clipId, updates }),
    setCurrentTime: (time) => ({ time }),
    play: true,
    pause: true,
    togglePlay: true,
    selectClip: (clipId) => ({ clipId }),
    setTrimPoints: (clipId, trimStart, trimEnd) => ({
      clipId,
      trimStart,
      trimEnd,
    }),
    clearTimeline: true,
  }),

  reducers({
    clips: [
      [] as Clip[],
      {
        addClip: (state, { clip }) => [...state, clip],
        removeClip: (state, { clipId }) => state.filter((c: Clip) => c.id !== clipId),
        updateClip: (state, { clipId, updates }) =>
          state.map((clip: Clip) => (clip.id === clipId ? { ...clip, ...updates } : clip)),
        setTrimPoints: (state, { clipId, trimStart, trimEnd }) =>
          state.map((clip: Clip) =>
            clip.id === clipId ? { ...clip, trimStart, trimEnd } : clip
          ),
        clearTimeline: () => [],
      },
    ],
    currentTime: [
      0 as number,
      {
        setCurrentTime: (_, { time }) => time,
        clearTimeline: () => 0,
      },
    ],
    isPlaying: [
      false as boolean,
      {
        play: () => true,
        pause: () => false,
        togglePlay: state => !state,
        clearTimeline: () => false,
      },
    ],
    selectedClipId: [
      null as string | null,
      {
        selectClip: (_, { clipId }) => clipId,
        removeClip: (state, { clipId }) => (state === clipId ? null : state),
        clearTimeline: () => null,
      },
    ],
  }),

  selectors({
    selectedClip: [
      (s) => [s.clips, s.selectedClipId],
      (clips: Clip[], selectedClipId: string | null) => clips.find((c: Clip) => c.id === selectedClipId) || null,
    ],
    totalDuration: [
      (s) => [s.clips],
      (clips: Clip[]) => {
        if (clips.length === 0) return 0;
        const lastClip = clips[clips.length - 1];
        return lastClip ? lastClip.endTime : 0;
      },
    ],
    trimmedClips: [
      (s) => [s.clips],
      (clips: Clip[]) =>
        clips.map((clip: Clip) => ({
          ...clip,
          effectiveDuration: clip.trimEnd - clip.trimStart,
        })),
    ],
  }),
]);

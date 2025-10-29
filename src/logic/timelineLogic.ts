import { kea, path, actions, reducers, selectors, listeners } from 'kea';

export interface Clip {
  id: string;
  name: string;
  filePath: string; // Converted URL for video player (blob: or asset: protocol)
  originalFilePath?: string; // Original file system path (for FFmpeg export)
  duration: number; // Duration of the clip on the timeline
  startTime: number; // Position on timeline
  endTime: number; // Position on timeline
  trimStart: number; // IN point - time relative to clip start (for UI trim markers)
  trimEnd: number; // OUT point - time relative to clip start (for UI trim markers)
  sourceDuration: number; // Original duration of the source video file
  sourceStart: number; // Where in the source file this clip starts playing from
  sourceEnd: number; // Where in the source file this clip ends playing at
}

export interface TimelineState {
  clips: Clip[];
  currentTime: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  activeClipId: string | null;  // Currently playing clip (different from selectedClipId)
  zoomLevel: number;        // pixels per second
  scrollPosition: number;   // for maintaining scroll position during zoom
  // Trim preview state
  activeTrimClipId: string | null;
  activeTrimType: 'in' | 'out' | null;
  previewTime: number | null;
}

export const timelineLogic = kea([
  path(['logic', 'timelineLogic']),

  actions({
    addClip: (clip) => ({ clip }),
    removeClip: (clipId) => ({ clipId }),
    updateClip: (clipId, updates) => ({ clipId, updates }),
    setCurrentTime: (time) => ({ time }),
    setActiveClip: (clipId) => ({ clipId }),  // Set currently playing clip
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
    // Zoom actions
    setZoomLevel: (zoomLevel) => ({ zoomLevel }),
    zoomIn: true,
    zoomOut: true,
    resetZoom: true,
    setScrollPosition: (scrollPosition) => ({ scrollPosition }),
    // Trim preview actions
    startTrimDrag: (clipId, trimType, initialTime) => ({
      clipId,
      trimType,
      initialTime,
    }),
    updateTrimPreview: (time) => ({ time }),
    endTrimDrag: true,
    // Delete actions
    deleteClipOutsideMarkers: (clipId) => ({ clipId }),
    confirmDeleteOutsideMarkers: (clipId) => ({ clipId }),
    cancelDeleteOutsideMarkers: true,
  }),

  reducers({
    clips: [
      [] as Clip[],
      {
        addClip: (state, { clip }) => {
          // Calculate start time based on existing clips
          const lastClip = state.length > 0 ? state[state.length - 1] : null;
          const startTime = lastClip ? lastClip.endTime : 0;

          return [
            ...state,
            {
              ...clip,
              startTime,
              endTime: startTime + clip.duration,
            },
          ];
        },
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
    activeClipId: [
      null as string | null,
      {
        setActiveClip: (_, { clipId }) => clipId,
        removeClip: (state, { clipId }) => (state === clipId ? null : state),
        clearTimeline: () => null,
        pause: () => null,  // Clear active clip when paused
      },
    ],
    zoomLevel: [
      50 as number,  // default 50 pixels per second
      {
        setZoomLevel: (_, { zoomLevel }) => Math.max(10, Math.min(500, zoomLevel)),
        zoomIn: (state) => Math.min(500, state * 1.5),
        zoomOut: (state) => Math.max(10, state / 1.5),
        resetZoom: () => 50,
      },
    ],
    scrollPosition: [
      0 as number,
      {
        setScrollPosition: (_, { scrollPosition }) => scrollPosition,
        clearTimeline: () => 0,
      },
    ],
    // Track pending deletion
    pendingDeleteClipId: [
      null as string | null,
      {
        deleteClipOutsideMarkers: (_, { clipId }) => clipId,
        confirmDeleteOutsideMarkers: () => null,
        cancelDeleteOutsideMarkers: () => null,
        clearTimeline: () => null,
      },
    ],
    // Trim preview state
    activeTrimClipId: [
      null as string | null,
      {
        startTrimDrag: (_, { clipId }) => clipId,
        endTrimDrag: () => null,
        selectClip: () => null,
        clearTimeline: () => null,
      },
    ],
    activeTrimType: [
      null as 'in' | 'out' | null,
      {
        startTrimDrag: (_, { trimType }) => trimType,
        endTrimDrag: () => null,
        selectClip: () => null,
        clearTimeline: () => null,
      },
    ],
    previewTime: [
      null as number | null,
      {
        startTrimDrag: (_, { initialTime }) => initialTime,
        updateTrimPreview: (_, { time }) => time,
        endTrimDrag: () => null,
        selectClip: () => null,
        clearTimeline: () => null,
      },
    ],
  }),

  listeners(({ actions, values }) => ({
    // Set active clip when play is initiated
    play: () => {
      const { clips, currentTime, clipAtTime, totalDuration } = values;

      if (clips.length === 0) return;

      // Determine which clip should be playing
      let clipToPlay: Clip | null = null;

      // If currentTime is at or past the end, start from beginning
      if (currentTime >= totalDuration) {
        clipToPlay = clips[0];
        actions.setCurrentTime(clips[0].startTime);
      } else {
        // Find clip at current position
        clipToPlay = clipAtTime(currentTime);

        // If no clip found (e.g., at very end), start from first clip
        if (!clipToPlay) {
          clipToPlay = clips[0];
          actions.setCurrentTime(clips[0].startTime);
        }
      }

      if (clipToPlay) {
        actions.setActiveClip(clipToPlay.id);
        console.log('🎬 Starting playback from clip:', clipToPlay.name);
      }
    },

    // Handle clip removal - stop playback if active clip is removed
    removeClip: ({ clipId }) => {
      const { activeClipId, isPlaying } = values;

      if (isPlaying && activeClipId === clipId) {
        console.log('⏹️ Active clip removed, stopping playback');
        actions.pause();
      }
    },

    confirmDeleteOutsideMarkers: ({ clipId }) => {
      const clip = values.clips.find((c: Clip) => c.id === clipId);
      if (!clip) return;

      // Calculate new clip properties after deletion
      const newDuration = clip.trimEnd - clip.trimStart;
      const newStartTime = clip.startTime; // Keep same position on timeline
      const newEndTime = newStartTime + newDuration;

      // Update source boundaries to reflect what was kept
      // The new sourceStart is where the old trimStart was pointing
      // The new sourceEnd is where the old trimEnd was pointing
      const newSourceStart = clip.sourceStart + clip.trimStart;
      const newSourceEnd = clip.sourceStart + clip.trimEnd;

      // Reset trim markers to span the entire clip (no visible trim regions)
      actions.updateClip(clipId, {
        duration: newDuration,
        endTime: newEndTime,
        sourceStart: newSourceStart,
        sourceEnd: newSourceEnd,
        trimStart: 0,
        trimEnd: newDuration,
      });

      // Recalculate subsequent clips' positions
      const clipIndex = values.clips.findIndex((c: Clip) => c.id === clipId);
      if (clipIndex !== -1 && clipIndex < values.clips.length - 1) {
        // Update following clips' start/end times
        let currentEndTime = newEndTime;
        for (let i = clipIndex + 1; i < values.clips.length; i++) {
          const nextClip = values.clips[i];
          const nextClipDuration = nextClip.duration;
          actions.updateClip(nextClip.id, {
            startTime: currentEndTime,
            endTime: currentEndTime + nextClipDuration,
          });
          currentEndTime += nextClipDuration;
        }
      }
    },
  })),

  selectors({
    selectedClip: [
      (s) => [s.clips, s.selectedClipId],
      (clips: Clip[], selectedClipId: string | null) => clips.find((c: Clip) => c.id === selectedClipId) || null,
    ],
    // Get clip that is currently playing
    activeClip: [
      (s) => [s.clips, s.activeClipId],
      (clips: Clip[], activeClipId: string | null) => clips.find((c: Clip) => c.id === activeClipId) || null,
    ],
    // Calculate which clip contains the given timeline position
    clipAtTime: [
      (s) => [s.clips],
      (clips: Clip[]) => (time: number): Clip | null => {
        return clips.find(
          (clip: Clip) => time >= clip.startTime && time < clip.endTime
        ) || null;
      },
    ],
    // Get the next clip in timeline order
    nextClip: [
      (s) => [s.clips, s.activeClipId],
      (clips: Clip[], activeClipId: string | null): Clip | null => {
        if (!activeClipId) return null;
        const currentIndex = clips.findIndex((c: Clip) => c.id === activeClipId);
        if (currentIndex === -1 || currentIndex === clips.length - 1) return null;
        return clips[currentIndex + 1];
      },
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
    timelineWidth: [
      (s) => [s.totalDuration, s.zoomLevel],
      (totalDuration: number, zoomLevel: number) =>
        Math.max(totalDuration * zoomLevel, 800),
    ],
    // Check if clip has been trimmed (markers moved)
    clipHasTrims: [
      (s) => [s.clips],
      (clips: Clip[]) => {
        const hasTrims: Record<string, boolean> = {};
        clips.forEach((clip: Clip) => {
          // Use a small epsilon for floating point comparison
          const EPSILON = 0.001;
          const hasTrimStart = clip.trimStart > EPSILON;
          const hasTrimEnd = clip.trimEnd < (clip.duration - EPSILON);
          hasTrims[clip.id] = hasTrimStart || hasTrimEnd;
        });
        return hasTrims;
      },
    ],
    // Calculate what will be deleted for a clip
    clipDeletionInfo: [
      (s) => [s.clips],
      (clips: Clip[]) => {
        const deletionInfo: Record<string, { startDuration: number; endDuration: number; totalDeleted: number }> = {};
        clips.forEach((clip: Clip) => {
          deletionInfo[clip.id] = {
            startDuration: clip.trimStart,
            endDuration: clip.duration - clip.trimEnd,
            totalDeleted: clip.trimStart + (clip.duration - clip.trimEnd),
          };
        });
        return deletionInfo;
      },
    ],
    // Calculate effective preview time for video player
    effectivePreviewTime: [
      (s) => [
        s.selectedClip,
        s.activeTrimClipId,
        s.previewTime,
      ],
      (
        selectedClip: Clip | null,
        activeTrimClipId: string | null,
        previewTime: number | null
      ): number | null => {
        // If actively trimming, use the preview time
        if (activeTrimClipId && previewTime !== null) {
          return previewTime;
        }

        // Default: show frame at IN marker of selected clip
        if (selectedClip) {
          return selectedClip.trimStart;
        }

        return null;
      },
    ],
  }),
]);

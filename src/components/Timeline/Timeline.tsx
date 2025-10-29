import { useEffect, useRef, useState } from 'react';
import { useValues, useActions } from 'kea';
import { timelineLogic, type Clip } from '../../logic/timelineLogic';
import TimelineClip from './TimelineClip';
import Button from '../shared/Button';
import ConfirmDialog from '../shared/ConfirmDialog';
import './Timeline.css';

export default function Timeline() {
  const {
    clips,
    currentTime,
    isPlaying,
    selectedClipId,
    activeClipId,
    totalDuration,
    zoomLevel,
    pendingDeleteClipId,
    clipDeletionInfo,
    clipHasTrims,
  } = useValues(timelineLogic);
  const {
    play,
    pause,
    selectClip,
    clearTimeline,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLevel,
    confirmDeleteOutsideMarkers,
    cancelDeleteOutsideMarkers,
    deleteClipOutsideMarkers,
  } = useActions(timelineLogic);

  const pixelsPerSecond = zoomLevel; // Dynamic zoom level from state
  const scrollRef = useRef<HTMLDivElement>(null);

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Get pending delete clip info
  const pendingClip = clips.find((c: Clip) => c.id === pendingDeleteClipId);
  const pendingDeletionInfo = pendingDeleteClipId ? clipDeletionInfo[pendingDeleteClipId] : null;

  // Pinch zoom state
  const [isPinching, setIsPinching] = useState(false);
  const pinchStartZoom = useRef<number>(50);
  const pinchAccumulator = useRef<number>(0);
  const lastPinchTime = useRef<number>(0);
  const pinchResetTimeout = useRef<number | undefined>(undefined);

  // Keyboard shortcuts for zoom control
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd key
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
            e.preventDefault();
            zoomOut();
            break;
          case '0':
            e.preventDefault();
            resetZoom();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [zoomIn, zoomOut, resetZoom]);

  // Keyboard shortcuts for clip deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key or Backspace when clip is selected and has trims
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        const hasTrim = clipHasTrims[selectedClipId];
        if (hasTrim) {
          e.preventDefault();
          deleteClipOutsideMarkers(selectedClipId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, clipHasTrims, deleteClipOutsideMarkers]);

  // Helper function to detect pinch zoom gesture
  const isPinchZoom = (e: WheelEvent): boolean => {
    // On macOS trackpad, pinch gestures have ctrlKey set automatically
    // Check for ctrlKey and ensure it's not from keyboard (no other modifiers for pure pinch)
    return e.ctrlKey && !e.shiftKey && !e.altKey;
  };

  // Mouse wheel and trackpad pinch zoom with focal point
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      const isPinch = isPinchZoom(e);

      // Handle both mouse wheel zoom and trackpad pinch
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        // Calculate focal point position
        const rect = scrollContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const scrollX = scrollContainer.scrollLeft;
        const timeAtFocus = (scrollX + mouseX) / pixelsPerSecond;

        let newZoomLevel: number;

        if (isPinch) {
          // Trackpad pinch zoom - smooth accumulation
          const currentTime = Date.now();
          const timeSinceLastPinch = currentTime - lastPinchTime.current;

          // Detect start of new pinch gesture (>200ms since last event)
          if (timeSinceLastPinch > 200) {
            pinchStartZoom.current = zoomLevel;
            pinchAccumulator.current = 0;
            setIsPinching(true);
          }

          lastPinchTime.current = currentTime;

          // Accumulate pinch delta for smoother zooming
          pinchAccumulator.current += e.deltaY;

          // Calculate new zoom level with exponential scaling
          // deltaY is negative for zoom in, positive for zoom out
          const zoomMultiplier = Math.exp(-pinchAccumulator.current * 0.008);
          newZoomLevel = pinchStartZoom.current * zoomMultiplier;

          // Clamp to min/max
          newZoomLevel = Math.max(10, Math.min(500, newZoomLevel));

          // Reset pinching state after 200ms of no pinch events
          if (pinchResetTimeout.current !== undefined) {
            window.clearTimeout(pinchResetTimeout.current);
          }
          pinchResetTimeout.current = window.setTimeout(() => {
            setIsPinching(false);
          }, 200);
        } else {
          // Mouse wheel zoom - discrete steps
          if (e.deltaY < 0) {
            newZoomLevel = Math.min(500, zoomLevel * 1.5);
          } else {
            newZoomLevel = Math.max(10, zoomLevel / 1.5);
          }
        }

        // Update zoom level
        setZoomLevel(newZoomLevel);

        // Maintain focal point position after zoom (next frame)
        requestAnimationFrame(() => {
          const newScrollX = timeAtFocus * newZoomLevel - mouseX;
          scrollContainer.scrollLeft = Math.max(0, newScrollX);
        });
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
      if (pinchResetTimeout.current !== undefined) {
        window.clearTimeout(pinchResetTimeout.current);
      }
    };
  }, [pixelsPerSecond, zoomLevel, setZoomLevel]);

  return (
    <div className="timeline-container">
      <div className="timeline-controls">
        <div className="playback-controls">
          <button
            className="control-button"
            onClick={() => (isPlaying ? pause() : play())}
            disabled={clips.length === 0}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <div className="timeline-time">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </div>
        </div>

        <div className="zoom-controls">
          <button
            className="zoom-button"
            onClick={() => zoomOut()}
            title="Zoom Out (Ctrl + -)"
            aria-label="Zoom out"
          >
            −
          </button>

          <div
            className="zoom-level-indicator"
            title={`Zoom: ${zoomLevel}px/sec\nRange: 10-500px/sec`}
          >
            {Math.round((zoomLevel / 50) * 100)}%
          </div>

          <button
            className="zoom-button"
            onClick={() => zoomIn()}
            title="Zoom In (Ctrl + +)"
            aria-label="Zoom in"
          >
            +
          </button>

          <button
            className="zoom-reset-button"
            onClick={() => resetZoom()}
            title="Reset Zoom (Ctrl + 0)"
            aria-label="Reset zoom to 100%"
          >
            Reset
          </button>
        </div>

        <div className="timeline-actions">
          <span className="clips-count">{clips.length} clip{clips.length !== 1 ? 's' : ''}</span>
          {clips.length > 0 && (
            <Button variant="secondary" onClick={() => clearTimeline()}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="timeline-track">
        {/* Pinch zoom indicator */}
        {isPinching && (
          <div className="pinch-zoom-indicator">
            <span>🔍 {Math.round((zoomLevel / 50) * 100)}%</span>
          </div>
        )}

        {clips.length === 0 ? (
          <div className="timeline-empty">
            <p>No clips added yet. Import video files to get started.</p>
          </div>
        ) : (
          <div className="timeline-scroll" ref={scrollRef}>
            <div
              className="timeline-clips"
              style={{
                width: `${Math.max(totalDuration * pixelsPerSecond, 800)}px`,
              }}
            >
              {clips.map((clip: Clip) => (
                <TimelineClip
                  key={clip.id}
                  clip={clip}
                  isSelected={selectedClipId === clip.id}
                  isActive={activeClipId === clip.id}
                  pixelsPerSecond={pixelsPerSecond}
                  onSelect={() => selectClip(clip.id)}
                />
              ))}

              {/* Playhead */}
              {currentTime > 0 && (
                <div
                  className="playhead"
                  style={{
                    left: `${currentTime * pixelsPerSecond}px`,
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!pendingDeleteClipId}
        title="Delete Clip Portions?"
        message={
          pendingClip && pendingDeletionInfo
            ? `This will permanently delete ${formatDuration(pendingDeletionInfo.totalDeleted)} from "${pendingClip.name}":\n\n` +
              `• Start: ${formatDuration(pendingDeletionInfo.startDuration)} (before IN marker)\n` +
              `• End: ${formatDuration(pendingDeletionInfo.endDuration)} (after OUT marker)\n\n` +
              `The remaining ${formatDuration(pendingClip.trimEnd - pendingClip.trimStart)} will become the new clip.`
            : 'Are you sure you want to delete the portions outside the IN/OUT markers?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => confirmDeleteOutsideMarkers(pendingDeleteClipId!)}
        onCancel={() => cancelDeleteOutsideMarkers()}
      />
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

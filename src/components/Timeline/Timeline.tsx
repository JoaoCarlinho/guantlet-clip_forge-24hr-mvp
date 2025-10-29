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
    setCurrentTime,
    splitClipAtPlayhead,
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

  // Clip selection popup state
  const [showClipPopup, setShowClipPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [overlappingClips, setOverlappingClips] = useState<Clip[]>([]);
  const clickHoldTimer = useRef<number | undefined>(undefined);
  const CLICK_HOLD_DURATION = 500; // ms to hold for popup

  // Helper function to find clip at a specific time
  const findClipAtTime = (time: number): Clip | null => {
    return clips.find((clip: Clip) => time >= clip.startTime && time < clip.endTime) || null;
  };

  // Handle split at playhead
  const handleSplitAtPlayhead = () => {
    if (clips.length === 0) return;

    const clipAtPlayhead = findClipAtTime(currentTime);
    if (!clipAtPlayhead) {
      console.warn('No clip at playhead position');
      return;
    }

    // Calculate split time relative to clip start
    const splitTime = currentTime - clipAtPlayhead.startTime;

    // Validate split time is not at the very edges
    if (splitTime <= 0.1 || splitTime >= clipAtPlayhead.duration - 0.1) {
      console.warn('Cannot split at clip edges. Move playhead to middle of clip.');
      return;
    }

    splitClipAtPlayhead(clipAtPlayhead.id, splitTime);
  };

  // Handle timeline click - snap playhead to position
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;

    // Don't handle if clicking on a clip element or control buttons
    const target = e.target as HTMLElement;
    if (target.closest('.timeline-clip') || target.closest('button')) return;

    const rect = scrollRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + scrollRef.current.scrollLeft;
    const clickedTime = clickX / pixelsPerSecond;

    // Clamp to valid timeline range
    const newTime = Math.max(0, Math.min(totalDuration, clickedTime));
    setCurrentTime(newTime);
  };

  // Handle timeline mouse down - start hold timer for clip selection popup
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;

    // Don't handle if clicking on a clip element or control buttons
    const target = e.target as HTMLElement;
    if (target.closest('.timeline-clip') || target.closest('button')) return;

    const rect = scrollRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + scrollRef.current.scrollLeft;
    const clickedTime = clickX / pixelsPerSecond;

    // Find all clips at this position (for overlapping clips)
    const clipsAtPosition = clips.filter((clip: Clip) =>
      clickedTime >= clip.startTime && clickedTime < clip.endTime
    );

    if (clipsAtPosition.length > 1) {
      // Start timer for popup if multiple clips overlap
      clickHoldTimer.current = window.setTimeout(() => {
        setOverlappingClips(clipsAtPosition);
        setPopupPosition({ x: e.clientX, y: e.clientY });
        setShowClipPopup(true);
      }, CLICK_HOLD_DURATION);
    }
  };

  // Handle mouse up - cancel hold timer and snap playhead
  const handleTimelineMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickHoldTimer.current) {
      window.clearTimeout(clickHoldTimer.current);
      clickHoldTimer.current = undefined;
    }

    // If popup didn't show, perform click action
    if (!showClipPopup) {
      handleTimelineClick(e);
    }
  };

  // Close popup when clicking outside
  const handleClipPopupSelect = (clipId: string) => {
    selectClip(clipId);
    setShowClipPopup(false);
    setOverlappingClips([]);
  };

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

  // Keyboard shortcuts for clip deletion and splitting
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

      // S key for split at playhead
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSplitAtPlayhead();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, clipHasTrims, deleteClipOutsideMarkers, currentTime, clips]);

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
            <>
              <button
                className="split-button"
                onClick={handleSplitAtPlayhead}
                disabled={!findClipAtTime(currentTime)}
                title="Split clip at playhead (S)"
              >
                ✂️ Split
              </button>
              <Button variant="secondary" onClick={() => clearTimeline()}>
                Clear All
              </Button>
            </>
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
          <div
            className="timeline-scroll"
            ref={scrollRef}
            onMouseDown={handleTimelineMouseDown}
            onMouseUp={handleTimelineMouseUp}
          >
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

              {/* Split indicator at playhead when over a clip */}
              {currentTime > 0 && findClipAtTime(currentTime) && (
                <div
                  className="split-indicator"
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

      {/* Clip Selection Popup */}
      {showClipPopup && overlappingClips.length > 0 && (
        <div
          className="clip-selection-popup"
          style={{
            position: 'fixed',
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            zIndex: 1000,
          }}
        >
          <div className="popup-title">Select Clip:</div>
          {overlappingClips.map((clip: Clip) => (
            <button
              key={clip.id}
              className="popup-clip-option"
              onClick={() => handleClipPopupSelect(clip.id)}
            >
              {clip.name}
            </button>
          ))}
          <button
            className="popup-cancel"
            onClick={() => setShowClipPopup(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

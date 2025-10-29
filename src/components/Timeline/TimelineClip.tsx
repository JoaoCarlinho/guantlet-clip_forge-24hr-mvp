import { useRef } from 'react';
import { useActions, useValues } from 'kea';
import { timelineLogic, type Clip } from '../../logic/timelineLogic';
import './TimelineClip.css';

interface TimelineClipProps {
  clip: Clip;
  isSelected: boolean;
  isActive?: boolean;  // Currently playing clip
  pixelsPerSecond: number;
  onSelect: () => void;
}

export default function TimelineClip({ clip, isSelected, isActive = false, pixelsPerSecond, onSelect }: TimelineClipProps) {
  const { setTrimPoints, deleteClipOutsideMarkers, startOutMarkerDrag, updateOutMarkerPosition, endOutMarkerDrag } = useActions(timelineLogic);
  const { clipHasTrims, clipDeletionInfo } = useValues(timelineLogic);
  const clipRef = useRef<HTMLDivElement>(null);

  const hasTrimMarkers = clipHasTrims?.[clip.id];
  const deletionInfo = clipDeletionInfo?.[clip.id];

  const trimStartPixels = clip.trimStart * pixelsPerSecond;
  const trimEndPixels = clip.trimEnd * pixelsPerSecond;
  const totalPixels = clip.duration * pixelsPerSecond;

  const handleTrimInDrag = (e: React.MouseEvent) => {
    e.stopPropagation();

    const startX = e.clientX;
    const originalTrimStart = clip.trimStart;

    // Use RAF to throttle updates for smooth performance
    let rafId: number | null = null;
    let pendingUpdate: { newTrimStart: number } | null = null;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX / pixelsPerSecond;
      const newTrimStart = Math.max(0, Math.min(clip.trimEnd - 0.1, originalTrimStart + deltaTime));

      // Store the pending update
      pendingUpdate = { newTrimStart };

      // Schedule update on next animation frame if not already scheduled
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          if (pendingUpdate) {
            setTrimPoints(clip.id, pendingUpdate.newTrimStart, clip.trimEnd);
            pendingUpdate = null;
          }
          rafId = null;
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Cancel any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // Apply final pending update if any
      if (pendingUpdate) {
        setTrimPoints(clip.id, pendingUpdate.newTrimStart, clip.trimEnd);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTrimOutDrag = (e: React.MouseEvent) => {
    e.stopPropagation();

    const startX = e.clientX;
    const originalTrimEnd = clip.trimEnd;

    // Start OUT marker drag - this will position playhead at OUT marker
    startOutMarkerDrag(clip.id);

    // Use RAF to throttle updates for smooth performance
    let rafId: number | null = null;
    let pendingUpdate: { newTrimEnd: number } | null = null;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX / pixelsPerSecond;
      const newTrimEnd = Math.min(clip.duration, Math.max(clip.trimStart + 0.1, originalTrimEnd + deltaTime));

      // Store the pending update
      pendingUpdate = { newTrimEnd };

      // Schedule update on next animation frame if not already scheduled
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          if (pendingUpdate) {
            setTrimPoints(clip.id, clip.trimStart, pendingUpdate.newTrimEnd);
            // Update playhead position to follow OUT marker
            updateOutMarkerPosition(clip.id, pendingUpdate.newTrimEnd);
            pendingUpdate = null;
          }
          rafId = null;
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Cancel any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // Apply final pending update if any
      if (pendingUpdate) {
        setTrimPoints(clip.id, clip.trimStart, pendingUpdate.newTrimEnd);
        updateOutMarkerPosition(clip.id, pendingUpdate.newTrimEnd);
      }

      // End OUT marker drag - this will snap playhead back to IN marker
      endOutMarkerDrag();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 1) {
      return `${(seconds * 1000).toFixed(0)}ms`;
    }
    return formatTime(seconds);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteClipOutsideMarkers(clip.id);
  };

  return (
    <div
      ref={clipRef}
      className={`timeline-clip ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
      onClick={onSelect}
      style={{
        left: `${clip.startTime * pixelsPerSecond}px`,
        width: `${totalPixels}px`,
      }}
      title={`${clip.name} (${formatTime(clip.duration)})`}
    >
      {/* Trimmed out region - start */}
      {clip.trimStart > 0 && (
        <div
          className="trim-region trim-region-out"
          style={{
            left: 0,
            width: `${trimStartPixels}px`,
          }}
        />
      )}

      {/* Active region */}
      <div
        className="clip-content"
        style={{
          marginLeft: `${trimStartPixels}px`,
          marginRight: `${totalPixels - trimEndPixels}px`,
        }}
      >
        <div className="clip-name">{clip.name}</div>
        <div className="clip-duration">
          {formatTime(clip.trimEnd - clip.trimStart)}
        </div>
      </div>

      {/* Trimmed out region - end */}
      {clip.trimEnd < clip.duration && (
        <div
          className="trim-region trim-region-out"
          style={{
            right: 0,
            width: `${totalPixels - trimEndPixels}px`,
          }}
        />
      )}

      {/* Trim markers */}
      {isSelected && (
        <>
          <div
            className="trim-marker trim-marker-in"
            style={{ left: `${trimStartPixels}px` }}
            onMouseDown={handleTrimInDrag}
            title={`In: ${formatTime(clip.trimStart)}`}
          >
            <div className="trim-marker-handle">
              <span className="trim-marker-label">IN</span>
            </div>
          </div>
          <div
            className="trim-marker trim-marker-out"
            style={{ left: `${trimEndPixels}px` }}
            onMouseDown={handleTrimOutDrag}
            title={`Out: ${formatTime(clip.trimEnd)}`}
          >
            <div className="trim-marker-handle">
              <span className="trim-marker-label">OUT</span>
            </div>
          </div>

          {/* Delete button - TEMP: Show always when selected for debugging */}
          {(hasTrimMarkers || isSelected) && (
            <button
              className="clip-delete-button"
              onClick={handleDeleteClick}
              title={`Delete ${formatDuration(deletionInfo?.totalDeleted || 0)} outside markers`}
            >
              <span className="delete-icon">✂</span>
              <span className="delete-label">Delete Outside Markers</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

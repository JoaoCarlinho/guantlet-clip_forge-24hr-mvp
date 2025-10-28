import { useRef } from 'react';
import { useActions, useValues } from 'kea';
import { timelineLogic, type Clip } from '../../logic/timelineLogic';
import './TimelineClip.css';

interface TimelineClipProps {
  clip: Clip;
  isSelected: boolean;
  pixelsPerSecond: number;
  onSelect: () => void;
}

export default function TimelineClip({ clip, isSelected, pixelsPerSecond, onSelect }: TimelineClipProps) {
  const { setTrimPoints, deleteClipOutsideMarkers, startTrimDrag, updateTrimPreview, endTrimDrag } = useActions(timelineLogic);
  const { clipHasTrims, clipDeletionInfo } = useValues(timelineLogic);
  const clipRef = useRef<HTMLDivElement>(null);
  const lastPreviewUpdate = useRef<number>(0);

  const hasTrimMarkers = clipHasTrims[clip.id];
  const deletionInfo = clipDeletionInfo[clip.id];

  const trimStartPixels = clip.trimStart * pixelsPerSecond;
  const trimEndPixels = clip.trimEnd * pixelsPerSecond;
  const totalPixels = clip.duration * pixelsPerSecond;

  const handleTrimInDrag = (e: React.MouseEvent) => {
    e.stopPropagation();

    const startX = e.clientX;
    const originalTrimStart = clip.trimStart;

    // Start trim drag preview
    startTrimDrag(clip.id, 'in', originalTrimStart);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX / pixelsPerSecond;
      const newTrimStart = Math.max(0, Math.min(clip.trimEnd - 0.1, originalTrimStart + deltaTime));

      // Update trim points for visual feedback (always update)
      setTrimPoints(clip.id, newTrimStart, clip.trimEnd);

      // Throttle preview updates to ~30fps for smoother video seeking
      const now = performance.now();
      if (now - lastPreviewUpdate.current >= 33) {  // ~30fps
        updateTrimPreview(newTrimStart);
        lastPreviewUpdate.current = now;
      }
    };

    const handleMouseUp = () => {
      // End trim drag preview
      endTrimDrag();

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTrimOutDrag = (e: React.MouseEvent) => {
    e.stopPropagation();

    const startX = e.clientX;
    const originalTrimEnd = clip.trimEnd;

    // Start trim drag preview
    startTrimDrag(clip.id, 'out', originalTrimEnd);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX / pixelsPerSecond;
      const newTrimEnd = Math.min(clip.duration, Math.max(clip.trimStart + 0.1, originalTrimEnd + deltaTime));

      // Update trim points for visual feedback (always update)
      setTrimPoints(clip.id, clip.trimStart, newTrimEnd);

      // Throttle preview updates to ~30fps for smoother video seeking
      const now = performance.now();
      if (now - lastPreviewUpdate.current >= 33) {  // ~30fps
        updateTrimPreview(newTrimEnd);
        lastPreviewUpdate.current = now;
      }
    };

    const handleMouseUp = () => {
      // End trim drag preview
      endTrimDrag();

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
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
      className={`timeline-clip ${isSelected ? 'selected' : ''}`}
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

          {/* Delete button - only show if clip has been trimmed */}
          {hasTrimMarkers && (
            <button
              className="clip-delete-button"
              onClick={handleDeleteClick}
              title={`Delete ${formatDuration(deletionInfo.totalDeleted)} outside markers`}
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

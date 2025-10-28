import { useRef } from 'react';
import { useActions } from 'kea';
import { timelineLogic, type Clip } from '../../logic/timelineLogic';
import './TimelineClip.css';

interface TimelineClipProps {
  clip: Clip;
  isSelected: boolean;
  pixelsPerSecond: number;
  onSelect: () => void;
}

export default function TimelineClip({ clip, isSelected, pixelsPerSecond, onSelect }: TimelineClipProps) {
  const { setTrimPoints } = useActions(timelineLogic);
  const clipRef = useRef<HTMLDivElement>(null);

  const trimStartPixels = clip.trimStart * pixelsPerSecond;
  const trimEndPixels = clip.trimEnd * pixelsPerSecond;
  const totalPixels = clip.duration * pixelsPerSecond;

  const handleTrimInDrag = (e: React.MouseEvent) => {
    e.stopPropagation();

    const startX = e.clientX;
    const originalTrimStart = clip.trimStart;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX / pixelsPerSecond;
      const newTrimStart = Math.max(0, Math.min(clip.trimEnd - 0.1, originalTrimStart + deltaTime));

      setTrimPoints(clip.id, newTrimStart, clip.trimEnd);
    };

    const handleMouseUp = () => {
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

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX / pixelsPerSecond;
      const newTrimEnd = Math.min(clip.duration, Math.max(clip.trimStart + 0.1, originalTrimEnd + deltaTime));

      setTrimPoints(clip.id, clip.trimStart, newTrimEnd);
    };

    const handleMouseUp = () => {
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
        </>
      )}
    </div>
  );
}

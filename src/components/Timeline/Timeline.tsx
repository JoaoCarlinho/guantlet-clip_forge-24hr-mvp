import { useValues, useActions } from 'kea';
import { timelineLogic, type Clip } from '../../logic/timelineLogic';
import TimelineClip from './TimelineClip';
import Button from '../shared/Button';
import './Timeline.css';

export default function Timeline() {
  const { clips, currentTime, isPlaying, selectedClipId, totalDuration } = useValues(timelineLogic);
  const { play, pause, selectClip, clearTimeline } = useActions(timelineLogic);

  const pixelsPerSecond = 50; // Scale for timeline visualization

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
        {clips.length === 0 ? (
          <div className="timeline-empty">
            <p>No clips added yet. Import video files to get started.</p>
          </div>
        ) : (
          <div className="timeline-scroll">
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
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

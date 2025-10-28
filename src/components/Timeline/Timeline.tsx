import { useValues, useActions } from 'kea';
import { timelineLogic, type Clip } from '../../logic/timelineLogic';
import './Timeline.css';

export default function Timeline() {
  const { clips, currentTime, isPlaying, selectedClipId } = useValues(timelineLogic);
  const { play, pause, selectClip } = useActions(timelineLogic);

  return (
    <div className="timeline-container">
      <div className="timeline-controls">
        <button
          className="control-button"
          onClick={() => (isPlaying ? pause() : play())}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="timeline-time">
          {formatTime(currentTime)}
        </div>
      </div>

      <div className="timeline-track">
        {clips.length === 0 ? (
          <div className="timeline-empty">
            <p>No clips added yet. Drag and drop video files to get started.</p>
          </div>
        ) : (
          <div className="timeline-clips">
            {clips.map((clip: Clip) => (
              <div
                key={clip.id}
                className={`timeline-clip ${selectedClipId === clip.id ? 'selected' : ''}`}
                onClick={() => selectClip(clip.id)}
                style={{
                  left: `${(clip.startTime / 100) * 100}px`,
                  width: `${((clip.endTime - clip.startTime) / 100) * 100}px`,
                }}
              >
                <div className="clip-name">{clip.name}</div>
              </div>
            ))}
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

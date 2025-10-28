import { useValues, useActions } from 'kea';
import { timelineLogic } from '../../logic/timelineLogic';
import './VideoPlayer.css';

export default function VideoPlayer() {
  const { clips, selectedClip } = useValues(timelineLogic);
  const { setCurrentTime } = useActions(timelineLogic);

  const currentClip = clips.length > 0 ? clips[0] : null;

  return (
    <div className="video-player-container">
      {currentClip ? (
        <div className="video-wrapper">
          <video
            className="video-element"
            controls
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              setCurrentTime(video.currentTime);
            }}
          >
            <source src={currentClip.filePath} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {selectedClip && (
            <div className="video-info">
              <p>Selected: {selectedClip.name}</p>
              <p>Duration: {formatDuration(selectedClip.duration)}</p>
              <p>
                Trim: {formatDuration(selectedClip.trimStart)} -{' '}
                {formatDuration(selectedClip.trimEnd)}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="video-placeholder">
          <div className="placeholder-content">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <p>No video loaded</p>
            <p className="placeholder-hint">Import a video to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

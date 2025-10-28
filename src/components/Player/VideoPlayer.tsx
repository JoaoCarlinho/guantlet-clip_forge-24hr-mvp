import { useValues, useActions } from 'kea';
import { timelineLogic } from '../../logic/timelineLogic';
import FileDropZone from '../shared/FileDropZone';
import './VideoPlayer.css';

export default function VideoPlayer() {
  const { clips, selectedClip, isPlaying } = useValues(timelineLogic);
  const { setCurrentTime, pause } = useActions(timelineLogic);

  // Use selected clip if available, otherwise use the first clip
  const currentClip = selectedClip || (clips.length > 0 ? clips[0] : null);

  return (
    <div className="video-player-container">
      {currentClip ? (
        <div className="video-wrapper">
          <video
            className="video-element"
            controls
            autoPlay={isPlaying}
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              setCurrentTime(video.currentTime);
            }}
            onPause={() => pause()}
            onEnded={() => pause()}
            key={currentClip.id}
          >
            <source src={currentClip.filePath} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <div className="video-info">
            <div className="info-row">
              <span className="info-label">Clip:</span>
              <span className="info-value">{currentClip.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Duration:</span>
              <span className="info-value">{formatDuration(currentClip.duration)}</span>
            </div>
            {selectedClip && (
              <div className="info-row">
                <span className="info-label">Trim:</span>
                <span className="info-value">
                  {formatDuration(currentClip.trimStart)} - {formatDuration(currentClip.trimEnd)}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <FileDropZone />
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

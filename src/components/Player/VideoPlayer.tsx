import { useRef, useEffect } from 'react';
import { useValues, useActions } from 'kea';
import { timelineLogic } from '../../logic/timelineLogic';
import FileDropZone from '../shared/FileDropZone';
import './VideoPlayer.css';

export default function VideoPlayer() {
  const { clips, selectedClip } = useValues(timelineLogic);
  const { setCurrentTime, pause, play } = useActions(timelineLogic);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use selected clip if available, otherwise use the first clip
  const currentClip = selectedClip || (clips.length > 0 ? clips[0] : null);

  // Set video to trim start when clip changes
  useEffect(() => {
    if (videoRef.current && currentClip) {
      videoRef.current.currentTime = currentClip.trimStart;
    }
  }, [currentClip?.id]);

  // Cleanup video resources on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        // Pause video and clear source to free memory
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, []);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;

    if (currentClip) {
      // Stop playback if we've reached the trim end point
      if (video.currentTime >= currentClip.trimEnd) {
        video.currentTime = currentClip.trimStart;
        pause();
      }

      // Don't allow seeking before trim start
      if (video.currentTime < currentClip.trimStart) {
        video.currentTime = currentClip.trimStart;
      }

      setCurrentTime(video.currentTime);
    }
  };

  const handlePlay = () => {
    if (videoRef.current && currentClip) {
      // Start from trim point if not already in range
      if (videoRef.current.currentTime < currentClip.trimStart ||
          videoRef.current.currentTime >= currentClip.trimEnd) {
        videoRef.current.currentTime = currentClip.trimStart;
      }
      play();
    }
  };

  const handleSeeked = () => {
    if (videoRef.current && currentClip) {
      // Constrain seeking to trim range
      if (videoRef.current.currentTime < currentClip.trimStart) {
        videoRef.current.currentTime = currentClip.trimStart;
      } else if (videoRef.current.currentTime > currentClip.trimEnd) {
        videoRef.current.currentTime = currentClip.trimEnd;
      }
    }
  };

  const trimmedDuration = currentClip ? currentClip.trimEnd - currentClip.trimStart : 0;

  return (
    <div className="video-player-container">
      {currentClip ? (
        <div className="video-wrapper">
          <video
            ref={videoRef}
            className="video-element"
            controls
            onTimeUpdate={handleTimeUpdate}
            onPause={() => pause()}
            onPlay={handlePlay}
            onSeeked={handleSeeked}
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
              <span className="info-label">Full Duration:</span>
              <span className="info-value">{formatDuration(currentClip.duration)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Trimmed:</span>
              <span className="info-value">
                {formatDuration(currentClip.trimStart)} → {formatDuration(currentClip.trimEnd)}
                {' '}({formatDuration(trimmedDuration)})
              </span>
            </div>
            {currentClip.trimStart > 0 || currentClip.trimEnd < currentClip.duration ? (
              <div className="trim-warning">
                <span className="warning-icon">✂️</span>
                <span>Clip has trim points applied</span>
              </div>
            ) : null}
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

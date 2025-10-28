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

  // Debug logging for video player render
  console.log('🎬 VideoPlayer render:', {
    clipsCount: clips.length,
    hasSelectedClip: !!selectedClip,
    hasCurrentClip: !!currentClip,
    currentClipPath: currentClip?.filePath,
    currentClipName: currentClip?.name,
    currentClipId: currentClip?.id
  });

  // Set video to trim start when clip changes and add detailed event logging
  useEffect(() => {
    if (videoRef.current && currentClip) {
      console.log('📹 Setting up video for clip:', currentClip.name);
      console.log('📹 Video source:', currentClip.filePath);
      console.log('📹 Video element exists:', !!videoRef.current);

      // Force video to load the new source
      videoRef.current.src = currentClip.filePath;
      videoRef.current.load();
      videoRef.current.currentTime = currentClip.trimStart;

      // Add comprehensive event listeners for debugging
      const video = videoRef.current;

      const handleLoadStart = () => {
        console.log('✅ Video load started for:', currentClip.name);
      };

      const handleLoadedMetadata = () => {
        console.log('✅ Video metadata loaded:', {
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
      };

      const handleLoadedData = () => {
        console.log('✅ Video data loaded successfully for:', currentClip.name);
      };

      const handleCanPlay = () => {
        console.log('✅ Video can play:', currentClip.name);
      };

      const handleError = (e: Event) => {
        console.error('❌ Video error event:', e);
        if (video.error) {
          const errorMessages = {
            1: 'MEDIA_ERR_ABORTED - The user aborted the video playback',
            2: 'MEDIA_ERR_NETWORK - A network error occurred while fetching the video',
            3: 'MEDIA_ERR_DECODE - An error occurred while decoding the video',
            4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - The video format is not supported or the source is invalid'
          };
          console.error('❌ Video error details:', {
            code: video.error.code,
            message: video.error.message || errorMessages[video.error.code as keyof typeof errorMessages],
            src: video.src,
            networkState: video.networkState,
            readyState: video.readyState,
            currentSrc: video.currentSrc
          });
        }
      };

      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };
    }
  }, [currentClip?.id, currentClip?.filePath]);

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
    <div className="video-player-container" style={{ position: 'relative' }}>
      {/* Always render FileDropZone to keep drag-drop listeners active */}
      {/* It will be hidden behind the video player when a clip is playing */}
      <FileDropZone>
        {!currentClip && (
          /* Show drop zone content only when no clips loaded */
          null  /* Content is rendered inside FileDropZone component */
        )}
      </FileDropZone>

      {/* Show video player overlaid on top when clip exists */}
      {currentClip && (
        <div
          className="video-wrapper"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            backgroundColor: '#0a0a0a'
          }}
        >
          <video
            ref={videoRef}
            className="video-element"
            controls
            onTimeUpdate={handleTimeUpdate}
            onPause={() => pause()}
            onPlay={handlePlay}
            onSeeked={handleSeeked}
            onEnded={() => pause()}
            onError={(e) => {
              const video = e.currentTarget;
              console.error('❌ Video element error (inline handler):', {
                errorCode: video.error?.code,
                errorMessage: video.error?.message,
                src: video.src,
                currentSrc: video.currentSrc,
                networkState: video.networkState,
                readyState: video.readyState
              });
            }}
            onLoadStart={() => console.log('📹 Video onLoadStart (inline):', currentClip.name)}
            onLoadedData={() => console.log('✅ Video onLoadedData (inline):', currentClip.name)}
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
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

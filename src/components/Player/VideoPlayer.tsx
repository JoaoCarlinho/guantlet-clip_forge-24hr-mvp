import { useRef, useEffect } from 'react';
import { useValues, useActions } from 'kea';
import { timelineLogic } from '../../logic/timelineLogic';
import FileDropZone from '../shared/FileDropZone';
import './VideoPlayer.css';

export default function VideoPlayer() {
  const {
    clips,
    selectedClip,
    activeClip,
    isPlaying,
    effectivePreviewTime,
    activeTrimClipId,
    activeTrimType,
    nextClip,
  } = useValues(timelineLogic);
  const { setCurrentTime, pause, play, setActiveClip } = useActions(timelineLogic);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Throttle state updates to prevent performance issues
  const lastUpdateTime = useRef<number>(0);
  const UPDATE_INTERVAL = 100; // Update state every 100ms (10 times per second)

  // Use activeClip when playing, selectedClip for preview, fallback to first clip
  const currentClip = (isPlaying && activeClip)
    ? activeClip
    : (selectedClip || (clips.length > 0 ? clips[0] : null));

  // Debug logging for video player render
  console.log('🎬 VideoPlayer render:', {
    clipsCount: clips.length,
    hasSelectedClip: !!selectedClip,
    hasCurrentClip: !!currentClip,
    currentClipPath: currentClip?.filePath,
    currentClipName: currentClip?.name,
    currentClipId: currentClip?.id,
    willShowVideo: !!currentClip,
    willShowDropZone: !currentClip
  });

  if (currentClip) {
    console.log('✅ VIDEO WRAPPER WILL BE RENDERED');
  } else {
    console.log('📂 FILE DROP ZONE WILL BE SHOWN');
  }

  // Set video to trim start when clip changes and add detailed event logging
  useEffect(() => {
    if (videoRef.current && currentClip) {
      console.log('📹 Setting up video for clip:', currentClip.name);
      console.log('📹 Video source:', currentClip.filePath);
      console.log('📹 Video element exists:', !!videoRef.current);

      // Check if source actually needs to change (avoid unnecessary reloads)
      const needsSourceChange = videoRef.current.src !== currentClip.filePath;

      if (needsSourceChange) {
        console.log('🔄 Loading new video source');
        // Force video to load the new source
        videoRef.current.src = currentClip.filePath;
        videoRef.current.load();
      }

      // Wait for metadata before setting currentTime to avoid black screen
      const setInitialTime = () => {
        if (videoRef.current && videoRef.current.readyState >= 1) {
          // When clip changes, start at sourceStart (beginning of clip)
          // Don't use currentTime here to avoid dependency loop
          videoRef.current.currentTime = currentClip.sourceStart;

          console.log('⏱️ Set video time to sourceStart:', {
            sourceStart: currentClip.sourceStart,
            clipName: currentClip.name,
          });
        }
      };

      if (videoRef.current.readyState >= 1 && !needsSourceChange) {
        setInitialTime();
      } else if (needsSourceChange) {
        videoRef.current.addEventListener('loadedmetadata', setInitialTime, { once: true });
      }

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
        const computed = window.getComputedStyle(video);
        console.log('🎥 Video element dimensions:', {
          offsetWidth: video.offsetWidth,
          offsetHeight: video.offsetHeight,
          clientWidth: video.clientWidth,
          clientHeight: video.clientHeight,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          zIndex: computed.zIndex,
          position: computed.position,
          width: computed.width,
          height: computed.height
        });

        // Try to force a repaint
        video.style.display = 'none';
        video.offsetHeight; // Force reflow
        video.style.display = 'block';
        console.log('🔄 Forced video repaint');
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

  // Sync isPlaying state with actual video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClip) return;

    console.log('🎮 isPlaying state changed:', isPlaying);

    if (isPlaying) {
      // Ensure video is in correct time range before playing
      if (video.currentTime < currentClip.sourceStart ||
          video.currentTime >= currentClip.sourceEnd) {
        video.currentTime = currentClip.sourceStart;
      }

      // Play the video
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Video started playing');
          })
          .catch((error) => {
            console.error('❌ Failed to play video:', error);
            // If play fails, update state back to paused
            pause();
          });
      }
    } else {
      // Pause the video
      if (!video.paused) {
        video.pause();
        console.log('⏸️ Video paused from state change');
      }
    }
  }, [isPlaying, currentClip?.id]);

  // Update video preview during trim adjustment - with throttling for smooth performance
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClip) return;

    // Only update preview if we have a preview time
    if (effectivePreviewTime !== null && !isPlaying) {
      // Throttle video seeking using requestAnimationFrame for smooth performance
      let rafId: number | null = null;

      const updateVideoTime = () => {
        if (video && effectivePreviewTime !== null) {
          // Only seek if the difference is significant (avoid micro-seeks)
          const timeDiff = Math.abs(video.currentTime - effectivePreviewTime);
          if (timeDiff > 0.016) { // ~1 frame at 60fps
            video.currentTime = effectivePreviewTime;
          }
        }
        rafId = null;
      };

      // Schedule update on next animation frame if not already scheduled
      if (rafId === null) {
        rafId = requestAnimationFrame(updateVideoTime);
      }

      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
      };
    }
  }, [effectivePreviewTime, currentClip?.id, isPlaying]);

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

    if (!currentClip || !isPlaying) return;

    const now = Date.now();

    // Calculate current global timeline position
    const relativeTimeInClip = video.currentTime - currentClip.sourceStart;
    const globalTime = currentClip.startTime + relativeTimeInClip;

    // Use a small threshold to prevent overshooting on very short clips
    const END_THRESHOLD = 0.05; // 50ms threshold

    // Check if we've reached the end of current clip (trimEnd in source video)
    // Always check for clip end, regardless of throttling
    if (video.currentTime >= (currentClip.sourceEnd - END_THRESHOLD)) {
      console.log('🎬 Reached end of clip:', currentClip.name);

      // Check if there's a next clip
      const nextClipToPlay = nextClip;

      if (nextClipToPlay) {
        console.log('➡️ Transitioning to next clip:', nextClipToPlay.name);

        // Update active clip
        setActiveClip(nextClipToPlay.id);

        // Update global timeline position to start of next clip
        setCurrentTime(nextClipToPlay.startTime);
        lastUpdateTime.current = now; // Reset throttle timer

        // The video source will change via useEffect, which will:
        // 1. Load the new video file (if different)
        // 2. Seek to sourceStart of new clip
        // 3. Continue playing automatically (isPlaying is still true)
      } else {
        // No more clips - stop playback
        console.log('⏹️ Reached end of timeline');
        setCurrentTime(globalTime);
        pause();
        return;
      }
    } else {
      // Normal playback - throttle state updates to reduce re-renders
      const shouldUpdate = (now - lastUpdateTime.current) >= UPDATE_INTERVAL;

      if (shouldUpdate) {
        setCurrentTime(globalTime);
        lastUpdateTime.current = now;
      }
    }

    // Don't allow seeking before source start
    if (video.currentTime < currentClip.sourceStart) {
      video.currentTime = currentClip.sourceStart;
    }
  };

  const handlePlay = () => {
    if (videoRef.current && currentClip) {
      // Start from source start if not already in range
      if (videoRef.current.currentTime < currentClip.sourceStart ||
          videoRef.current.currentTime >= currentClip.sourceEnd) {
        videoRef.current.currentTime = currentClip.sourceStart;
      }
      play();
    }
  };

  const handleSeeked = () => {
    if (videoRef.current && currentClip) {
      // Constrain seeking to source range
      if (videoRef.current.currentTime < currentClip.sourceStart) {
        videoRef.current.currentTime = currentClip.sourceStart;
      } else if (videoRef.current.currentTime > currentClip.sourceEnd) {
        videoRef.current.currentTime = currentClip.sourceEnd;
      }
    }
  };

  const trimmedDuration = currentClip ? currentClip.trimEnd - currentClip.trimStart : 0;

  return (
    <div className="video-player-container" style={{ position: 'relative', height: '100%', width: '100%', maxWidth: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Always render FileDropZone to keep drag-drop listeners active */}
      {/* Hide it completely when video is playing */}
      <div style={{ display: currentClip ? 'none' : 'block', height: '100%', width: '100%' }}>
        <FileDropZone />
      </div>

      {/* Show video player when clip exists */}
      {currentClip && (
        <div
          className="video-wrapper"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            maxWidth: '900px',
            minWidth: 0,
            padding: '1rem',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'center',
            overflowX: 'hidden',
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}
        >
          <video
            ref={videoRef}
            className="video-element"
            controls
            style={{
              width: '100%',
              maxWidth: '800px',
              height: 'auto',
              aspectRatio: '4/3',
              objectFit: 'contain',
              boxSizing: 'border-box'
            }}
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
            {activeTrimClipId === currentClip.id && (
              <div className="trim-preview-indicator">
                <span className="preview-icon">✂️</span>
                <span>
                  Adjusting {activeTrimType === 'in' ? 'IN' : 'OUT'} point - Preview: {formatDuration(effectivePreviewTime || 0)}
                </span>
              </div>
            )}
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

import { useState } from 'react';
import { useActions, useValues } from 'kea';
import { recordingLogic } from '../../logic/recordingLogic';
import { useRecorder } from '../../hooks/useRecorder';
import Button from '../shared/Button';
import './RecordingControls.css';

export interface RecordingControlsProps {
  className?: string;
}

const RecordingControls = ({ className = '' }: RecordingControlsProps) => {
  const { lastRecording } = useValues(recordingLogic);
  const { setLastRecording, saveToTimeline } = useActions(recordingLogic);

  const recorder = useRecorder();
  const { state: recorderState } = recorder;

  const [config, setConfig] = useState({
    includeWebcam: false,
    includeScreen: true,
    includeAudio: true,
  });

  const { isRecording, isPaused, recordingTime, error } = recorderState;

  const handleStartRecording = async () => {
    console.log('🔵 Start Recording button clicked');
    try {
      await recorder.startRecording(config);
      console.log('✅ Recording started successfully');
    } catch (err) {
      console.error('❌ Failed to start recording:', err);
    }
  };

  const handleStopRecording = async () => {
    console.log('🔴 Stop Recording button clicked');
    try {
      const clip = await recorder.stopRecording();
      console.log('📹 Stop recording returned:', clip);
      if (clip) {
        console.log('💾 Saving clip to Kea logic and timeline');
        setLastRecording(clip);

        // Automatically trigger download
        console.log('⬇️ Auto-downloading recording...');
        const a = document.createElement('a');
        a.href = clip.url;
        a.download = `recording-${new Date().toISOString().replace(/:/g, '-').slice(0, -5)}.webm`;
        console.log(`📁 Download filename: ${a.download}`);
        console.log(`🔗 Download URL: ${clip.url.substring(0, 50)}...`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log('✅ Download triggered');

        // Automatically save to timeline after a short delay
        // This gives user a chance to see the preview, then auto-adds to timeline
        setTimeout(() => {
          console.log('🎬 Auto-saving clip to timeline');
          saveToTimeline();
        }, 500);
      } else {
        console.warn('⚠️ No clip returned from stopRecording');
      }
    } catch (err) {
      console.error('❌ Failed to stop recording:', err);
    }
  };

  const handlePauseRecording = () => {
    if (isPaused) {
      recorder.resumeRecording();
    } else {
      recorder.pauseRecording();
    }
  };

  const handleSaveToTimeline = () => {
    if (lastRecording) {
      saveToTimeline();
    }
  };

  const handleDownloadRecording = () => {
    if (!lastRecording) {
      console.warn('⚠️ No recording to download');
      return;
    }

    console.log('💾 Downloading recording...');

    // Create a download link
    const a = document.createElement('a');
    a.href = lastRecording.url;
    a.download = `recording-${new Date().toISOString().replace(/:/g, '-').slice(0, -5)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    console.log('✅ Download initiated');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`recording-controls ${className}`}>
      <div className="recording-controls-header">
        <h2>Recording Controls</h2>
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span className="recording-time">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="recording-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}

      {!isRecording && (
        <div className="recording-config">
          <h3>Recording Options</h3>
          <div className="config-options">
            <label className="config-option">
              <input
                type="checkbox"
                checked={config.includeScreen}
                onChange={(e) => setConfig({ ...config, includeScreen: e.target.checked })}
              />
              <span>Screen Capture</span>
            </label>
            <label className="config-option">
              <input
                type="checkbox"
                checked={config.includeWebcam}
                onChange={(e) => setConfig({ ...config, includeWebcam: e.target.checked })}
              />
              <span>Webcam</span>
            </label>
            <label className="config-option">
              <input
                type="checkbox"
                checked={config.includeAudio}
                onChange={(e) => setConfig({ ...config, includeAudio: e.target.checked })}
              />
              <span>Microphone</span>
            </label>
          </div>
        </div>
      )}

      <div className="recording-actions">
        {!isRecording ? (
          <Button
            onClick={handleStartRecording}
            variant="primary"
            disabled={!config.includeScreen && !config.includeWebcam}
          >
            <span className="button-icon">⏺</span>
            Start Recording
          </Button>
        ) : (
          <>
            <Button
              onClick={handlePauseRecording}
              variant="secondary"
            >
              <span className="button-icon">{isPaused ? '▶️' : '⏸'}</span>
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              onClick={handleStopRecording}
              variant="danger"
            >
              <span className="button-icon">⏹</span>
              Stop
            </Button>
          </>
        )}
      </div>

      {lastRecording && !isRecording && (
        <div className="recording-preview">
          <h3>Last Recording</h3>
          <div className="preview-info">
            <p>Duration: {formatTime(lastRecording.duration)}</p>
            <video
              src={lastRecording.url}
              controls
              className="preview-video"
              style={{ maxWidth: '100%', maxHeight: '200px' }}
            />
          </div>
          <div className="recording-actions">
            <Button
              onClick={handleDownloadRecording}
              variant="secondary"
              className="download-button"
            >
              <span className="button-icon">⬇️</span>
              Download
            </Button>
            <Button
              onClick={handleSaveToTimeline}
              variant="primary"
              className="save-button"
            >
              <span className="button-icon">💾</span>
              Save to Timeline
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingControls;

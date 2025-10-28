import { useEffect, useRef } from 'react';
import { useValues, useActions } from 'kea';
import { projectLogic } from '../../logic/projectLogic';
import Button from './Button';
import './ExportPanel.css';

export default function ExportPanel() {
  const {
    isExporting,
    exportProgress,
    exportError,
    exportSuccess,
    exportLog,
    exportedVideoUrl,
  } = useValues(projectLogic);

  const { startExport, resetExport, downloadExportedVideo } = useActions(projectLogic);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cleanup video element on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, []);

  const handleExport = () => {
    startExport();
  };

  const handleDownload = () => {
    downloadExportedVideo();
  };

  const handleReset = () => {
    resetExport();
  };

  return (
    <div className="export-panel">
      <div className="export-header">
        <h3>Export Video</h3>
        {!isExporting && !exportSuccess && !exportError && (
          <Button onClick={handleExport} variant="primary">
            Export Clips
          </Button>
        )}
      </div>

      {isExporting && (
        <div className="export-progress-container">
          <div className="progress-info">
            <span>Exporting...</span>
            <span className="progress-percent">{Math.round(exportProgress)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {exportSuccess && exportedVideoUrl && (
        <div className="export-success">
          <div className="success-icon">✓</div>
          <p className="success-message">Export completed successfully!</p>
          <div className="export-actions">
            <Button onClick={handleDownload} variant="primary">
              Download Video
            </Button>
            <Button onClick={handleReset} variant="secondary">
              Export Another
            </Button>
          </div>
          {exportedVideoUrl && (
            <div className="preview-container">
              <p className="preview-label">Preview:</p>
              <video
                ref={videoRef}
                src={exportedVideoUrl}
                controls
                className="preview-video"
              />
            </div>
          )}
        </div>
      )}

      {exportError && (
        <div className="export-error">
          <div className="error-icon">✗</div>
          <p className="error-message">{exportError}</p>
          <Button onClick={handleReset} variant="secondary">
            Try Again
          </Button>
        </div>
      )}

      {exportLog.length > 0 && (
        <div className="export-log">
          <details>
            <summary>Export Log ({exportLog.length} messages)</summary>
            <div className="log-content">
              {exportLog.map((message: string, index: number) => (
                <div key={index} className="log-entry">
                  <span className="log-index">[{index + 1}]</span>
                  <span className="log-message">{message}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

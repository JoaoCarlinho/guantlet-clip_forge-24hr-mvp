import { useEffect, useRef, useState } from 'react';
import { useValues, useActions } from 'kea';
import { projectLogic, ExportQuality } from '../../logic/projectLogic';
import { timelineLogic, type Clip } from '../../logic/timelineLogic';
import Button from './Button';
import './ExportPanel.css';

// Helper function to format duration
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Export Preview Modal Component
interface ExportPreviewModalProps {
  clips: Clip[];
  onConfirm: () => void;
  onCancel: () => void;
}

function ExportPreviewModal({ clips, onConfirm, onCancel }: ExportPreviewModalProps) {
  const totalDuration = clips.reduce(
    (sum, clip) => sum + (clip.trimEnd - clip.trimStart),
    0
  );

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="export-preview-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Confirm Export</h2>

        <div className="preview-summary">
          <p><strong>Clips:</strong> {clips.length}</p>
          <p><strong>Total Duration:</strong> {formatDuration(totalDuration)}</p>
        </div>

        <div className="preview-clip-list">
          <h3>Clip Order:</h3>
          <ol>
            {clips.map((clip) => (
              <li key={clip.id}>
                <span className="clip-name">{clip.name}</span>
                <span className="clip-duration">
                  ({formatDuration(clip.trimEnd - clip.trimStart)})
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="modal-actions">
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="primary">
            Start Export
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ExportPanel() {
  const {
    isExporting,
    exportProgress,
    exportError,
    exportSuccess,
    exportLog,
    exportedVideoUrl,
    exportSettings,
  } = useValues(projectLogic);

  const { clips } = useValues(timelineLogic);

  const { startExport, resetExport, downloadExportedVideo, setExportQuality } = useActions(projectLogic);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPreview, setShowPreview] = useState(false);

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
      </div>

      {!isExporting && !exportSuccess && !exportError && (
        <>
          <div className="export-settings">
            <label htmlFor="quality-select">Export Quality:</label>
            <select
              id="quality-select"
              value={exportSettings.quality}
              onChange={(e) => setExportQuality(e.target.value as ExportQuality)}
              disabled={isExporting}
            >
              <option value={ExportQuality.LOW}>Low (Fast, smaller file)</option>
              <option value={ExportQuality.MEDIUM}>Medium (Balanced)</option>
              <option value={ExportQuality.HIGH}>High (Slow, best quality)</option>
            </select>
          </div>
          <Button
            onClick={() => setShowPreview(true)}
            variant="primary"
            className="export-button"
            disabled={clips.length === 0}
          >
            Export {clips.length} Clip{clips.length !== 1 ? 's' : ''}
          </Button>
        </>
      )}

      {showPreview && (
        <ExportPreviewModal
          clips={clips}
          onConfirm={() => {
            setShowPreview(false);
            handleExport();
          }}
          onCancel={() => setShowPreview(false)}
        />
      )}

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
              Open File Location
            </Button>
            <Button onClick={handleReset} variant="secondary">
              Export Another
            </Button>
          </div>
          {exportedVideoUrl && (
            <div className="preview-container">
              <p className="preview-label">File saved to:</p>
              <p style={{ fontSize: '0.9em', color: '#888', wordBreak: 'break-all' }}>
                {exportedVideoUrl}
              </p>
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

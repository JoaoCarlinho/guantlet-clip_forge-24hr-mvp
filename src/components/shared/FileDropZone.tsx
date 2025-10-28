import { useState, useRef } from 'react';
import { useActions } from 'kea';
import { timelineLogic, type Clip } from '../../logic/timelineLogic';
import './FileDropZone.css';

interface FileDropZoneProps {
  children?: React.ReactNode;
}

export default function FileDropZone({ children }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addClip } = useActions(timelineLogic);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    console.log(`Dropped ${files.length} file(s)`);
    await processFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    await processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      // Check if file is a video
      if (!file.type.startsWith('video/')) {
        console.warn(`Skipping non-video file: ${file.name}`);
        continue;
      }

      // Only accept MP4 and MOV files
      const extension = file.name.toLowerCase().split('.').pop();
      if (!['mp4', 'mov'].includes(extension || '')) {
        console.warn(`Unsupported video format: ${file.name}`);
        continue;
      }

      try {
        console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

        // Create a blob URL for the video file
        // This URL will persist and can be used by the video player
        const videoUrl = URL.createObjectURL(file);
        const video = document.createElement('video');

        // Wait for video metadata to load
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout loading video metadata'));
          }, 10000); // 10 second timeout

          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve();
          };
          video.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Failed to load video metadata'));
          };
          video.src = videoUrl;
        });

        const duration = video.duration;

        // Important: Don't revoke the blob URL - we need it for playback
        // It will be cleaned up when the clip is removed or page is closed

        // Create clip object with blob URL
        const clip: Clip = {
          id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          filePath: videoUrl, // Use blob URL directly
          duration,
          startTime: 0, // Will be set when added to timeline
          endTime: duration,
          trimStart: 0,
          trimEnd: duration,
        };

        addClip(clip);
        console.log(`✓ Added clip: ${file.name} (${duration.toFixed(2)}s)`);
      } catch (error) {
        console.error(`✗ Error processing file ${file.name}:`, error);
      }
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,.mp4,.mov"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {children || (
        <div className="drop-zone-content">
          <div className="drop-zone-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h3>Drop video files here</h3>
          <p>or</p>
          <button className="browse-button" onClick={openFilePicker}>
            Browse Files
          </button>
          <p className="file-types">Supports MP4 and MOV files</p>
        </div>
      )}

      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-overlay-content">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p>Drop files to import</p>
          </div>
        </div>
      )}
    </div>
  );
}

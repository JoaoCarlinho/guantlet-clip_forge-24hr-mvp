import { useState, useRef, useEffect } from 'react';
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

  // Tauri V2 file drop event listeners
  useEffect(() => {
    let unlisteners: Array<() => void> = [];

    console.log('🔍 FileDropZone mounted, checking environment...');

    const setupTauriListeners = async () => {
      try {
        // Try to import Tauri V2 event module
        const { listen } = await import('@tauri-apps/api/event');

        console.log('✅ Tauri API loaded - setting up native file drop');
        console.log('🔍 Running in: TAURI MODE (V2)');

        // Listen for file drop events using string event names
        // Tauri V2 file-drop events use these specific string names
        const unlistenDrop = await listen('tauri://file-drop', async (event: any) => {
          console.log('🟢 Tauri file-drop event:', event.payload);
          setIsDragging(false);
          dragCounter.current = 0;

          const filePaths = event.payload as string[];
          console.log(`📁 Received ${filePaths.length} file path(s) from Tauri:`, filePaths);
          await processFilePaths(filePaths);
        });
        unlisteners.push(unlistenDrop);
        console.log('✅ Tauri file-drop listener registered');

        // Listen for drag hover events
        const unlistenHover = await listen('tauri://file-drop-hover', () => {
          console.log('🟢 Tauri file-drop-hover event');
          setIsDragging(true);
        });
        unlisteners.push(unlistenHover);
        console.log('✅ Tauri file-drop-hover listener registered');

        // Listen for drag cancelled events
        const unlistenCancelled = await listen('tauri://file-drop-cancelled', () => {
          console.log('🟢 Tauri file-drop-cancelled event');
          setIsDragging(false);
          dragCounter.current = 0;
        });
        unlisteners.push(unlistenCancelled);
        console.log('✅ Tauri file-drop-cancelled listener registered');

      } catch (error) {
        console.log('ℹ️ Tauri not available - using HTML5 drag-and-drop only');
        console.log('🔍 Running in: BROWSER MODE');
        console.log('Error details:', error);
      }
    };

    setupTauriListeners();

    return () => {
      console.log('🧹 Cleaning up Tauri listeners');
      unlisteners.forEach(unlisten => unlisten());
    };
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    console.log('🎯 DRAG ENTER EVENT FIRED', {
      dragCounter: dragCounter.current,
      hasItems: e.dataTransfer.items?.length > 0,
      itemsLength: e.dataTransfer.items?.length,
      types: Array.from(e.dataTransfer.types || [])
    });
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      console.log('✅ Setting isDragging to TRUE');
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    console.log('🔄 DRAG OVER EVENT FIRED');
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    console.log('🚪 DRAG LEAVE EVENT FIRED', {
      dragCounter: dragCounter.current,
      willHide: dragCounter.current - 1 === 0
    });
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      console.log('❌ Setting isDragging to FALSE');
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    console.log('📦 DROP EVENT FIRED', {
      filesCount: e.dataTransfer.files.length,
      types: Array.from(e.dataTransfer.types || [])
    });
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    console.log(`📁 Dropped ${files.length} file(s):`, files.map(f => f.name));
    await processFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    await processFiles(files);
  };

  // Process file paths from Tauri drag-and-drop
  const processFilePaths = async (filePaths: string[]) => {
    console.log(`Processing ${filePaths.length} file path(s) from Tauri`);

    for (const filePath of filePaths) {
      // Check file extension
      const extension = filePath.toLowerCase().split('.').pop();
      if (!['mp4', 'mov'].includes(extension || '')) {
        console.warn(`Unsupported video format: ${filePath}`);
        continue;
      }

      try {
        console.log(`Processing file path: ${filePath}`);

        // Convert file path to a URL that can be used by the video element
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        const videoUrl = convertFileSrc(filePath);
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
        const fileName = filePath.split(/[/\\]/).pop() || 'video.mp4';

        // Create clip object
        const clip: Clip = {
          id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: fileName,
          filePath: videoUrl, // Use converted Tauri URL
          duration,
          startTime: 0,
          endTime: duration,
          trimStart: 0,
          trimEnd: duration,
        };

        addClip(clip);
        console.log(`✓ Added clip: ${fileName} (${duration.toFixed(2)}s)`);
      } catch (error) {
        console.error(`✗ Error processing file path ${filePath}:`, error);
      }
    }
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

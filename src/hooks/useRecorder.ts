import { useState, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';

export interface RecordingConfig {
  includeWebcam: boolean;
  includeScreen: boolean;
  includeAudio: boolean;
  videoWidth?: number;
  videoHeight?: number;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  error: string | null;
}

export interface RecordedClip {
  blob: Blob;
  url: string;
  duration: number;
  timestamp: number;
}

/**
 * Check if we're running in Tauri desktop environment
 */
const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

/**
 * Check if getDisplayMedia is available (browser environment)
 */
const isGetDisplayMediaAvailable = (): boolean => {
  return !!(
    navigator?.mediaDevices?.getDisplayMedia &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function'
  );
};

export const useRecorder = () => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  /**
   * Start recording with specified configuration
   */
  const startRecording = useCallback(async (config: RecordingConfig): Promise<void> => {
    console.log('🎬 startRecording called with config:', config);
    console.log('🖥️ Environment: Tauri =', isTauri(), ', getDisplayMedia =', isGetDisplayMediaAvailable());

    try {
      setState((prev) => ({ ...prev, error: null }));

      const streams: MediaStream[] = [];

      // Capture screen if requested
      if (config.includeScreen) {
        console.log('📺 Requesting screen capture...');
        console.log('🔍 Checking API availability:');
        console.log('  - navigator exists:', typeof navigator !== 'undefined');
        console.log('  - mediaDevices exists:', !!navigator?.mediaDevices);
        console.log('  - getDisplayMedia exists:', !!navigator?.mediaDevices?.getDisplayMedia);
        console.log('  - getDisplayMedia type:', typeof navigator?.mediaDevices?.getDisplayMedia);

        // Try to capture screen - let it fail naturally if API doesn't exist
        try {
          console.log('🎥 Attempting to call getDisplayMedia...');

          // Check if navigator and mediaDevices exist
          if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
            throw new Error(
              'Media devices API not available. ' +
              'If you are using the desktop app, please try the browser version instead: ' +
              'npm run dev, then open http://localhost:1420 in Chrome or Edge.'
            );
          }

          // Try to get the method - it might not be available even if mediaDevices exists
          const getDisplayMedia = navigator.mediaDevices.getDisplayMedia;
          if (!getDisplayMedia) {
            throw new Error(
              'Screen capture (getDisplayMedia) is not supported in this environment. ' +
              'Please use the browser version: npm run dev, then open http://localhost:1420 in Chrome or Edge.'
            );
          }

          // Call the API
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: config.videoWidth || 1920,
              height: config.videoHeight || 1080,
              frameRate: 30,
            },
            audio: false, // We'll capture audio separately if needed
          });
          console.log('✅ Screen capture granted');
          screenStreamRef.current = screenStream;
          streams.push(screenStream);
        } catch (err) {
          console.error('❌ Screen capture failed:', err);

          // User cancelled or permission denied
          if (err instanceof DOMException) {
            if (err.name === 'NotAllowedError') {
              throw new Error('Screen recording permission was denied');
            } else if (err.name === 'NotFoundError') {
              throw new Error('No screen source was selected');
            } else if (err.name === 'AbortError') {
              throw new Error('Screen recording was cancelled');
            }
          }

          // Re-throw if it's already our custom error
          if (err instanceof Error && err.message.includes('not available')) {
            throw err;
          }

          throw new Error(`Failed to capture screen: ${err}`);
        }
      }

      // Capture webcam if requested
      if (config.includeWebcam) {
        try {
          const webcamStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: 640,
              height: 480,
              frameRate: 30,
            },
            audio: false,
          });
          webcamStreamRef.current = webcamStream;
          streams.push(webcamStream);
        } catch (err) {
          throw new Error(`Failed to capture webcam: ${err}`);
        }
      }

      // Capture audio if requested
      if (config.includeAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
            },
            video: false,
          });
          audioStreamRef.current = audioStream;
          streams.push(audioStream);
        } catch (err) {
          console.warn('Failed to capture audio, continuing without audio:', err);
        }
      }

      if (streams.length === 0) {
        console.error('❌ No media streams available');
        throw new Error('No media streams available to record');
      }

      console.log(`✅ Collected ${streams.length} stream(s)`);

      // Combine all streams into one
      const combinedStream = new MediaStream();
      streams.forEach((stream) => {
        stream.getTracks().forEach((track) => {
          console.log(`📎 Adding track: ${track.kind} - ${track.label}`);
          combinedStream.addTrack(track);
        });
      });

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
        ? 'video/webm; codecs=vp9'
        : 'video/webm';

      console.log(`🎥 Creating MediaRecorder with mimeType: ${mimeType}`);

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log(`📦 Data chunk received: ${event.data.size} bytes, total chunks: ${chunksRef.current.length}`);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('⏹ Recording stopped, chunks collected:', chunksRef.current.length);
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        setState((prev) => ({
          ...prev,
          error: 'Recording error occurred',
          isRecording: false
        }));
      };

      // Start recording
      console.log('▶️ Starting MediaRecorder...');
      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      console.log(`✅ MediaRecorder started, state: ${mediaRecorder.state}`);

      // Start timer
      startTimeRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState((prev) => ({ ...prev, recordingTime: elapsed }));
      }, 1000);

      setState((prev) => ({ ...prev, isRecording: true, recordingTime: 0 }));
      console.log('✅ Recording state updated to isRecording: true');

      // Notify backend that recording started
      try {
        console.log('📡 Notifying Tauri backend...');
        await invoke('start_screen_record', {
          config: {
            output_path: 'recording.webm',
            fps: 30,
            width: config.videoWidth,
            height: config.videoHeight,
          },
        });
        console.log('✅ Tauri backend notified');
      } catch (invokeError) {
        console.warn('⚠️ Failed to notify Tauri backend (may be running in browser):', invokeError);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setState((prev) => ({ ...prev, error: errorMessage }));
      stopAllStreams();
      throw err;
    }
  }, []);

  /**
   * Stop recording and return the recorded clip
   */
  const stopRecording = useCallback(async (): Promise<RecordedClip | null> => {
    console.log('⏹ stopRecording called');
    console.log(`📊 Current state: isRecording=${state.isRecording}, recordingTime=${state.recordingTime}`);

    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        console.warn('⚠️ No mediaRecorder found');
        resolve(null);
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;
      console.log(`📹 MediaRecorder state before stop: ${mediaRecorder.state}`);

      // Check MediaRecorder state instead of our state flag
      if (mediaRecorder.state === 'inactive') {
        console.warn('⚠️ MediaRecorder already inactive');
        resolve(null);
        return;
      }

      mediaRecorder.onstop = async () => {
        console.log('🛑 MediaRecorder stopped event fired');

        // Clear timer
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          console.log('⏱ Timer cleared');
        }

        // Calculate actual duration from start time
        const actualDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        console.log(`⏱ Recording duration: ${actualDuration}s`);

        // Create blob from chunks
        console.log(`📦 Creating blob from ${chunksRef.current.length} chunks`);
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        console.log(`✅ Blob created: ${blob.size} bytes, duration: ${actualDuration}s`);

        const clip: RecordedClip = {
          blob,
          url,
          duration: actualDuration,
          timestamp: Date.now(),
        };

        // Stop all streams
        stopAllStreams();
        console.log('🔌 All streams stopped');

        // Reset state
        setState({
          isRecording: false,
          isPaused: false,
          recordingTime: 0,
          error: null,
        });
        console.log('✅ State reset');

        // Notify backend that recording stopped
        try {
          console.log('📡 Notifying Tauri backend...');
          await invoke('stop_screen_record');
          console.log('✅ Tauri backend notified');
        } catch (err) {
          console.warn('⚠️ Failed to notify backend (may be running in browser):', err);
        }

        console.log('✅ Recording complete, returning clip');
        resolve(clip);
      };

      console.log('🛑 Calling mediaRecorder.stop()...');
      mediaRecorder.stop();
    });
  }, []); // No dependencies - uses refs instead of state

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused]);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();

      // Restart timer
      const currentTime = state.recordingTime;
      startTimeRef.current = Date.now() - (currentTime * 1000);
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState((prev) => ({ ...prev, recordingTime: elapsed }));
      }, 1000);

      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused, state.recordingTime]);

  /**
   * Save recorded clip to file system
   */
  const saveRecordingToFile = useCallback(async (clip: RecordedClip): Promise<string | null> => {
    try {
      // Show save dialog
      const filePath = await save({
        filters: [{
          name: 'Video',
          extensions: ['webm', 'mp4']
        }],
        defaultPath: `recording-${Date.now()}.webm`
      });

      if (!filePath) {
        return null; // User cancelled
      }

      // Convert blob to array buffer
      const arrayBuffer = await clip.blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Save to file using Tauri backend
      await invoke('save_recording', {
        videoData: Array.from(uint8Array),
        outputPath: filePath,
      });

      return filePath;
    } catch (err) {
      console.error('Failed to save recording:', err);
      throw err;
    }
  }, []);

  /**
   * Stop all media streams
   */
  const stopAllStreams = () => {
    [screenStreamRef, webcamStreamRef, audioStreamRef].forEach((streamRef) => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    });
  };

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    saveRecordingToFile,
  };
};

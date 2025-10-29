import { useState, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { RecordingConfig, RecordingState, RecordedClip } from './useRecorder';

export interface NativeRecordingConfig {
  output_path: string;
  fps: number;
  width?: number;
  height?: number;
  audio: boolean;
  display_id?: number;
}

export interface NativeRecordingStatus {
  is_recording: boolean;
  output_path?: string;
  error?: string;
}

/**
 * Native screen recorder hook using Tauri backend
 * This uses platform-specific APIs (AVFoundation on macOS, x11grab on Linux, gdigrab on Windows)
 * via FFmpeg to capture the screen without relying on the Media Devices API
 */
export const useNativeRecorder = () => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    error: null,
  });

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const outputPathRef = useRef<string | null>(null);

  /**
   * Start native recording
   */
  const startRecording = useCallback(async (config: RecordingConfig): Promise<void> => {
    console.log('🎬 Starting native recording with config:', config);

    try {
      setState((prev) => ({ ...prev, error: null }));

      // Generate output path with timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
      const outputPath = `/tmp/clip_forge_recording_${timestamp}.mp4`;
      outputPathRef.current = outputPath;

      const nativeConfig: NativeRecordingConfig = {
        output_path: outputPath,
        fps: 30,
        width: config.videoWidth,
        height: config.videoHeight,
        audio: config.includeAudio,
        display_id: 1, // Default to primary display
      };

      console.log('📡 Invoking start_native_recording...');
      const result = await invoke<string>('start_native_recording', {
        config: nativeConfig,
      });

      console.log('✅ Native recording started:', result);

      // Start timer
      startTimeRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState((prev) => ({ ...prev, recordingTime: elapsed }));
      }, 1000);

      setState((prev) => ({
        ...prev,
        isRecording: true,
        recordingTime: 0,
        error: null
      }));

      console.log('✅ Recording state updated to isRecording: true');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start native recording';
      console.error('❌ Failed to start native recording:', errorMessage);
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw err;
    }
  }, []);

  /**
   * Stop native recording and return the recorded clip
   */
  const stopRecording = useCallback(async (): Promise<RecordedClip | null> => {
    console.log('⏹ Stopping native recording');

    try {
      if (!outputPathRef.current) {
        console.warn('⚠️ No output path found');
        return null;
      }

      console.log('📡 Invoking stop_native_recording...');
      const result = await invoke<string>('stop_native_recording');
      console.log('✅ Native recording stopped:', result);

      // Clear timer
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Calculate actual duration
      const actualDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      console.log(`⏱ Recording duration: ${actualDuration}s`);

      // Read the recorded file
      console.log('📁 Reading recorded file:', outputPathRef.current);

      // Use Tauri FS plugin to read the file
      const { readFile } = await import('@tauri-apps/plugin-fs');
      const fileData = await readFile(outputPathRef.current);

      // Create blob from file data
      const blob = new Blob([fileData], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      console.log(`✅ Blob created: ${blob.size} bytes, duration: ${actualDuration}s`);

      const clip: RecordedClip = {
        blob,
        url,
        duration: actualDuration,
        timestamp: Date.now(),
      };

      // Reset state
      setState({
        isRecording: false,
        isPaused: false,
        recordingTime: 0,
        error: null,
      });

      console.log('✅ Recording complete, returning clip');
      return clip;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop native recording';
      console.error('❌ Failed to stop native recording:', errorMessage);
      setState((prev) => ({ ...prev, error: errorMessage, isRecording: false }));
      throw err;
    }
  }, []);

  /**
   * Pause recording (not supported in native mode)
   */
  const pauseRecording = useCallback(() => {
    console.warn('⚠️ Pause is not supported in native recording mode');
    // FFmpeg doesn't support pausing, so we just ignore this
  }, []);

  /**
   * Resume recording (not supported in native mode)
   */
  const resumeRecording = useCallback(() => {
    console.warn('⚠️ Resume is not supported in native recording mode');
    // FFmpeg doesn't support resuming, so we just ignore this
  }, []);

  /**
   * Get current recording status from backend
   */
  const getRecordingStatus = useCallback(async (): Promise<NativeRecordingStatus> => {
    try {
      const status = await invoke<NativeRecordingStatus>('get_native_recording_status');
      return status;
    } catch (err) {
      console.error('Failed to get recording status:', err);
      throw err;
    }
  }, []);

  /**
   * List available displays
   */
  const listDisplays = useCallback(async (): Promise<string[]> => {
    try {
      const displays = await invoke<string[]>('list_displays');
      return displays;
    } catch (err) {
      console.error('Failed to list displays:', err);
      return [];
    }
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getRecordingStatus,
    listDisplays,
  };
};

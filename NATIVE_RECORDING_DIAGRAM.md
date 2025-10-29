# Native Recording Architecture Diagram

## System Overview

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    CLIPFORGE APPLICATION                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/TypeScript)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         RecordingControls Component                        │ │
│  │  • Start/Stop buttons                                      │ │
│  │  • Recording timer                                         │ │
│  │  • Config options                                          │ │
│  └─────────────────────┬─────────────────────────────────────┘ │
│                        │ calls                                 │
│                        ▼                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │            useRecorder() Hook                              │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Environment Detection Logic                          │ │ │
│  │  │                                                        │ │ │
│  │  │  if (isTauri() && !hasMediaDevicesAPI()) {           │ │ │
│  │  │    return useNativeRecorder();   ← Desktop           │ │ │
│  │  │  } else {                                             │ │ │
│  │  │    return useBrowserRecorder();  ← Web Browser       │ │ │
│  │  │  }                                                     │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └───────────┬────────────────────────┬─────────────────────┘ │
│              │                        │                        │
│     ┌────────▼─────────┐     ┌───────▼──────────┐            │
│     │ BROWSER MODE     │     │  NATIVE MODE     │            │
│     │ (Web Version)    │     │ (Desktop App)    │            │
│     └────────┬─────────┘     └───────┬──────────┘            │
│              │                       │                        │
└──────────────┼───────────────────────┼────────────────────────┘
               │                       │
               │                       │
    ┌──────────▼─────────┐  ┌──────────▼──────────┐
    │  Media Devices API │  │  Tauri IPC Bridge   │
    │  (Browser APIs)    │  │  (invoke commands)  │
    │                    │  │                     │
    │  • getDisplayMedia │  │  • start_native_   │
    │  • getUserMedia    │  │    recording()      │
    │  • MediaRecorder   │  │  • stop_native_    │
    │                    │  │    recording()      │
    └────────────────────┘  └──────────┬──────────┘
                                       │
                                       │
┌──────────────────────────────────────┼────────────────────────┐
│              BACKEND (Rust/Tauri)    │                        │
├──────────────────────────────────────┼────────────────────────┤
│                                      │                        │
│  ┌───────────────────────────────────▼──────────────────────┐ │
│  │          native_recorder.rs                              │ │
│  │                                                           │ │
│  │  #[tauri::command]                                       │ │
│  │  async fn start_native_recording() {                    │ │
│  │    • Generate output path                                │ │
│  │    • Build FFmpeg command                                │ │
│  │    • Spawn FFmpeg process                                │ │
│  │    • Store process handle                                │ │
│  │  }                                                        │ │
│  │                                                           │ │
│  │  #[tauri::command]                                       │ │
│  │  async fn stop_native_recording() {                     │ │
│  │    • Send SIGINT to FFmpeg                               │ │
│  │    • Wait for graceful shutdown                          │ │
│  │    • Return file path                                    │ │
│  │  }                                                        │ │
│  └─────────────────────┬───────────────────────────────────┘ │
│                        │                                      │
│              ┌─────────▼────────┐                            │
│              │ Platform Router  │                            │
│              └─────────┬────────┘                            │
│                        │                                      │
│      ┌─────────────────┼─────────────────┐                   │
│      │                 │                 │                   │
│  ┌───▼──────┐    ┌─────▼──────┐    ┌────▼─────┐            │
│  │  macOS   │    │   Linux    │    │ Windows  │            │
│  │  impl    │    │   impl     │    │  impl    │            │
│  └───┬──────┘    └─────┬──────┘    └────┬─────┘            │
└──────┼─────────────────┼──────────────────┼─────────────────┘
       │                 │                  │
       │ spawns          │ spawns           │ spawns
       ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    FFMPEG PROCESS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────┐  │
│  │   macOS      │   │    Linux      │   │   Windows    │  │
│  │              │   │               │   │              │  │
│  │ AVFoundation │   │   x11grab     │   │   gdigrab    │  │
│  │              │   │               │   │              │  │
│  │ -f avfound.. │   │ -f x11grab    │   │ -f gdigrab   │  │
│  │ -i "1:0"     │   │ -i :0.0       │   │ -i desktop   │  │
│  └──────┬───────┘   └───────┬───────┘   └──────┬───────┘  │
│         │                   │                   │          │
│         └───────────────────┼───────────────────┘          │
│                             ▼                              │
│                    ┌─────────────────┐                     │
│                    │  Video Encoder  │                     │
│                    │  • H.264/libx264│                     │
│                    │  • CRF 23       │                     │
│                    │  • ultrafast    │                     │
│                    └────────┬────────┘                     │
│                             ▼                              │
│                    ┌─────────────────┐                     │
│                    │  Audio Encoder  │                     │
│                    │  • AAC codec    │                     │
│                    │  • 128k bitrate │                     │
│                    └────────┬────────┘                     │
│                             ▼                              │
│                    ┌─────────────────┐                     │
│                    │  File Writer    │                     │
│                    │  • MP4 format   │                     │
│                    │  • /tmp/rec.mp4 │                     │
│                    └────────┬────────┘                     │
└─────────────────────────────┼────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  File System     │
                    │  /tmp/recording_ │
                    │  TIMESTAMP.mp4   │
                    └──────────────────┘
```

## Request Flow Diagram

### Starting a Recording

```
User Action: Click "Start Recording"
    │
    ▼
RecordingControls.handleStartRecording()
    │
    ▼
recorder.startRecording(config)
    │
    ├──► IF Browser: navigator.mediaDevices.getDisplayMedia()
    │                    │
    │                    ▼
    │                MediaRecorder.start()
    │                    │
    │                    ▼
    │                Recording in memory (WebM)
    │
    └──► IF Desktop: invoke('start_native_recording', { config })
                         │
                         ▼
                     Tauri IPC
                         │
                         ▼
                     Rust Handler
                         │
                         ▼
                     start_platform_recording()
                         │
                         ▼
                     Detect OS → Build FFmpeg command
                         │
                         ├─► macOS: ffmpeg -f avfoundation ...
                         ├─► Linux: ffmpeg -f x11grab ...
                         └─► Windows: ffmpeg -f gdigrab ...
                         │
                         ▼
                     Command::new("ffmpeg").spawn()
                         │
                         ▼
                     Store Child process handle
                         │
                         ▼
                     Return "Recording started" ✅
                         │
                         ▼
                     Frontend shows recording UI
```

### Stopping a Recording

```
User Action: Click "Stop Recording"
    │
    ▼
RecordingControls.handleStopRecording()
    │
    ▼
recorder.stopRecording()
    │
    ├──► IF Browser: MediaRecorder.stop()
    │                    │
    │                    ▼
    │                onstop event fired
    │                    │
    │                    ▼
    │                Create Blob from chunks
    │                    │
    │                    ▼
    │                Return RecordedClip { blob, url, ... }
    │
    └──► IF Desktop: invoke('stop_native_recording')
                         │
                         ▼
                     Tauri IPC
                         │
                         ▼
                     Rust Handler
                         │
                         ▼
                     Send SIGINT to FFmpeg process
                         │
                         ▼
                     FFmpeg: Flush buffers, finalize MP4
                         │
                         ▼
                     Wait for process exit (500ms timeout)
                         │
                         ▼
                     Kill process if still running
                         │
                         ▼
                     Return file path
                         │
                         ▼
                     Frontend: readBinaryFile(path)
                         │
                         ▼
                     Create Blob from file data
                         │
                         ▼
                     Return RecordedClip { blob, url, ... }
                         │
                         ▼
                     Auto-download MP4 file
                         │
                         ▼
                     Save to timeline ✅
```

## Data Flow

### Browser Mode (Web)
```
Screen Capture
    ↓
MediaStream (live)
    ↓
MediaRecorder (encoding)
    ↓
Blob chunks (WebM)
    ↓
Combined Blob
    ↓
Object URL
    ↓
[Optional] FFmpeg.wasm (WebM → MP4)
    ↓
Download
```

### Native Mode (Desktop)
```
Screen Capture (OS API)
    ↓
FFmpeg input device
    ↓
H.264 Encoder
    ↓
MP4 File on disk
    ↓
Read file as binary
    ↓
Blob (MP4)
    ↓
Object URL
    ↓
Download
```

## State Management

```
┌─────────────────────────────────────────┐
│      Frontend State (React)             │
├─────────────────────────────────────────┤
│ • isRecording: boolean                  │
│ • isPaused: boolean                     │
│ • recordingTime: number                 │
│ • error: string | null                  │
└─────────────────┬───────────────────────┘
                  │
                  │ synchronized via
                  │
┌─────────────────▼───────────────────────┐
│      Backend State (Rust)               │
├─────────────────────────────────────────┤
│ • is_recording: bool                    │
│ • output_path: Option<String>          │
│ • error: Option<String>                │
│ • process: Option<Child>               │
└─────────────────────────────────────────┘
```

## Error Handling Flow

```
User tries to record
    │
    ▼
Check FFmpeg installed
    │
    ├─► ❌ Not found → Error: "FFmpeg not installed"
    │                  → Show installation instructions
    │
    ▼
Check permissions (macOS)
    │
    ├─► ❌ Denied → Error: "Permission denied"
    │               → Guide to System Preferences
    │
    ▼
Try to spawn FFmpeg
    │
    ├─► ❌ Failed → Error: "Failed to spawn process"
    │               → Log error details
    │
    ▼
Recording starts ✅
    │
    ▼
Monitor process
    │
    ├─► ❌ Crashed → Error: "Recording process crashed"
    │                → Cleanup resources
    │                → Reset state
    │
    ▼
User stops recording
    │
    ▼
Send graceful shutdown signal
    │
    ▼
Wait for process exit
    │
    ├─► ❌ Timeout → Force kill process
    │                → Check if file exists
    │                → Try to salvage partial recording
    │
    ▼
Read recorded file
    │
    ├─► ❌ File not found → Error: "Recording file missing"
    │
    ├─► ❌ File empty → Error: "Recording failed to save"
    │
    ▼
Return recording ✅
```

## Component Interaction

```
┌──────────────────┐
│ RecordingControls│
│   Component      │
└────────┬─────────┘
         │ uses
         ▼
┌──────────────────┐      ┌──────────────────┐
│  useRecorder()   │─────▶│ recordingLogic   │
│     Hook         │      │    (Kea)         │
└────────┬─────────┘      └──────────────────┘
         │
         ├─── IF Browser ───▶ MediaRecorder API
         │                        │
         │                        ▼
         │                   WebM Blob
         │
         └─── IF Desktop ───▶ useNativeRecorder()
                                  │
                                  ▼
                              Tauri IPC
                                  │
                                  ▼
                           native_recorder.rs
                                  │
                                  ▼
                              FFmpeg Process
                                  │
                                  ▼
                              MP4 File
```

## Timeline

### Recording Session Timeline
```
t=0s    User clicks "Start"
        │
        ├─► Desktop: FFmpeg spawns
        └─► Browser: getDisplayMedia() + MediaRecorder.start()

t=0.5s  Recording UI appears
        Timer starts

t=1s... Recording in progress
        • Desktop: Writing to disk continuously
        • Browser: Collecting chunks in memory

t=30s   User clicks "Stop"
        │
        ├─► Desktop: SIGINT → FFmpeg finalizes MP4
        └─► Browser: MediaRecorder.stop() → Blob created

t=30.5s File ready
        • Desktop: Read MP4 from disk
        • Browser: Blob already in memory

t=31s   Auto-download triggered
        Preview shown
        Timeline updated
```

## Key Decision Points

### 1. Environment Detection
```
if ('__TAURI__' in window && !navigator?.mediaDevices?.getDisplayMedia)
    → Use Native Recording
else
    → Use Browser Recording
```

### 2. Platform Selection
```
#[cfg(target_os = "macos")]    → AVFoundation
#[cfg(target_os = "linux")]    → x11grab
#[cfg(target_os = "windows")]  → gdigrab
```

### 3. Process Termination
```
Send SIGINT → Wait 500ms → Force kill if needed
```

This ensures clean MP4 file (moov atom written) while preventing hanging processes.

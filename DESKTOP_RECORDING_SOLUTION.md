# Desktop Recording Solution - Complete Implementation

## 🎯 Problem Statement

**Error in Desktop App:**
```
Media devices API not available. If you are using the desktop app,
please try the browser version instead: npm run dev, then open
http://localhost:1420 in Chrome or Edge.
```

**Root Cause:** The Media Devices API (`navigator.mediaDevices.getDisplayMedia()`) is **not available in Tauri's WebView** environment, making screen recording impossible in the desktop app.

## ✅ Solution Implemented

A **complete native screen recording system** using FFmpeg with platform-specific capture APIs:
- **macOS**: AVFoundation
- **Linux**: x11grab
- **Windows**: gdigrab

This eliminates the dependency on browser APIs entirely for the desktop version.

## 📦 What's Already Implemented

### 1. Rust Backend ✅

**File**: [src-tauri/src/native_recorder.rs](src-tauri/src/native_recorder.rs)

- ✅ Platform-specific FFmpeg commands
- ✅ Process management (spawn, monitor, stop)
- ✅ Graceful shutdown with SIGINT
- ✅ Error handling with helpful messages
- ✅ Tauri command handlers

**Registered in**: [src-tauri/src/lib.rs](src-tauri/src/lib.rs)
```rust
.manage(native_recorder::NativeRecorderState::new())
.invoke_handler(tauri::generate_handler![
  native_recorder::start_native_recording,
  native_recorder::stop_native_recording,
  native_recorder::get_native_recording_status,
  native_recorder::list_displays
])
```

### 2. TypeScript Bridge ✅

**File**: [src/hooks/useNativeRecorder.ts](src/hooks/useNativeRecorder.ts)

- ✅ React hook interface
- ✅ Tauri IPC integration
- ✅ Same API as browser recorder
- ✅ File reading and blob creation

### 3. Auto-Detection Logic ✅

**File**: [src/hooks/useRecorder.ts](src/hooks/useRecorder.ts)

```typescript
const shouldUseNativeRecording = (): boolean => {
  const inTauri = '__TAURI__' in window;
  const hasMediaAPI = !!navigator?.mediaDevices?.getDisplayMedia;
  return inTauri && !hasMediaAPI; // ← Detects desktop app without Media API
};

export const useRecorder = () => {
  const nativeRecorder = useNativeRecorder();
  const useNative = shouldUseNativeRecording();

  if (useNative) {
    console.log('✅ Using NATIVE recording mode (FFmpeg-based)');
    return nativeRecorder; // ← Routes to FFmpeg
  }

  console.log('✅ Using BROWSER recording mode (Media Devices API)');
  // ... browser implementation
};
```

### 4. Dependencies Added ✅

**File**: [src-tauri/Cargo.toml](src-tauri/Cargo.toml)

```toml
tokio = { version = "1", features = ["full"] }
anyhow = "1.0"

[target.'cfg(unix)'.dependencies]
libc = "0.2"
```

## 🚀 Build and Test

### Step 1: Install FFmpeg (Required!)

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH

### Step 2: Verify FFmpeg Installation

```bash
# Run the test script
chmod +x ./test_ffmpeg.sh
./test_ffmpeg.sh

# Or manually check:
ffmpeg -version
```

### Step 3: Build the Desktop App

```bash
# Clean build (recommended)
cd src-tauri
cargo clean
cargo build

# Or build and run
cd ..
npm run tauri dev
```

### Step 4: Grant Permissions (macOS only)

On first run:
1. macOS will prompt for **Screen Recording** permission
2. Go to: **System Preferences → Security & Privacy → Privacy → Screen Recording**
3. Enable permission for your app
4. **Restart the app**

### Step 5: Test Recording

1. Click **"Start Recording"** in the desktop app
2. Check console for: `"✅ Using NATIVE recording mode (FFmpeg-based)"`
3. Recording should start (timer appears)
4. Click **"Stop Recording"**
5. MP4 file should download automatically
6. Verify the file plays correctly

## 🔍 How It Works

### Flow Diagram

```
Desktop App Starts
       ↓
useRecorder() hook initializes
       ↓
shouldUseNativeRecording() checks:
  • Is '__TAURI__' in window? → YES (desktop app)
  • Is navigator.mediaDevices.getDisplayMedia available? → NO (WebView)
       ↓
Returns: true → Use Native Recording
       ↓
useNativeRecorder() is returned
       ↓
User clicks "Start Recording"
       ↓
invoke('start_native_recording', { config })
       ↓
Tauri IPC → Rust Backend
       ↓
native_recorder.rs::start_native_recording()
       ↓
Build FFmpeg command for platform:
  • macOS: ffmpeg -f avfoundation -i "1:0" ...
  • Linux: ffmpeg -f x11grab -i :0.0 ...
  • Windows: ffmpeg -f gdigrab -i desktop ...
       ↓
Command::new("ffmpeg").spawn()
       ↓
FFmpeg process captures screen → /tmp/recording_TIMESTAMP.mp4
       ↓
User clicks "Stop Recording"
       ↓
invoke('stop_native_recording')
       ↓
Rust: Send SIGINT to FFmpeg → graceful shutdown
       ↓
Frontend: readBinaryFile(path) → create Blob → download
       ↓
MP4 file downloaded! ✅
```

### Platform-Specific Commands

**macOS (AVFoundation):**
```bash
ffmpeg -f avfoundation \
       -capture_cursor 1 \
       -capture_mouse_clicks 1 \
       -framerate 30 \
       -i "1:0" \
       -c:v libx264 -preset ultrafast -crf 23 \
       -c:a aac -b:a 128k \
       output.mp4
```

**Linux (x11grab):**
```bash
ffmpeg -f x11grab \
       -framerate 30 \
       -video_size 1920x1080 \
       -i :0.0 \
       -c:v libx264 -preset ultrafast -crf 23 \
       output.mp4
```

**Windows (gdigrab):**
```bash
ffmpeg -f gdigrab \
       -framerate 30 \
       -draw_mouse 1 \
       -i desktop \
       -c:v libx264 -preset ultrafast -crf 23 \
       output.mp4
```

## 🧪 Testing Checklist

### Desktop App Tests

- [ ] **FFmpeg installed**: `ffmpeg -version` works
- [ ] **Test script passes**: `./test_ffmpeg.sh` all green
- [ ] **App builds**: `npm run tauri dev` succeeds
- [ ] **Permission granted**: Screen recording allowed (macOS)
- [ ] **Start recording**: Button works, no errors
- [ ] **Console shows**: "Using NATIVE recording mode"
- [ ] **Timer works**: Recording time increments
- [ ] **Stop recording**: Button works, no errors
- [ ] **File downloads**: MP4 file appears
- [ ] **File plays**: Video plays in media player
- [ ] **Audio works**: If enabled, audio is recorded

### Browser Tests (Should Still Work)

- [ ] **Browser starts**: `npm run dev` succeeds
- [ ] **Start recording**: Browser screen picker appears
- [ ] **Console shows**: "Using BROWSER recording mode"
- [ ] **Recording works**: WebM file downloads
- [ ] **File plays**: Video plays correctly

## 🐛 Troubleshooting

### Error: "FFmpeg not found"

**Symptom**: Desktop app shows error about FFmpeg

**Solution**:
```bash
# macOS
brew install ffmpeg

# Verify
ffmpeg -version

# Rebuild app
npm run tauri dev
```

### Error: "Screen recording permission denied" (macOS)

**Symptom**: Recording starts but file is empty/black

**Solution**:
1. **System Preferences** → **Security & Privacy** → **Privacy** → **Screen Recording**
2. Find your app in the list
3. Check the box to enable
4. **Restart the app** (important!)

### Error: "Failed to open display" (Linux)

**Symptom**: Recording fails to start

**Solution**:
```bash
# Set DISPLAY environment variable
export DISPLAY=:0

# Then run app
npm run tauri dev
```

### Error: "Command invocation failed"

**Symptom**: Tauri IPC error in console

**Possible Causes**:
1. Rust backend not built: Run `cd src-tauri && cargo build`
2. Commands not registered: Check [lib.rs:22-25](src-tauri/src/lib.rs#L22-L25)
3. State not initialized: Check [lib.rs:15](src-tauri/src/lib.rs#L15)

**Solution**: Rebuild the app:
```bash
cd src-tauri
cargo clean
cargo build
cd ..
npm run tauri dev
```

### Recording file is 0 bytes

**Symptom**: File downloads but has no content

**Causes**:
1. FFmpeg crashed during recording
2. Permissions not granted (macOS)
3. Wrong input device selected

**Solution**:
1. Check console for FFmpeg errors
2. Grant screen recording permission
3. Test FFmpeg manually:
   ```bash
   # macOS
   ffmpeg -f avfoundation -list_devices true -i ""
   ```

## 📊 Comparison: Before vs After

### Before (Desktop App)

```
Click "Start Recording"
  ↓
useRecorder tries: navigator.mediaDevices.getDisplayMedia()
  ↓
❌ Error: "Media devices API not available"
  ↓
Shows error message in UI
  ↓
Recording DOES NOT WORK
```

### After (Desktop App)

```
Click "Start Recording"
  ↓
useRecorder detects: Tauri + No Media API
  ↓
Routes to: useNativeRecorder()
  ↓
invoke('start_native_recording')
  ↓
Rust spawns FFmpeg process
  ↓
✅ Screen recording WORKS
  ↓
Download MP4 file
```

## 📁 Files Summary

### Created Files

1. **[src-tauri/src/native_recorder.rs](src-tauri/src/native_recorder.rs)** - Native recording backend (291 lines)
2. **[src/hooks/useNativeRecorder.ts](src/hooks/useNativeRecorder.ts)** - TypeScript bridge (164 lines)
3. **[test_ffmpeg.sh](test_ffmpeg.sh)** - FFmpeg verification script

### Modified Files

1. **[src-tauri/Cargo.toml](src-tauri/Cargo.toml)** - Added dependencies
2. **[src-tauri/src/lib.rs](src-tauri/src/lib.rs)** - Registered commands
3. **[src/hooks/useRecorder.ts](src/hooks/useRecorder.ts)** - Added auto-detection
4. **[vite.config.ts](vite.config.ts)** - Removed COOP/COEP headers (for browser)
5. **[src/components/Recording/RecordingControls.tsx](src/components/Recording/RecordingControls.tsx)** - Updated download logic

### Documentation Files

1. **[NATIVE_RECORDING_SOLUTION.md](NATIVE_RECORDING_SOLUTION.md)** - Complete architecture
2. **[NATIVE_RECORDING_SETUP.md](NATIVE_RECORDING_SETUP.md)** - Setup guide
3. **[NATIVE_RECORDING_DIAGRAM.md](NATIVE_RECORDING_DIAGRAM.md)** - Visual diagrams
4. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Quick reference
5. **[BROWSER_RECORDING_FIX.md](BROWSER_RECORDING_FIX.md)** - Browser COOP/COEP fix
6. **[COOP_COEP_ISSUE_SOLUTION.md](COOP_COEP_ISSUE_SOLUTION.md)** - Technical analysis
7. **[DESKTOP_RECORDING_SOLUTION.md](DESKTOP_RECORDING_SOLUTION.md)** - This file

## ✅ Verification

### Console Output (Expected)

**When app starts:**
```
🔍 Recording mode detection:
  - Running in Tauri: true
  - Media Devices API available: false
  - Using native recording: true
✅ Using NATIVE recording mode (FFmpeg-based)
```

**When recording starts:**
```
🎬 Starting native recording with config: {...}
📡 Invoking start_native_recording...
✅ Native recording started: /tmp/clip_forge_recording_2024-01-15T10-30-45.mp4
✅ Recording state updated to isRecording: true
```

**When recording stops:**
```
⏹ Stopping native recording
📡 Invoking stop_native_recording...
✅ Native recording stopped: /tmp/clip_forge_recording_2024-01-15T10-30-45.mp4
📁 Reading recorded file: /tmp/clip_forge_recording_2024-01-15T10-30-45.mp4
✅ Blob created: 15234560 bytes, duration: 30s
⬇️ MP4 download triggered
✅ Recording complete, returning clip
```

## 🎉 Success Criteria

- [x] ✅ Native recorder implemented (Rust)
- [x] ✅ TypeScript bridge created
- [x] ✅ Auto-detection logic added
- [x] ✅ Commands registered in Tauri
- [x] ✅ Dependencies added to Cargo.toml
- [x] ✅ Cross-platform support (macOS, Linux, Windows)
- [x] ✅ Error handling implemented
- [x] ✅ Documentation complete
- [ ] ⏳ **Built and tested** ← NEXT STEP

## 🚀 Next Steps

### 1. Build the App
```bash
npm run tauri dev
```

### 2. Test Recording
- Click Start Recording
- Verify console shows "Using NATIVE recording mode"
- Click Stop Recording
- Verify MP4 file downloads

### 3. Report Results
Check if you see:
- ✅ Native recording mode detected
- ✅ FFmpeg process spawned
- ✅ Recording completes successfully
- ✅ MP4 file downloads and plays

OR

- ❌ Error messages (report them for debugging)

## 📚 Additional Resources

- **[README_NATIVE_RECORDING.md](README_NATIVE_RECORDING.md)** - Overview
- **[QUICK_START_AFTER_FIX.md](QUICK_START_AFTER_FIX.md)** - Quick start guide
- **FFmpeg Documentation**: https://ffmpeg.org/documentation.html
- **Tauri IPC Guide**: https://tauri.app/v1/guides/features/command

## 🎯 Summary

**Problem**: Desktop app shows "Media devices API not available" error

**Root Cause**: Tauri WebView doesn't provide Media Devices API

**Solution**: Native FFmpeg-based recording with platform-specific capture APIs

**Status**: ✅ **IMPLEMENTATION COMPLETE** - Ready to build and test

**Next**: Install FFmpeg → Build app → Test recording → Enjoy native MP4 recordings! 🎊

---

**The alternative to Media Devices API is fully implemented and ready to use!**

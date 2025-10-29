# Native Screen Recording for ClipForge Desktop

## 🎯 Overview

This implementation provides **native screen recording capability** for the ClipForge desktop application, solving the critical issue where the browser's Media Devices API is not available in Tauri's WebView environment.

## 🚨 Problem

The desktop console logs showed:
```
mediaDevices exists: false
getDisplayMedia exists: false
❌ Screen capture failed: Media devices API not available
```

**Root Cause**: Tauri's embedded WebView does not expose `navigator.mediaDevices.getDisplayMedia()` for security reasons, making browser-based screen recording impossible in the desktop app.

## ✅ Solution

A **dual-mode recording system** that automatically detects the environment and uses:
- **Desktop App** → Native FFmpeg-based recording with platform-specific capture drivers
- **Web Browser** → Standard Media Devices API with MediaRecorder

### Key Features

- ✅ **Zero configuration** - Automatically detects environment
- ✅ **Cross-platform** - macOS, Linux, Windows support
- ✅ **Same API** - No changes needed to existing components
- ✅ **Better output** - Direct MP4 encoding (no WebM conversion needed)
- ✅ **System integration** - Native screen capture with audio support
- ✅ **Robust error handling** - Clear error messages with solutions

## 📁 Files Added

### Core Implementation
- [`src-tauri/src/native_recorder.rs`](src-tauri/src/native_recorder.rs) - Rust backend (291 lines)
- [`src/hooks/useNativeRecorder.ts`](src/hooks/useNativeRecorder.ts) - TypeScript bridge (164 lines)

### Documentation
- [`NATIVE_RECORDING_SOLUTION.md`](NATIVE_RECORDING_SOLUTION.md) - Technical architecture
- [`NATIVE_RECORDING_SETUP.md`](NATIVE_RECORDING_SETUP.md) - Setup & troubleshooting
- [`NATIVE_RECORDING_DIAGRAM.md`](NATIVE_RECORDING_DIAGRAM.md) - Visual diagrams
- [`IMPLEMENTATION_SUMMARY.md`](IMPLEMENTATION_SUMMARY.md) - Quick reference
- [`test_ffmpeg.sh`](test_ffmpeg.sh) - FFmpeg test script

## 🚀 Quick Start

### 1. Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH

### 2. Verify Installation

```bash
./test_ffmpeg.sh
```

This script will:
- ✓ Check if FFmpeg is installed
- ✓ Verify required encoders
- ✓ Test platform-specific capture devices
- ✓ Perform a 5-second test recording

### 3. Build and Run

```bash
# Development mode
npm run tauri dev

# Production build
npm run tauri build
```

### 4. Grant Permissions (macOS only)

On first run, macOS will prompt for screen recording permission:
1. System Preferences → Security & Privacy → Screen Recording
2. Enable permission for ClipForge
3. Restart the app

## 🏗️ Architecture

```
User Interface (React)
    ↓
useRecorder() Hook [Auto-detects environment]
    ↓
    ├─→ Desktop App → useNativeRecorder() → Tauri IPC → Rust Backend
    │                                                        ↓
    │                                                   FFmpeg Process
    │                                                        ↓
    │                                                   Platform API:
    │                                                   • macOS: AVFoundation
    │                                                   • Linux: x11grab
    │                                                   • Windows: gdigrab
    │                                                        ↓
    │                                                   MP4 File ✓
    │
    └─→ Web Browser → MediaRecorder → WebM Blob ✓
```

## 💻 Usage

**No code changes required!** The recording interface remains the same:

```typescript
const recorder = useRecorder(); // Auto-detects mode

// Start recording
await recorder.startRecording({
  includeScreen: true,
  includeWebcam: false,
  includeAudio: true,
});

// Stop and get recording
const clip = await recorder.stopRecording();
// clip.blob contains video (MP4 in desktop, WebM in browser)
```

## 🔍 How It Works

### 1. Environment Detection
```typescript
const shouldUseNativeRecording = () => {
  const inTauri = '__TAURI__' in window;
  const hasMediaAPI = !!navigator?.mediaDevices?.getDisplayMedia;
  return inTauri && !hasMediaAPI;
};
```

### 2. Platform-Specific Recording

**macOS (AVFoundation):**
```bash
ffmpeg -f avfoundation -capture_cursor 1 -i "1:0" \
       -c:v libx264 -preset ultrafast -crf 23 output.mp4
```

**Linux (x11grab):**
```bash
ffmpeg -f x11grab -framerate 30 -i :0.0 \
       -c:v libx264 -preset ultrafast -crf 23 output.mp4
```

**Windows (gdigrab):**
```bash
ffmpeg -f gdigrab -draw_mouse 1 -i desktop \
       -c:v libx264 -preset ultrafast -crf 23 output.mp4
```

### 3. Process Management

```rust
// Start: Spawn FFmpeg as child process
let child = Command::new("ffmpeg")
    .args(platform_specific_args)
    .spawn()?;

// Stop: Send SIGINT for graceful shutdown
unsafe { libc::kill(child.id() as i32, libc::SIGINT); }
```

## 🧪 Testing

### Console Logs

Look for these logs to verify which mode is being used:

```
🔍 Recording mode detection:
  - Running in Tauri: true
  - Media Devices API available: false
  - Using native recording: true
✅ Using NATIVE recording mode (FFmpeg-based)
```

### Test Checklist

- [ ] Run `./test_ffmpeg.sh` - all tests pass
- [ ] Desktop app: Start recording - see "NATIVE recording mode"
- [ ] Desktop app: Stop recording - MP4 file downloads
- [ ] Browser: Start recording - see "BROWSER recording mode"
- [ ] Browser: Stop recording - WebM file downloads
- [ ] Video playback works in both modes

## 📊 Comparison

| Feature | Browser Mode | Native Mode |
|---------|-------------|-------------|
| **Platform** | Web browser | Desktop app |
| **API** | Media Devices | FFmpeg |
| **Format** | WebM | MP4 |
| **Encoding** | VP8/VP9 | H.264 |
| **Storage** | Memory | Disk |
| **Quality** | Good | Excellent |
| **Startup** | ~200ms | ~500ms |
| **Dependencies** | None | FFmpeg |

## 🛠️ Troubleshooting

### Error: "FFmpeg not found"
**Solution:** Install FFmpeg (see Quick Start above)

### Error: "Screen recording permission denied" (macOS)
**Solution:** Grant permission in System Preferences → Security & Privacy → Screen Recording

### Error: "Failed to open display" (Linux)
**Solution:** Set DISPLAY variable: `export DISPLAY=:0`

### Recording file is empty or corrupted
**Cause:** FFmpeg process terminated incorrectly
**Solution:** Always use the Stop button to end recording properly

For more troubleshooting, see [NATIVE_RECORDING_SETUP.md](NATIVE_RECORDING_SETUP.md)

## 📚 Documentation

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Quick reference and checklist
- **[NATIVE_RECORDING_SOLUTION.md](NATIVE_RECORDING_SOLUTION.md)** - Detailed technical documentation
- **[NATIVE_RECORDING_SETUP.md](NATIVE_RECORDING_SETUP.md)** - Setup guide and configuration
- **[NATIVE_RECORDING_DIAGRAM.md](NATIVE_RECORDING_DIAGRAM.md)** - Architecture diagrams

## 🎯 System Requirements

### Required
- **FFmpeg** installed and in PATH
- **Rust/Cargo** (for building)
- **Node.js** and npm

### Platform-Specific
- **macOS 10.14+**: Screen recording permission
- **Linux**: X11 display server (not Wayland)
- **Windows**: FFmpeg in PATH

## 🔧 Development

### Build Backend
```bash
cd src-tauri
cargo build
```

### Run Tests
```bash
# Test FFmpeg setup
./test_ffmpeg.sh

# Run app in dev mode
npm run tauri dev
```

### Debug Mode

Enable FFmpeg logging in [native_recorder.rs:155](src-tauri/src/native_recorder.rs#L155):
```rust
// Change from:
cmd.stderr(Stdio::null());

// To:
cmd.stderr(Stdio::piped());
```

## 🚀 Future Enhancements

- [ ] Bundle FFmpeg with app distribution
- [ ] Native ScreenCaptureKit API (macOS 12.3+)
- [ ] Pause/Resume support (requires video stitching)
- [ ] Region selection (capture specific area)
- [ ] Multi-monitor selection UI
- [ ] Hardware acceleration (GPU encoding)
- [ ] Real-time preview during recording

## 📝 Notes

### Why FFmpeg?
- **Cross-platform** - Works on all major OSes
- **Mature** - Battle-tested, industry standard
- **Flexible** - Supports many codecs and formats
- **Performant** - Hardware acceleration support
- **Open source** - Free and well-documented

### Why Not ScreenCaptureKit?
- **macOS only** - Would need separate implementations
- **Requires macOS 12.3+** - Limits compatibility
- **More complex** - FFmpeg is simpler and proven
- **Future option** - Can be added as an enhancement

## 🤝 Contributing

When modifying the recording system:

1. Test both browser and desktop modes
2. Verify on all supported platforms
3. Update documentation
4. Add console logging for debugging
5. Handle errors gracefully

## 📄 License

Same as ClipForge main project.

## 🎉 Success!

The desktop app can now record screen without relying on browser APIs! 🎊

---

**Quick Links:**
- 📖 [Technical Details](NATIVE_RECORDING_SOLUTION.md)
- ⚙️ [Setup Guide](NATIVE_RECORDING_SETUP.md)
- 📊 [Architecture Diagrams](NATIVE_RECORDING_DIAGRAM.md)
- 📋 [Implementation Checklist](IMPLEMENTATION_SUMMARY.md)
- 🧪 [Test Script](test_ffmpeg.sh)

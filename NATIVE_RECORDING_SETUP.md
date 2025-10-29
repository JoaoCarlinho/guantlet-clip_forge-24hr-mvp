# Native Recording Setup Guide

## Quick Start

### 1. Install FFmpeg (Required)

The native recording system requires FFmpeg to be installed on your system.

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Linux (Fedora/RHEL)
```bash
sudo dnf install ffmpeg
```

#### Windows
1. Download FFmpeg from [ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. Extract the archive
3. Add the `bin` folder to your system PATH

### 2. Install Rust Dependencies

The project will automatically download Rust dependencies when you build:

```bash
cd src-tauri
cargo build
```

### 3. Build and Run

#### Development Mode
```bash
npm run tauri dev
```

#### Production Build
```bash
npm run tauri build
```

## Verify Installation

### Check FFmpeg
```bash
ffmpeg -version
```

Expected output should show FFmpeg version information.

### Test Recording (Manual)

#### macOS
```bash
# List available capture devices
ffmpeg -f avfoundation -list_devices true -i ""

# Test recording (5 seconds)
ffmpeg -f avfoundation -framerate 30 -i "1:0" -t 5 test.mp4
```

#### Linux
```bash
# Test recording (5 seconds)
ffmpeg -f x11grab -framerate 30 -video_size 1920x1080 -i :0.0 -t 5 test.mp4
```

#### Windows
```bash
# Test recording (5 seconds)
ffmpeg -f gdigrab -framerate 30 -i desktop -t 5 test.mp4
```

## Platform-Specific Setup

### macOS Permissions

On macOS 10.14+, you need to grant screen recording permission:

1. Run the app once (it will fail with permission error)
2. Go to **System Preferences → Security & Privacy → Privacy → Screen Recording**
3. Enable permission for your app
4. Restart the app

### Linux X11 Requirements

Make sure X11 display is accessible:

```bash
echo $DISPLAY
# Should output something like :0 or :0.0

# If not set:
export DISPLAY=:0
```

For Wayland users, you may need to run in XWayland compatibility mode.

### Windows Audio

For audio capture on Windows, ensure your microphone device is named "Microphone" or update the device name in [native_recorder.rs:221](src-tauri/src/native_recorder.rs#L221):

```rust
cmd.arg("-i").arg("audio=\"Your Microphone Name Here\"");
```

To list available audio devices:
```bash
ffmpeg -list_devices true -f dshow -i dummy
```

## Troubleshooting

### Issue: "FFmpeg not found"

**Cause**: FFmpeg is not installed or not in PATH

**Solution**:
1. Install FFmpeg (see above)
2. Verify installation: `ffmpeg -version`
3. Restart terminal/app after installation

### Issue: "Screen recording permission denied" (macOS)

**Cause**: macOS screen recording permission not granted

**Solution**:
1. System Preferences → Security & Privacy → Screen Recording
2. Check the box next to your app
3. Restart the app

### Issue: "Failed to open display" (Linux)

**Cause**: DISPLAY environment variable not set

**Solution**:
```bash
export DISPLAY=:0
# Then run the app
```

### Issue: "No audio captured" (Any platform)

**Causes**:
1. Audio device not available
2. Incorrect device name
3. Permissions not granted

**Solution**:
1. Check audio device availability:
   - macOS: `ffmpeg -f avfoundation -list_devices true -i ""`
   - Linux: `pactl list sources`
   - Windows: `ffmpeg -list_devices true -f dshow -i dummy`
2. Grant microphone permissions in system settings
3. Update device name in code if needed

### Issue: "Recording file is 0 bytes or corrupted"

**Cause**: FFmpeg process terminated incorrectly

**Solution**:
1. Don't force-quit the app during recording
2. Use the Stop button to properly end recording
3. Check FFmpeg logs in console for errors

## Advanced Configuration

### Change Video Quality

Edit [native_recorder.rs](src-tauri/src/native_recorder.rs):

```rust
// Lower CRF = higher quality (18-28 recommended)
cmd.arg("-crf").arg("18"); // Higher quality (default: 23)

// Bitrate control
cmd.arg("-b:v").arg("5M"); // 5 Mbps video bitrate
```

### Change Encoder Speed

```rust
// Faster encoding (lower quality)
cmd.arg("-preset").arg("superfast");

// Slower encoding (higher quality)
cmd.arg("-preset").arg("slow");
```

### Hardware Acceleration

#### macOS (VideoToolbox)
```rust
cmd.arg("-c:v").arg("h264_videotoolbox");
```

#### NVIDIA GPU (NVENC)
```rust
cmd.arg("-c:v").arg("h264_nvenc");
```

#### Intel Quick Sync
```rust
cmd.arg("-c:v").arg("h264_qsv");
```

## Development Tips

### Enable FFmpeg Logging

In [native_recorder.rs](src-tauri/src/native_recorder.rs), change:

```rust
// From:
cmd.stdout(Stdio::null());
cmd.stderr(Stdio::null());

// To:
cmd.stdout(Stdio::piped());
cmd.stderr(Stdio::piped());
```

Then read and log the output for debugging.

### Test Without App

You can test FFmpeg commands directly in terminal before integrating:

```bash
# macOS example
ffmpeg -f avfoundation -framerate 30 -capture_cursor 1 \
       -i "1:0" -c:v libx264 -preset ultrafast -crf 23 \
       -c:a aac -b:a 128k test_output.mp4
```

## Performance Optimization

### Reduce CPU Usage

1. Lower frame rate: `-framerate 24` (instead of 30)
2. Use faster preset: `-preset veryfast` (instead of ultrafast)
3. Enable hardware acceleration (see above)
4. Reduce resolution: `-s 1280x720` (instead of 1920x1080)

### Reduce File Size

1. Increase compression: `-crf 28` (instead of 23)
2. Lower bitrate: `-b:v 1M` (instead of default)
3. Use different codec: `-c:v libx265` (H.265/HEVC)

## System Requirements

### Minimum
- **RAM**: 4 GB
- **CPU**: Dual-core processor
- **Disk**: 500 MB free space for recordings

### Recommended
- **RAM**: 8 GB+
- **CPU**: Quad-core processor
- **GPU**: Hardware H.264 encoder (Intel Quick Sync, NVIDIA NVENC, or AMD VCE)
- **Disk**: SSD with 2+ GB free space

## Next Steps

1. ✅ Verify FFmpeg installation
2. ✅ Grant necessary permissions
3. ✅ Build the project
4. ✅ Test recording functionality
5. 📖 Read [NATIVE_RECORDING_SOLUTION.md](NATIVE_RECORDING_SOLUTION.md) for architecture details

## Support

For issues or questions:
1. Check console logs for error messages
2. Verify FFmpeg works independently
3. Review troubleshooting section above
4. Check the [main documentation](NATIVE_RECORDING_SOLUTION.md)

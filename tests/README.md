# ClipForge MVP - Testing Documentation

## Overview
This directory contains comprehensive testing documentation and tools for validating the ClipForge MVP.

---

## Test Environment Setup

### Automated Verification
Run the verification script to check all prerequisites:

```bash
./scripts/verify-test-env.sh
```

This will check:
- ✅ macOS platform
- ✅ Node.js 18+ installation
- ✅ Yarn package manager
- ✅ Rust toolchain (for Tauri builds)
- ✅ FFmpeg with H.264 encoder
- ✅ Docker and Docker Compose
- ✅ Redis container status
- ✅ Project dependencies
- ✅ Environment configuration
- ✅ Test video files availability
- ✅ Port availability (1420, 6379)

### Manual Setup Steps

1. **Install Prerequisites** (if not already installed):
   ```bash
   # Node.js
   brew install node@20

   # Yarn
   npm install -g yarn

   # Rust (for Tauri)
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

   # FFmpeg
   brew install ffmpeg

   # Docker Desktop
   # Download from: https://www.docker.com/products/docker-desktop
   ```

2. **Start Redis**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Install Dependencies**:
   ```bash
   yarn install
   ```

4. **Start Application**:
   ```bash
   # Full Tauri app (requires Rust)
   yarn tauri dev

   # Or front-end only (faster for UI testing)
   yarn dev
   ```

---

## Test Documentation

### 1. Manual Test Suite
**File:** [manual_tests.md](./manual_tests.md)

Comprehensive manual testing procedures with 40+ test cases covering:
- File import workflows (drag-and-drop, file picker)
- Video preview and playback
- Trim functionality
- Video export and download
- UI responsiveness
- Edge cases and error handling
- Browser compatibility (Chrome, Safari, Firefox)

**Usage:**
```bash
# Open the manual test document
open tests/manual_tests.md

# Or follow in your editor while testing
```

Each test includes:
- Clear objectives
- Step-by-step instructions
- Expected results
- Pass/fail checkboxes
- Measurement templates

---

### 2. Memory Profiling Tests
**File:** [memory_test.rs](./memory_test.rs)

Automated Rust tests for memory stability validation:
- 15-minute stability test (< 400 MB memory)
- Initial memory footprint (< 200 MB)
- Clip operation memory tracking
- Blob URL cleanup verification
- Video element lifecycle testing
- Export memory leak detection

**Usage:**
```bash
# Run all memory tests
cargo test --test memory_test

# Run specific test
cargo test --test memory_test test_initial_memory_footprint

# Run with output
cargo test --test memory_test -- --nocapture

# Run long-duration tests (ignored by default)
cargo test memory_stability_15min -- --ignored --nocapture
```

---

### 3. Export Validation Tests
**File:** [export_validation.md](./export_validation.md)

Video export quality testing and CRF comparison:
- CRF quality comparison (CRF 18, 23, 28)
- Visual quality assessment (frame-by-frame)
- Audio quality validation
- Trim accuracy verification (frame-accurate)
- Resolution and frame rate preservation
- Codec and format validation
- Browser and QuickTime compatibility
- Stress tests (30+ minute exports)

**Usage:**
```bash
# Open export validation document
open tests/export_validation.md

# Use ffprobe to check video metadata
ffprobe -v error -show_format -show_streams exported_video.mp4

# Compare CRF values (requires manual testing)
# Follow instructions in export_validation.md
```

---

### 4. UI Responsiveness Tests
**File:** [ui_responsiveness.md](./ui_responsiveness.md)

Performance and responsiveness validation:
- Frame rate targets (60 fps timeline, 30+ fps playback)
- Response time targets (< 50ms selection, < 100ms controls)
- Video playback performance (1080p, 60fps, 4K)
- Timeline rendering (< 200ms with 10 clips)
- Trim marker performance (60 fps drag)
- React component performance (< 16ms renders)
- Resource usage monitoring (CPU, GPU, memory)
- Input lag testing (< 100ms)

**Usage:**
```bash
# Open Chrome DevTools Performance tab
# Follow instructions in ui_responsiveness.md

# Quick performance check
open -a "Google Chrome" http://localhost:1420
# Open DevTools > Performance tab
# Record a session while testing
```

---

## Performance Test Plan

**File:** [performance_test_plan.md](./performance_test_plan.md)

Comprehensive performance testing criteria from Phase 6:
- Multi-clip performance (10+ clips)
- Memory stability (15-minute sessions)
- Export performance benchmarks
- UI responsiveness metrics

---

## Quick Testing Workflow

### Daily Testing
```bash
# 1. Verify environment
./scripts/verify-test-env.sh

# 2. Start Redis
docker-compose -f docker-compose.dev.yml up -d

# 3. Start app
yarn dev  # or yarn tauri dev

# 4. Run manual tests
# Follow tests/manual_tests.md
```

### Pre-Release Testing
```bash
# 1. Full environment check
./scripts/verify-test-env.sh

# 2. Run memory tests
cargo test --test memory_test

# 3. Build production version
yarn build

# 4. Run full manual test suite
# Follow all test suites in tests/manual_tests.md

# 5. Validate export quality
# Follow tests/export_validation.md

# 6. Check UI responsiveness
# Follow tests/ui_responsiveness.md
```

---

## Test Reporting

### Manual Test Report Template
```markdown
# ClipForge Manual Test Report

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Build:** [git commit hash]
**Environment:** macOS [version], [browser] [version]

## Summary
- Total tests run: [X]
- Passed: [X]
- Failed: [X]
- Skipped: [X]

## Critical Issues
1. [Description]

## Minor Issues
1. [Description]

## Performance Metrics
- Timeline render (10 clips): [X]ms
- Export time (1 min clip): [X]s
- Memory usage (15 min): [X]MB

## Recommendation
[PASS / CONDITIONAL PASS / FAIL]
```

---

## Monitoring During Tests

### Redis Monitoring
```bash
# View Redis logs
docker logs -f clipforge_redis

# Access Redis CLI
docker exec -it clipforge_redis redis-cli

# Check Redis stats
docker exec -it clipforge_redis redis-cli INFO
```

### Application Logs
```bash
# View Tauri logs (when running yarn tauri dev)
# Logs appear in terminal

# Chrome DevTools Console
# Open DevTools > Console tab
# Monitor for errors and warnings
```

### Memory Monitoring
```bash
# macOS Activity Monitor
open -a "Activity Monitor"
# Search for "ClipForge" or browser process

# Chrome Task Manager
# Chrome > Window > Task Manager
# Monitor memory usage per tab
```

---

## Test Video Files

### Recommended Test Videos

Create or download test videos with various characteristics:

1. **Short clip** (5-10 seconds)
   - Format: MP4 H.264
   - Resolution: 1080p
   - Use for: Quick import tests

2. **Medium clip** (1-2 minutes)
   - Format: MP4 H.264
   - Resolution: 1080p, 30fps
   - Use for: Export and trim tests

3. **Long clip** (10+ minutes)
   - Format: MP4 H.264
   - Resolution: 1080p
   - Use for: Stress tests

4. **High frame rate** (60fps)
   - Format: MP4 H.264
   - Resolution: 1080p, 60fps
   - Use for: Performance tests

5. **MOV file** (QuickTime)
   - Format: MOV H.264
   - Resolution: 720p or 1080p
   - Use for: Format compatibility

6. **4K clip** (optional stress test)
   - Format: MP4 H.264
   - Resolution: 3840x2160
   - Use for: Stress testing

### Creating Sample Videos

```bash
# Create a 30-second test video with FFmpeg
ffmpeg -f lavfi -i testsrc=duration=30:size=1920x1080:rate=30 \
  -c:v libx264 -pix_fmt yuv420p test_video_1080p_30s.mp4

# Create a 60fps test video
ffmpeg -f lavfi -i testsrc=duration=10:size=1920x1080:rate=60 \
  -c:v libx264 -pix_fmt yuv420p test_video_1080p_60fps_10s.mp4

# Create a MOV test video
ffmpeg -f lavfi -i testsrc=duration=30:size=1280x720:rate=30 \
  -c:v libx264 -pix_fmt yuv420p test_video_720p.mov
```

---

## Troubleshooting

### Redis Won't Start
```bash
# Check Docker is running
docker ps

# If Docker daemon isn't running, start Docker Desktop

# Check logs
docker logs clipforge_redis

# Restart container
docker-compose -f docker-compose.dev.yml restart redis
```

### Application Won't Start
```bash
# Check Node.js version
node --version  # Should be 18+

# Reinstall dependencies
rm -rf node_modules
yarn install

# Clear caches
rm -rf dist
rm -rf src-tauri/target

# Try front-end only first
yarn dev
```

### Port Already in Use
```bash
# Check what's using port 1420
lsof -i :1420

# Kill the process if needed
kill -9 [PID]

# Or change port in vite.config.ts
```

### FFmpeg Not Found
```bash
# Check installation
which ffmpeg

# Verify PATH
echo $PATH

# Reinstall if needed
brew reinstall ffmpeg
```

---

## CI/CD Integration (Future)

While manual testing is the focus for MVP, these tests can be automated post-MVP:

- Memory tests: `cargo test --test memory_test`
- TypeScript compilation: `npx tsc --noEmit`
- Build verification: `npm run build`
- Lighthouse performance: `lighthouse http://localhost:1420 --only-categories=performance`

---

## Contributing to Tests

When adding new features, update the relevant test documentation:

1. Add test cases to `manual_tests.md`
2. Update performance criteria in `ui_responsiveness.md`
3. Add memory tests to `memory_test.rs` if needed
4. Document export behavior in `export_validation.md`

---

## Test Sign-off

Before MVP release, all test suites must be completed and signed off by:

- **QA Lead:** Validates all manual tests pass
- **Performance Engineer:** Confirms responsiveness and memory targets met
- **Video Quality Specialist:** Approves export quality (CRF 23)
- **Product Owner:** Final approval for release

---

## Resources

- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/)
- [React DevTools Profiler](https://react.dev/reference/react/Profiler)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/)

---

## Questions or Issues?

If you encounter issues with testing:

1. Run `./scripts/verify-test-env.sh` to check setup
2. Review troubleshooting section above
3. Check application logs in DevTools Console
4. Review test documentation for specific guidance

For test documentation improvements, please update the relevant files and commit changes.

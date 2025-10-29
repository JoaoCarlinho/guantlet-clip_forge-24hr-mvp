# Export Validation Test Suite - ClipForge MVP

## Overview
This document provides comprehensive testing procedures for validating video export quality and comparing different CRF (Constant Rate Factor) values. The MVP uses CRF 23 as the default preset.

---

## Understanding CRF Values

**CRF (Constant Rate Factor):**
- Range: 0 (lossless) to 51 (worst quality)
- Lower value = higher quality + larger file size
- Higher value = lower quality + smaller file size
- Recommended range: 17-28

**ClipForge MVP Default:** CRF 23 (balanced quality/size)

**CRF Comparison Scale:**
- CRF 17-18: Visually lossless (large files)
- CRF 20-23: High quality (recommended)
- CRF 23-28: Medium quality (good compression)
- CRF 28+: Low quality (noticeable artifacts)

---

## Test Suite 1: CRF Quality Comparison

### Test 1.1: Baseline Export (CRF 23)
**Objective:** Establish baseline quality with default CRF 23

**Test Setup:**
- Source: 1080p, 60fps, 1-minute clip
- Settings: CRF 23, H.264, AAC audio, medium preset

**Steps:**
1. Import the test clip
2. Export with default settings (CRF 23)
3. Download exported video
4. Analyze output

**Measurements:**
- File size: [ ] MB
- Export time: [ ] seconds
- Bitrate: [ ] Mbps
- Visual quality: [ ] (1-10 scale)

**Pass/Fail:** [ ]

---

### Test 1.2: High Quality Export (CRF 18)
**Objective:** Test higher quality preset

**Note:** This requires modifying videoExport.ts temporarily to change CRF value

**Test Setup:**
- Source: Same 1080p clip from Test 1.1
- Settings: CRF 18, H.264, AAC audio, medium preset

**Steps:**
1. Update videoExport.ts: Change `'-crf', '23'` to `'-crf', '18'`
2. Rebuild application
3. Export the test clip
4. Download and compare

**Measurements:**
- File size: [ ] MB (expect ~50-80% larger than CRF 23)
- Export time: [ ] seconds
- Bitrate: [ ] Mbps
- Visual quality: [ ] (1-10 scale)

**Comparison to CRF 23:**
- Size difference: [ ]%
- Quality improvement: [ ] (subjective)
- Worth the trade-off: [ ] Y/N

**Pass/Fail:** [ ]

---

### Test 1.3: Medium Quality Export (CRF 28)
**Objective:** Test lower quality, higher compression

**Test Setup:**
- Source: Same 1080p clip
- Settings: CRF 28, H.264, AAC audio, medium preset

**Steps:**
1. Update videoExport.ts: Change to CRF 28
2. Rebuild application
3. Export and download

**Measurements:**
- File size: [ ] MB (expect ~30-50% smaller than CRF 23)
- Export time: [ ] seconds
- Bitrate: [ ] Mbps
- Visual quality: [ ] (1-10 scale)
- Visible artifacts: [ ] Y/N

**Comparison to CRF 23:**
- Size difference: [ ]%
- Quality degradation: [ ] (subjective)
- Acceptable quality: [ ] Y/N

**Pass/Fail:** [ ]

---

## Test Suite 2: Export Quality Validation

### Test 2.1: Visual Quality Assessment
**Objective:** Compare source vs. exported quality

**Steps:**
1. Open source video in QuickTime/VLC
2. Open exported video (CRF 23) in another window
3. Play both simultaneously
4. Pause at 5 different scenes
5. Compare frame quality

**Comparison Points:**
- [ ] Sharp edges preserved
- [ ] Colors accurate
- [ ] No banding in gradients
- [ ] Text remains legible
- [ ] Motion is smooth

**Quality Rating:** [ ] / 10

**Pass/Fail:** [ ]

---

### Test 2.2: Audio Quality Validation
**Objective:** Verify audio quality is preserved

**Steps:**
1. Play source video, note audio quality
2. Play exported video
3. Compare audio clarity, volume, sync

**Audio Checks:**
- [ ] No distortion or clipping
- [ ] Volume levels consistent with source
- [ ] Audio/video sync maintained
- [ ] No dropped audio frames
- [ ] Frequency range preserved

**Pass/Fail:** [ ]

---

### Test 2.3: Trim Accuracy Validation
**Objective:** Verify trim points are frame-accurate

**Test Setup:**
- Source: 30-second clip
- Trim: IN=5.00s, OUT=15.00s
- Expected output: Exactly 10.00 seconds

**Steps:**
1. Import clip and set precise trim points
2. Export the trimmed clip
3. Open in video editor (e.g., iMovie, Final Cut)
4. Check exact duration and content

**Validation:**
- Exported duration: [ ] seconds (expect: 10.00s)
- First frame timestamp: [ ] (expect: original 5.00s content)
- Last frame timestamp: [ ] (expect: original 15.00s content)
- Frame accuracy: [ ] ±frames

**Pass/Fail:** [ ]

---

### Test 2.4: Resolution Preservation
**Objective:** Verify output resolution matches source

**Steps:**
1. Check source video resolution (e.g., 1920x1080)
2. Export video
3. Check exported video metadata

**Validation:**
- Source resolution: [ ] x [ ]
- Exported resolution: [ ] x [ ]
- Match: [ ] Y/N
- Aspect ratio preserved: [ ] Y/N

**Pass/Fail:** [ ]

---

### Test 2.5: Frame Rate Preservation
**Objective:** Verify output frame rate matches source

**Steps:**
1. Check source video frame rate (e.g., 30fps, 60fps)
2. Export video
3. Check exported video metadata

**Validation:**
- Source frame rate: [ ] fps
- Exported frame rate: [ ] fps
- Match: [ ] Y/N
- No dropped frames: [ ] Y/N

**Pass/Fail:** [ ]

---

## Test Suite 3: Export Performance vs. Quality

### Test 3.1: Export Time Comparison
**Objective:** Compare export times for different CRF values

**Test Clips:**
- 1-minute 1080p clip
- Export with CRF 18, 23, 28

**Results:**

| CRF Value | Export Time | File Size | Quality (1-10) |
|-----------|-------------|-----------|----------------|
| 18        | [ ]s        | [ ] MB    | [ ]            |
| 23 (MVP)  | [ ]s        | [ ] MB    | [ ]            |
| 28        | [ ]s        | [ ] MB    | [ ]            |

**Analysis:**
- Best quality/size ratio: CRF [ ]
- Best quality/time ratio: CRF [ ]
- Recommended for MVP: CRF 23 ✓

**Pass/Fail:** [ ]

---

### Test 3.2: File Size Comparison
**Objective:** Analyze file size trends across CRF values

**Test Setup:**
- Source: 5-minute 1080p clip, 150 MB
- Export with CRF 17, 20, 23, 26, 28

**Results:**

| CRF | File Size | Compression Ratio | Quality Loss |
|-----|-----------|-------------------|--------------|
| 17  | [ ] MB    | [ ]%              | Minimal      |
| 20  | [ ] MB    | [ ]%              | Very Low     |
| 23  | [ ] MB    | [ ]%              | Low          |
| 26  | [ ] MB    | [ ]%              | Medium       |
| 28  | [ ] MB    | [ ]%              | Noticeable   |

**MVP Default (CRF 23) Analysis:**
- Compression: [ ]% of original size
- Quality assessment: [ ]
- Acceptable for MVP: [ ] Y/N

**Pass/Fail:** [ ]

---

## Test Suite 4: Codec and Format Validation

### Test 4.1: H.264 Codec Verification
**Objective:** Verify output uses H.264 codec

**Steps:**
1. Export a video
2. Check video metadata with ffprobe or MediaInfo

**Command:**
```bash
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 exported_video.mp4
```

**Expected Output:** `h264`

**Validation:**
- Video codec: [ ] (expect: h264)
- Audio codec: [ ] (expect: aac)
- Container: [ ] (expect: mp4)

**Pass/Fail:** [ ]

---

### Test 4.2: Browser Compatibility
**Objective:** Verify exported videos play in all browsers

**Steps:**
1. Export a video
2. Create simple HTML file with video tag
3. Test in Chrome, Safari, Firefox

**HTML Test:**
```html
<video controls width="640">
  <source src="exported_video.mp4" type="video/mp4">
</video>
```

**Browser Tests:**
- [ ] Chrome: Plays successfully
- [ ] Safari: Plays successfully
- [ ] Firefox: Plays successfully
- [ ] Edge: Plays successfully

**Pass/Fail:** [ ]

---

### Test 4.3: QuickTime Compatibility (macOS)
**Objective:** Verify videos play in QuickTime Player

**Steps:**
1. Export a video
2. Double-click to open in QuickTime
3. Verify playback

**Validation:**
- [ ] Opens without errors
- [ ] Plays smoothly
- [ ] Controls work (play/pause/seek)
- [ ] Fast-forward (movflags +faststart) works

**Pass/Fail:** [ ]

---

## Test Suite 5: Edge Cases and Stress Tests

### Test 5.1: Very Long Export (30+ minutes)
**Objective:** Test export stability for long videos

**Test Setup:**
- Source: 30-minute clip
- Settings: CRF 23, default preset

**Steps:**
1. Import long clip
2. Start export
3. Monitor progress and memory
4. Validate output

**Measurements:**
- Export time: [ ] minutes
- Memory peak: [ ] MB
- File size: [ ] MB
- Playback quality: [ ]

**Issues Encountered:**
- [ ] None
- [ ] Browser freeze
- [ ] Memory issues
- [ ] Export failure

**Pass/Fail:** [ ]

---

### Test 5.2: Multiple Sequential Exports
**Objective:** Verify export quality remains consistent

**Steps:**
1. Export same clip 5 times consecutively
2. Compare file sizes and checksums

**Results:**

| Export # | File Size | Checksum (MD5) | Time  |
|----------|-----------|----------------|-------|
| 1        | [ ] MB    | [ ]            | [ ]s  |
| 2        | [ ] MB    | [ ]            | [ ]s  |
| 3        | [ ] MB    | [ ]            | [ ]s  |
| 4        | [ ] MB    | [ ]            | [ ]s  |
| 5        | [ ] MB    | [ ]            | [ ]s  |

**Validation:**
- [ ] All exports have identical file sizes (±1%)
- [ ] Quality is consistent across exports
- [ ] No degradation over time

**Pass/Fail:** [ ]

---

### Test 5.3: Minimal Trim Export
**Objective:** Test export with very small trim selection

**Test Setup:**
- Source: 30-second clip
- Trim: IN=10.00s, OUT=10.50s (0.5 second output)

**Steps:**
1. Set minimal trim range (0.5s)
2. Export
3. Validate output

**Validation:**
- Export completes: [ ] Y/N
- Duration accurate: [ ] Y/N (±0.1s)
- Playable: [ ] Y/N
- Quality maintained: [ ] Y/N

**Pass/Fail:** [ ]

---

## Test Suite 6: FFmpeg Integration Validation

### Test 6.1: FFmpeg WASM Loading
**Objective:** Verify FFmpeg loads correctly

**Steps:**
1. Open browser DevTools console
2. Start an export
3. Monitor console for FFmpeg messages

**Expected Console Output:**
```
Loading FFmpeg core...
FFmpeg loaded successfully
Starting export...
[ffmpeg output messages]
Export completed successfully!
```

**Validation:**
- [ ] FFmpeg loads from unpkg CDN
- [ ] Core files loaded: ffmpeg-core.js, ffmpeg-core.wasm
- [ ] No CORS errors
- [ ] FFmpeg version displayed

**Pass/Fail:** [ ]

---

### Test 6.2: FFmpeg Command Validation
**Objective:** Verify correct FFmpeg arguments are used

**Expected Command Structure:**
```bash
ffmpeg -i input.mp4 \
  -ss [trimStart] \
  -t [duration] \
  -c:v libx264 \
  -crf 23 \
  -preset medium \
  -c:a aac \
  -movflags +faststart \
  output.mp4
```

**Validation (check export logs):**
- [ ] Input file specified: `-i input.mp4`
- [ ] Trim start: `-ss [value]`
- [ ] Duration: `-t [value]`
- [ ] Video codec: `-c:v libx264`
- [ ] CRF value: `-crf 23`
- [ ] Preset: `-preset medium`
- [ ] Audio codec: `-c:a aac`
- [ ] Faststart flag: `-movflags +faststart`

**Pass/Fail:** [ ]

---

## Test Results Summary Template

```markdown
# Export Validation Test Results

**Date:** [YYYY-MM-DD]
**Tester:** [Name]
**Build:** [commit hash]

## CRF Comparison Results

Best overall quality/size ratio: CRF [ ]
Recommendation for MVP: CRF 23 ✓

## Quality Validation

- Visual quality: [ ]/10
- Audio quality: [ ]/10
- Trim accuracy: ±[ ] frames
- Resolution preserved: [ ] Y/N
- Frame rate preserved: [ ] Y/N

## Performance Metrics

- Average export time (1 min clip): [ ]s
- File size (1 min @ CRF 23): [ ] MB
- Memory usage during export: [ ] MB

## Compatibility

- Browser playback: [ ] PASS/FAIL
- QuickTime playback: [ ] PASS/FAIL
- H.264 codec verified: [ ] Y/N

## Issues Found

1. [Issue description]
2. [Issue description]

## Recommendation

Export quality is [ ACCEPTABLE / NEEDS IMPROVEMENT ] for MVP release.

CRF 23 provides [ GOOD / EXCELLENT / POOR ] balance of quality and file size.

**Overall Result:** [ PASS / FAIL ]
```

---

## Tools and Commands

### Check Video Metadata
```bash
ffprobe -v error -show_format -show_streams exported_video.mp4
```

### Compare Two Videos
```bash
ffmpeg -i source.mp4 -i exported.mp4 -lavfi ssim -f null -
```

### Calculate File Checksum
```bash
md5 exported_video.mp4
```

### Get Exact Duration
```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 exported_video.mp4
```

### Extract Frame for Comparison
```bash
ffmpeg -ss 00:00:05 -i video.mp4 -frames:v 1 frame.png
```

---

## Recommendations for MVP

Based on testing, CRF 23 should be used for MVP if:

✅ Visual quality scores 7/10 or higher
✅ File size is 40-60% of source
✅ Export time is reasonable (< 1 minute per minute of video)
✅ Compatible with all browsers and QuickTime
✅ No visible artifacts in typical content

If any of these criteria fail, consider:
- Adjusting to CRF 20-22 for better quality
- Adjusting to CRF 24-26 for faster exports

---

## Sign-off

**QA Engineer:** __________________ **Date:** __________

**Video Quality Specialist:** __________________ **Date:** __________

**Product Owner:** __________________ **Date:** __________

# Manual Test Suite - ClipForge MVP

## Overview
This document provides comprehensive manual testing procedures for all ClipForge MVP workflows. Each test includes step-by-step instructions, expected results, and pass/fail criteria.

---

## Test Environment Setup

**Prerequisites:**
- macOS (target platform)
- Node.js 18+ installed
- FFmpeg installed (`brew install ffmpeg`)
- Redis running via Docker Compose (`docker-compose -f docker-compose.dev.yml up -d`)
- Test video files (MP4 and MOV formats, various durations)

**Starting the Application:**
```bash
cd /path/to/clip_forge
yarn install
yarn tauri dev
```

---

## Test Suite 1: File Import Workflows

### Test 1.1: Drag and Drop Import (MP4)
**Objective:** Verify drag-and-drop import of MP4 files

**Steps:**
1. Launch ClipForge application
2. Locate an MP4 video file in Finder
3. Drag the file onto the FileDropZone area
4. Observe the drop zone highlighting during drag
5. Release the file to import

**Expected Results:**
- ✅ Drop zone shows visual feedback (border highlight) during drag
- ✅ File is imported successfully
- ✅ Clip appears on timeline with correct filename
- ✅ Video duration is displayed accurately
- ✅ Console shows: "Added clip: [filename] ([duration]s)"

**Pass/Fail:** [ ]

---

### Test 1.2: Drag and Drop Import (MOV)
**Objective:** Verify drag-and-drop import of MOV files

**Steps:**
1. Locate a MOV video file in Finder
2. Drag the file onto the FileDropZone area
3. Release to import

**Expected Results:**
- ✅ MOV file is imported successfully
- ✅ Clip appears on timeline
- ✅ Duration extracted correctly

**Pass/Fail:** [ ]

---

### Test 1.3: File Picker Import
**Objective:** Verify file picker import functionality

**Steps:**
1. Click "Browse Files" button in FileDropZone
2. Select one or more video files (MP4/MOV) in file picker
3. Click "Open"

**Expected Results:**
- ✅ File picker opens with video filter applied
- ✅ All selected files are imported
- ✅ Clips appear on timeline in selection order

**Pass/Fail:** [ ]

---

### Test 1.4: Multi-File Import
**Objective:** Verify importing multiple files at once

**Steps:**
1. Select 5 video files in Finder
2. Drag all files onto the FileDropZone
3. Release to import

**Expected Results:**
- ✅ All 5 files are imported
- ✅ Clips are arranged sequentially on timeline
- ✅ Each clip's startTime/endTime calculated correctly
- ✅ No gaps between clips

**Pass/Fail:** [ ]

---

### Test 1.5: Invalid File Rejection
**Objective:** Verify non-video files are rejected

**Steps:**
1. Drag a non-video file (e.g., .txt, .jpg) onto drop zone
2. Attempt to import

**Expected Results:**
- ✅ File is rejected
- ✅ Console warning: "Skipping non-video file: [filename]"
- ✅ No error modal or crash

**Pass/Fail:** [ ]

---

### Test 1.6: Unsupported Format Rejection
**Objective:** Verify unsupported video formats are rejected

**Steps:**
1. Drag an AVI or WebM file onto drop zone
2. Attempt to import

**Expected Results:**
- ✅ File is rejected
- ✅ Console warning: "Unsupported video format: [filename]"
- ✅ Only MP4 and MOV files are accepted

**Pass/Fail:** [ ]

---

## Test Suite 2: Video Preview and Playback

### Test 2.1: Video Preview on Import
**Objective:** Verify video preview loads after import

**Steps:**
1. Import a video file
2. Observe the player section

**Expected Results:**
- ✅ Video preview loads in player
- ✅ First clip is selected by default
- ✅ Video controls are visible and functional
- ✅ Video info displays: filename, full duration, trim points

**Pass/Fail:** [ ]

---

### Test 2.2: Video Playback Controls
**Objective:** Verify play/pause functionality

**Steps:**
1. Import a video clip
2. Click play button
3. Wait 2 seconds
4. Click pause button
5. Click play again

**Expected Results:**
- ✅ Video plays smoothly
- ✅ Audio is synchronized
- ✅ Pause stops playback immediately
- ✅ Resume continues from paused position

**Pass/Fail:** [ ]

---

### Test 2.3: Video Seeking
**Objective:** Verify seeking to different timestamps

**Steps:**
1. Import a video clip
2. Click on timeline scrubber at 50% position
3. Observe video jumps to that position
4. Seek to beginning
5. Seek to end

**Expected Results:**
- ✅ Video seeks to clicked position
- ✅ Seeking is responsive (< 500ms)
- ✅ Video frame updates correctly
- ✅ No audio glitches during seek

**Pass/Fail:** [ ]

---

### Test 2.4: Clip Selection
**Objective:** Verify selecting different clips on timeline

**Steps:**
1. Import 3 video clips
2. Click on clip 1 in timeline
3. Click on clip 2 in timeline
4. Click on clip 3 in timeline

**Expected Results:**
- ✅ Clicked clip becomes selected (visual highlight)
- ✅ Player loads selected clip's video
- ✅ Video info updates to show selected clip details
- ✅ Selection response time < 100ms

**Pass/Fail:** [ ]

---

## Test Suite 3: Trim Functionality

### Test 3.1: Set Trim In Point
**Objective:** Verify setting trim start marker

**Steps:**
1. Import a video clip
2. Select the clip on timeline
3. Locate the "IN" trim marker (yellow triangle, left side)
4. Drag the IN marker to 5 seconds
5. Release

**Expected Results:**
- ✅ IN marker moves smoothly during drag
- ✅ Trim point updates in real-time
- ✅ Video info shows updated trim start: "0:05"
- ✅ Trimmed-out region shows diagonal stripes

**Pass/Fail:** [ ]

---

### Test 3.2: Set Trim Out Point
**Objective:** Verify setting trim end marker

**Steps:**
1. Import a 30-second video clip
2. Select the clip
3. Drag the "OUT" trim marker (right side) to 25 seconds
4. Release

**Expected Results:**
- ✅ OUT marker moves smoothly during drag
- ✅ Video info shows updated trim end: "0:25"
- ✅ Trimmed duration calculates correctly
- ✅ Trimmed-out region appears on right side

**Pass/Fail:** [ ]

---

### Test 3.3: Trim Point Constraints
**Objective:** Verify trim markers respect boundaries

**Steps:**
1. Import a clip
2. Try to drag IN marker past OUT marker
3. Try to drag OUT marker before IN marker
4. Try to drag IN marker before 0:00
5. Try to drag OUT marker past clip duration

**Expected Results:**
- ✅ IN marker cannot exceed OUT marker position
- ✅ OUT marker cannot go before IN marker
- ✅ IN marker constrained to >= 0
- ✅ OUT marker constrained to <= duration
- ✅ Minimum gap of 0.1s maintained between markers

**Pass/Fail:** [ ]

---

### Test 3.4: Playback with Trim Points
**Objective:** Verify video playback respects trim boundaries

**Steps:**
1. Set trim IN point to 5s
2. Set trim OUT point to 10s
3. Click play

**Expected Results:**
- ✅ Video starts at 5s (not 0s)
- ✅ Video stops at 10s automatically
- ✅ After stopping, video resets to 5s
- ✅ Seeking is constrained to 5s-10s range

**Pass/Fail:** [ ]

---

### Test 3.5: Trim Warning Indicator
**Objective:** Verify trim warning appears when trim points are set

**Steps:**
1. Import a clip (no trim points)
2. Observe no warning icon
3. Set trim IN point to 3s
4. Observe warning appears

**Expected Results:**
- ✅ No trim warning initially
- ✅ Scissors icon (✂️) appears with message "Clip has trim points applied"
- ✅ Warning visible when either IN or OUT point is modified

**Pass/Fail:** [ ]

---

## Test Suite 4: Video Export

### Test 4.1: Single Clip Export
**Objective:** Verify exporting a single clip

**Steps:**
1. Import a video clip
2. Set trim points (optional)
3. Click "Export Clips" button in export sidebar
4. Wait for export to complete

**Expected Results:**
- ✅ Export button triggers export process
- ✅ Progress bar appears and updates (0-100%)
- ✅ Export log shows detailed messages
- ✅ Success message appears on completion
- ✅ Export time < 30s for 1-minute clip

**Pass/Fail:** [ ]
**Export Time:** [ ]s

---

### Test 4.2: Export Progress Updates
**Objective:** Verify progress bar updates during export

**Steps:**
1. Start export of a 2-minute clip
2. Observe progress bar during export

**Expected Results:**
- ✅ Progress starts at 0%
- ✅ Progress updates smoothly (every ~5%)
- ✅ Progress reaches 100% on completion
- ✅ No UI freeze during export

**Pass/Fail:** [ ]

---

### Test 4.3: Export with Trim Points
**Objective:** Verify exported video respects trim boundaries

**Steps:**
1. Import a 30-second clip
2. Set trim IN to 5s, OUT to 15s
3. Export the clip
4. Download the exported video
5. Play the downloaded video

**Expected Results:**
- ✅ Export completes successfully
- ✅ Exported video duration is 10 seconds (15s - 5s)
- ✅ Content starts at original 5s mark
- ✅ Content ends at original 15s mark
- ✅ No extra frames before/after trim points

**Pass/Fail:** [ ]
**Exported Duration:** [ ]s (expected: 10s)

---

### Test 4.4: Download Exported Video
**Objective:** Verify download functionality

**Steps:**
1. Complete an export
2. Click "Download Video" button
3. Check Downloads folder

**Expected Results:**
- ✅ Browser download dialog appears
- ✅ File downloads successfully
- ✅ Filename format: `clipforge-export-YYYY-MM-DDTHH-MM-SS.mp4`
- ✅ File is playable in QuickTime/VLC
- ✅ File size is reasonable (not corrupted)

**Pass/Fail:** [ ]

---

### Test 4.5: Export Video Preview
**Objective:** Verify in-app video preview after export

**Steps:**
1. Complete an export
2. Locate the preview video in export panel
3. Click play on preview

**Expected Results:**
- ✅ Preview video element appears
- ✅ Video is playable in preview
- ✅ Video has HTML5 controls
- ✅ Preview matches downloaded file

**Pass/Fail:** [ ]

---

### Test 4.6: Export Error Handling
**Objective:** Verify error handling for failed exports

**Steps:**
1. Attempt to export with no clips imported
2. Observe error state

**Expected Results:**
- ✅ Error message appears: "No clips to export"
- ✅ Error icon (✗) is displayed
- ✅ "Try Again" button is available
- ✅ No application crash

**Pass/Fail:** [ ]

---

### Test 4.7: Export Log Visibility
**Objective:** Verify export log provides detailed feedback

**Steps:**
1. Start an export
2. Expand the "Export Log" details section
3. Review log messages

**Expected Results:**
- ✅ Log shows "Starting export..."
- ✅ Log shows FFmpeg loading messages
- ✅ Log shows processing steps
- ✅ Log shows "Export completed successfully!"
- ✅ Log entries are numbered [1], [2], etc.

**Pass/Fail:** [ ]

---

### Test 4.8: Multiple Exports
**Objective:** Verify multiple exports can be performed

**Steps:**
1. Export a clip
2. Click "Export Another" button
3. Export the same clip again
4. Compare the two downloaded files

**Expected Results:**
- ✅ Reset clears previous export state
- ✅ Second export completes successfully
- ✅ Both files are downloadable
- ✅ No memory buildup (check DevTools)

**Pass/Fail:** [ ]

---

## Test Suite 5: UI Responsiveness

### Test 5.1: Timeline Rendering (10 Clips)
**Objective:** Verify timeline performance with multiple clips

**Steps:**
1. Import 10 video clips
2. Observe timeline render time
3. Scroll timeline
4. Select different clips

**Expected Results:**
- ✅ All 10 clips render on timeline
- ✅ Initial render time < 200ms
- ✅ Timeline scrolls smoothly at 60 fps
- ✅ Clip selection is instant (< 50ms)

**Pass/Fail:** [ ]
**Render Time:** [ ]ms

---

### Test 5.2: Trim Marker Drag Performance
**Objective:** Verify smooth trim marker dragging

**Steps:**
1. Import a clip
2. Select the clip
3. Drag trim IN marker back and forth rapidly
4. Drag trim OUT marker back and forth rapidly

**Expected Results:**
- ✅ Markers follow cursor smoothly (60 fps)
- ✅ No visible lag or stuttering
- ✅ State updates in real-time
- ✅ No dropped frames

**Pass/Fail:** [ ]

---

### Test 5.3: Video Playback Performance
**Objective:** Verify smooth video playback

**Steps:**
1. Import a 1080p video clip
2. Play the video
3. Observe playback quality

**Expected Results:**
- ✅ Video plays at 30+ fps
- ✅ No frame drops during playback
- ✅ Audio is synchronized (no drift)
- ✅ Controls remain responsive during playback

**Pass/Fail:** [ ]

---

### Test 5.4: Application Responsiveness During Export
**Objective:** Verify UI remains responsive during export

**Steps:**
1. Start an export of a 5-minute clip
2. While exporting, try to:
   - Select different clips
   - Modify trim points
   - Scroll timeline
   - Open export log

**Expected Results:**
- ✅ UI remains responsive during export
- ✅ All interactions work smoothly
- ✅ No input lag or freezing
- ✅ Progress bar updates don't block UI

**Pass/Fail:** [ ]

---

## Test Suite 6: Edge Cases and Error Handling

### Test 6.1: Empty Timeline
**Objective:** Verify behavior with no clips

**Steps:**
1. Launch app with no clips imported
2. Observe FileDropZone is displayed

**Expected Results:**
- ✅ FileDropZone shows "Drop video files here"
- ✅ "Browse Files" button is clickable
- ✅ No errors in console
- ✅ Export sidebar is hidden

**Pass/Fail:** [ ]

---

### Test 6.2: Very Short Clip (< 1 second)
**Objective:** Verify handling of very short clips

**Steps:**
1. Import a clip less than 1 second
2. Try to set trim points

**Expected Results:**
- ✅ Clip imports successfully
- ✅ Duration displays correctly (e.g., "0:00")
- ✅ Trim markers work within constraints
- ✅ Export completes successfully

**Pass/Fail:** [ ]

---

### Test 6.3: Very Long Clip (> 30 minutes)
**Objective:** Verify handling of long video files

**Steps:**
1. Import a clip longer than 30 minutes
2. Play, trim, and export

**Expected Results:**
- ✅ Clip imports without errors
- ✅ Duration displays correctly (e.g., "32:15")
- ✅ Playback works smoothly
- ✅ Export completes (may take longer)

**Pass/Fail:** [ ]
**Export Time:** [ ]s

---

### Test 6.4: Large File Size (> 500 MB)
**Objective:** Verify handling of large video files

**Steps:**
1. Import a high-resolution clip (> 500 MB)
2. Preview and export

**Expected Results:**
- ✅ File imports successfully
- ✅ Memory usage remains stable
- ✅ Preview loads without freezing
- ✅ Export completes successfully

**Pass/Fail:** [ ]

---

### Test 6.5: Removing Clips
**Objective:** Verify clip removal functionality (if implemented)

**Steps:**
1. Import 3 clips
2. Remove the middle clip
3. Observe timeline

**Expected Results:**
- ✅ Clip is removed from timeline
- ✅ Remaining clips reposition correctly
- ✅ No gaps on timeline
- ✅ Player updates to show first remaining clip

**Pass/Fail:** [ ]
**Note:** Removal functionality may not be in MVP scope

---

## Test Suite 7: Browser Compatibility (macOS)

### Test 7.1: Chrome
**Steps:** Run all tests above in Chrome

**Pass/Fail:** [ ]
**Issues:** [ ]

---

### Test 7.2: Safari
**Steps:** Run all tests above in Safari

**Pass/Fail:** [ ]
**Issues:** [ ]

---

### Test 7.3: Firefox
**Steps:** Run all tests above in Firefox

**Pass/Fail:** [ ]
**Issues:** [ ]

---

## Summary Report Template

```
ClipForge MVP - Manual Test Execution Report
Date: [YYYY-MM-DD]
Tester: [Name]
Build/Commit: [git hash]
Environment: macOS [version], [browser] [version]

Test Results:
- Total Tests: 40+
- Passed: [ ]
- Failed: [ ]
- Skipped: [ ]

Critical Issues:
1. [Issue description]
2. [Issue description]

Minor Issues:
1. [Issue description]
2. [Issue description]

Performance Metrics:
- Timeline render (10 clips): [ ]ms
- Export time (1 min clip): [ ]s
- Memory usage (15 min session): [ ]MB

Recommendation: [PASS / FAIL / CONDITIONAL PASS]

Notes:
[Additional observations]
```

---

## Test Execution Guidelines

1. **Run tests in order** - Some tests build on previous ones
2. **Clear cache between test runs** - Ensure clean state
3. **Document all failures** - Include screenshots and console logs
4. **Check memory usage** - Use Chrome DevTools Memory tab
5. **Test on target hardware** - macOS development machine
6. **Record videos** - For UI responsiveness tests
7. **Compare exports** - Verify video quality matches source

---

## Sign-off

**Tester:** __________________ **Date:** __________

**QA Lead:** __________________ **Date:** __________

**Product Owner:** __________________ **Date:** __________

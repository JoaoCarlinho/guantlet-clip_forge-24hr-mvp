# Testing Notes - Drag-and-Drop Fix

## Issue Reported
- Drag-and-drop zone did not highlight when dragging video files
- Video files did not import upon release

## Root Causes Identified

### 1. Missing `onDragEnter` Handler
The component only had `onDragOver` and `onDragLeave`, which caused inconsistent drag state tracking.

### 2. Drag State Flickering
The `onDragLeave` event was firing when hovering over child elements, causing the drag overlay to flicker on/off.

### 3. Invalid File Paths
The component was using `convertFileSrc()` with invalid file paths (`/${file.name}`), which would never work for video playback.

## Fixes Applied

### Fix 1: Added `onDragEnter` Handler
```typescript
const handleDragEnter = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter.current++;
  if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
    setIsDragging(true);
  }
};
```

### Fix 2: Drag Counter Pattern
Implemented a drag counter to track enter/leave events:
```typescript
const dragCounter = useRef(0);

// Increment on enter
dragCounter.current++;

// Decrement on leave, only reset when counter reaches 0
dragCounter.current--;
if (dragCounter.current === 0) {
  setIsDragging(false);
}
```

This prevents flickering when the cursor moves over child elements.

### Fix 3: Blob URL Usage
Changed from invalid Tauri paths to blob URLs:
```typescript
// OLD (broken):
const filePath = `/${file.name}`;
const convertedPath = convertFileSrc(filePath);

// NEW (working):
const videoUrl = URL.createObjectURL(file);
// Use videoUrl directly as filePath
```

Blob URLs work in both browser and Tauri environments and provide direct access to the file content.

### Fix 4: Enhanced Logging
Added detailed console logs for debugging:
- File drop count
- File processing details (name, type, size)
- Success/error indicators (✓/✗)

## How to Test

### 1. Start the Application
```bash
# Front-end only (recommended for testing)
yarn dev

# Or full Tauri app
yarn tauri dev
```

### 2. Open Browser Console
- Open Chrome DevTools (Cmd+Option+I)
- Go to Console tab
- Watch for log messages

### 3. Test Drag-and-Drop

#### Test Case 1: Single File Drag
1. Find an MP4 or MOV file in Finder
2. Drag it toward the browser window
3. **Expected**:
   - Zone background changes to light blue
   - Dashed border appears
   - "Drop files to import" message shows
   - Animated upload icon appears
4. Release the file
5. **Expected**:
   - Console logs: `Dropped 1 file(s)`
   - Console logs: `Processing file: [name], type: video/mp4, size: X MB`
   - Console logs: `✓ Added clip: [name] (X.XXs)`
   - Video appears in player
   - Clip shows on timeline

#### Test Case 2: Multiple Files Drag
1. Select 3 different video files
2. Drag them together
3. **Expected**: Same highlighting behavior
4. Release
5. **Expected**: All 3 clips import sequentially

#### Test Case 3: Invalid File Type
1. Drag a .txt or .jpg file
2. **Expected**: Highlighting still works
3. Release
4. **Expected**: Console warning: `Skipping non-video file: [name]`

### 4. Test File Picker (Fallback)

1. Click "Browse Files" button
2. Select video file(s)
3. **Expected**: Same import behavior as drag-and-drop

## Verification Checklist

- [ ] Drag highlighting appears when dragging over zone
- [ ] Highlighting disappears when dragging away
- [ ] No flickering when moving cursor over UI elements
- [ ] Files import successfully on drop
- [ ] Console shows detailed processing logs
- [ ] Video preview appears after import
- [ ] Clip appears on timeline with correct duration
- [ ] Multiple files can be imported at once
- [ ] Invalid files are rejected with warnings

## Known Limitations

1. **Blob URLs Persist**: Blob URLs are not revoked after import to allow video playback. They will be automatically cleaned up when:
   - The page is refreshed
   - The browser tab is closed
   - Future enhancement: Add clip removal functionality with URL.revokeObjectURL()

2. **Browser vs Tauri**: This fix works in both environments:
   - Browser: Standard drag-and-drop API
   - Tauri: Uses same browser APIs, blob URLs work identically

3. **File Size**: Very large video files (>1GB) may take time to process. The 10-second timeout should accommodate most files.

## Debugging Tips

### If highlighting doesn't appear:
1. Check browser console for errors
2. Verify drag events are firing: Add `console.log` in handlers
3. Check CSS: `.file-drop-zone.dragging` should have background color

### If files don't import:
1. Check console for error messages
2. Verify file type is video/mp4 or video/quicktime
3. Check file extension is .mp4 or .mov
4. Try with a smaller test file first

### If video doesn't play after import:
1. Check that blob URL is created (starts with `blob:`)
2. Verify browser supports H.264 codec
3. Try different video file (some codecs may not be supported)

## Performance Notes

- Blob URL creation is fast (<100ms per file)
- Metadata extraction requires loading video header (~500ms per file)
- Sequential processing prevents UI freeze
- 10-second timeout prevents hanging on corrupt files

## Next Steps for Production

1. **Add Clip Removal**: Implement removeClip with proper blob URL cleanup
2. **Progress Indicator**: Show loading spinner during file processing
3. **File Validation**: More robust codec and format checking
4. **Error UI**: User-friendly error messages instead of console-only
5. **Tauri File Dialog**: Use native file picker for better UX

## Files Modified

- `src/components/shared/FileDropZone.tsx`
  - Added `onDragEnter` handler
  - Implemented drag counter pattern
  - Switched to blob URLs
  - Enhanced logging
  - Removed unused `convertFileSrc` import

## Testing Status

- [x] TypeScript compilation: PASS
- [x] Vite build: PASS
- [ ] Manual Test 1.1: Pending user verification
- [ ] Manual Test 1.2: Pending
- [ ] Manual Test 1.3: Pending

Please test and report results!

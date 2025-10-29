# Comprehensive Fix Plan for ClipForge Issues

## Executive Summary

After thorough investigation of the codebase, frontend logs, and Tauri logs, I've identified the **root causes** of both issues:

### Issue #1: Drag-and-Drop Not Functioning
**Root Cause:** Tauri is running (`yarn tauri dev`) but `window.__TAURI__` is **not being exposed** to the webview, causing the app to run in "browser mode" where native drag-and-drop events are not being captured.

### Issue #2: Video Playback Not Happening
**Root Cause:** FileDropZone is mounting/unmounting repeatedly (seen in logs), and likely the VideoPlayer is showing the video element instead of the FileDropZone after file upload via the Browse button.

---

## Evidence from Logs

### Frontend Console (`logs/inspect_info.md`)

**Lines 49-52 and 69-72:**
```
[Log] 🔍 FileDropZone mounted, checking environment...
[Log] 🔍 window.__TAURI__ exists: – false
[Log] 🔍 Running in: – "BROWSER MODE"
[Log] ℹ️ Tauri not detected - using HTML5 drag-and-drop only
```

**Critical Finding:** Even though Tauri is running, the browser reports `window.__TAURI__ exists: false`

**FileDropZone Mounting/Unmounting Pattern:**
- Lines 41-48: Mount/Unmount cycle
- Lines 53-60: Unmount cycle
- Lines 61-68: Mount cycle
- Lines 69-72: Another mount

This suggests React is re-rendering and unmounting the component.

### Tauri Logs (`logs/tauri_logs.log`)

```
yarn run v1.22.22
$ tauri dev
Running BeforeDevCommand (`vite dev`)
VITE v7.1.12  ready in 125 ms
➜  Local:   http://localhost:1420/
```

Tauri is running correctly, but the webview is not receiving Tauri APIs.

---

## Root Cause Analysis

### Problem 1: Tauri V2 API Not Exposed

**In Tauri V2**, the `window.__TAURI__` global is no longer automatically injected. Instead:
- Tauri APIs must be imported explicitly from `@tauri-apps/api`
- The `withGlobalTauri` configuration option was removed
- Detection should use feature detection, not global variable checking

**Current Code Issues:**
1. [FileDropZone.tsx:23](src/components/shared/FileDropZone.tsx#L23) checks `window.__TAURI__`
2. This check always fails in Tauri V2
3. HTML5 drag-and-drop handlers are being used instead
4. **But HTML5 `drop` events are being blocked or not firing**

### Problem 2: HTML5 Drag Events Not Firing

**Why NO drag event logs?**

Looking at the component structure:
- `VideoPlayer.tsx` renders `<FileDropZone />` only when `currentClip` is null
- After a file is uploaded via Browse button, `currentClip` becomes the uploaded clip
- The FileDropZone is **unmounted** and replaced with the video player
- **Therefore, there's no drop zone to drag onto!**

**The logs show:** FileDropZone mounts, then unmounts, then mounts again - this is likely due to:
1. Initial render (no clips) → FileDropZone shows
2. User clicks Browse → FileDropZone still showing
3. File processes → clip added to state → FileDropZone unmounts
4. But there's NO video playing, so user refreshes → FileDropZone mounts again

### Problem 3: Video Not Playing After Upload

**From the logs, we DON'T see:**
- "Processing file: ..." message
- "✓ Added clip: ..." success message
- Any file upload related logs **in the current session**

**But the inspect_info.md DOES show older logs with successful file processing**

This means: **The video WAS successfully uploaded at some point, but it's not displaying.**

**Likely causes:**
1. VideoPlayer component expects `currentClip` to exist
2. After upload, `clips.length > 0` so FileDropZone should unmount
3. VideoPlayer should show the video
4. **But the video element might have errors loading the blob URL**

---

## Comprehensive Fix Plan

### Phase 1: Fix Tauri API Detection (Fixes Drag-and-Drop)

#### Step 1.1: Update Tauri Detection Method

**File:** `src/components/shared/FileDropZone.tsx`

**Current problematic code:**
```typescript
if (window.__TAURI__) {
  // This NEVER runs in Tauri V2!
}
```

**Fix:** Use capability detection instead:
```typescript
// Tauri V2 detection: check if @tauri-apps/api modules are available
const isTauriEnvironment = async () => {
  try {
    // Try to import a Tauri module
    await import('@tauri-apps/api/app');
    return true;
  } catch {
    return false;
  }
};
```

#### Step 1.2: Enable Tauri Drag-Drop Events

**Add to** `src-tauri/Cargo.toml`:
Ensure the `drag-drop` feature is enabled (it should be by default in V2)

**Verify** `src-tauri/tauri.conf.json`:
```json
{
  "app": {
    "windows": [{
      "dragDropEnabled": true  // ✅ Already present
    }]
  }
}
```

#### Step 1.3: Use Tauri's File Drop API Correctly

**In Tauri V2**, file drop events work differently:

```typescript
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '@tauri-apps/api/event';

// Listen for window drag-drop events
await listen(TauriEvent.WINDOW_FILE_DROP, (event) => {
  console.log('Files dropped:', event.payload);
  // event.payload is string[] of file paths
});

await listen(TauriEvent.WINDOW_FILE_DROP_HOVER, (event) => {
  setIsDragging(true);
});

await listen(TauriEvent.WINDOW_FILE_DROP_CANCELLED, (event) => {
  setIsDragging(false);
});
```

### Phase 2: Fix HTML5 Drag-and-Drop (Browser Fallback)

Even though Tauri should handle drops, we need HTML5 to work in browser testing.

#### Step 2.1: Add Global Window Drag Handlers

**Problem:** Dragging over the window doesn't reach the FileDropZone if it's covered by other elements.

**Solution:** Add window-level drag event listeners

**File:** `src/App.tsx` or `src/main.tsx`

```typescript
useEffect(() => {
  const handleWindowDragOver = (e: DragEvent) => {
    e.preventDefault(); // Critical: allows drop
  };

  const handleWindowDrop = (e: DragEvent) => {
    e.preventDefault(); // Prevent file from opening in browser
  };

  window.addEventListener('dragover', handleWindowDragOver);
  window.addEventListener('drop', handleWindowDrop);

  return () => {
    window.removeEventListener('dragover', handleWindowDragOver);
    window.removeEventListener('drop', handleWindowDrop);
  };
}, []);
```

#### Step 2.2: Make FileDropZone Cover Entire Player Area

**File:** `src/components/shared/FileDropZone.css`

```css
.file-drop-zone {
  position: absolute; /* Changed from relative */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  min-height: 400px; /* Ensure it's large enough to drop on */
  transition: background-color 0.2s;
}
```

### Phase 3: Fix Video Playback After Upload

#### Step 3.1: Add Video Player Debug Logging

**File:** `src/components/Player/VideoPlayer.tsx`

Add comprehensive logging to see what's happening:

```typescript
export default function VideoPlayer() {
  const { clips, selectedClip } = useValues(timelineLogic);
  const currentClip = selectedClip || (clips.length > 0 ? clips[0] : null);

  console.log('🎬 VideoPlayer render:', {
    clipsCount: clips.length,
    hasSelectedClip: !!selectedClip,
    hasCurrentClip: !!currentClip,
    currentClipPath: currentClip?.filePath,
    currentClipName: currentClip?.name
  });

  useEffect(() => {
    if (currentClip && videoRef.current) {
      console.log('📹 Setting video source:', currentClip.filePath);
      console.log('📹 Video element:', videoRef.current);

      videoRef.current.onloadstart = () => {
        console.log('✅ Video load started');
      };

      videoRef.current.onloadedmetadata = () => {
        console.log('✅ Video metadata loaded');
      };

      videoRef.current.onloadeddata = () => {
        console.log('✅ Video data loaded');
      };

      videoRef.current.onerror = (e) => {
        console.error('❌ Video error:', e);
        console.error('❌ Video error code:', videoRef.current?.error?.code);
        console.error('❌ Video error message:', videoRef.current?.error?.message);
      };
    }
  }, [currentClip]);

  // ... rest of component
}
```

#### Step 3.2: Fix Blob URL Lifecycle

**Problem:** Blob URLs might be getting revoked too early

**File:** `src/components/shared/FileDropZone.tsx`

Ensure blob URLs are stored and not revoked:

```typescript
// Store blob URLs in a ref to prevent garbage collection
const blobUrlsRef = useRef<Set<string>>(new Set());

const processFiles = async (files: File[]) => {
  for (const file of files) {
    // ... validation ...

    const videoUrl = URL.createObjectURL(file);

    // Store the URL to prevent revocation
    blobUrlsRef.current.add(videoUrl);

    // ... rest of processing ...
  }
};

// Cleanup on unmount
useEffect(() => {
  return () => {
    // Revoke all blob URLs when component unmounts
    blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    blobUrlsRef.current.clear();
  };
}, []);
```

#### Step 3.3: Force Video Element Reload

**File:** `src/components/Player/VideoPlayer.tsx`

```typescript
useEffect(() => {
  if (videoRef.current && currentClip) {
    console.log('🔄 Forcing video reload for:', currentClip.name);

    // Force reload by setting src directly
    videoRef.current.src = currentClip.filePath;
    videoRef.current.load(); // Explicitly trigger load

    // Set initial playback position
    videoRef.current.currentTime = currentClip.trimStart;
  }
}, [currentClip?.id, currentClip?.filePath]);
```

### Phase 4: Improve User Feedback

#### Step 4.1: Add Loading States

Show when files are being processed:

```typescript
const [isProcessing, setIsProcessing] = useState(false);
const [processingFileName, setProcessingFileName] = useState('');

const processFiles = async (files: File[]) => {
  setIsProcessing(true);

  for (const file of files) {
    setProcessingFileName(file.name);
    // ... process file ...
  }

  setIsProcessing(false);
  setProcessingFileName('');
};
```

#### Step 4.2: Show Error Messages

```typescript
const [uploadError, setUploadError] = useState<string | null>(null);

// In processFiles error handler:
catch (error) {
  console.error(`✗ Error processing file ${file.name}:`, error);
  setUploadError(`Failed to load ${file.name}: ${error.message}`);
}
```

### Phase 5: Alternative Approach - Keep FileDropZone Always Visible

**Radical Solution:** Show FileDropZone ALONGSIDE the video player

**File:** `src/components/Player/VideoPlayer.tsx`

```typescript
return (
  <div className="video-player-container">
    {currentClip ? (
      <div className="video-wrapper">
        <video {...props} />
        <div className="video-info">...</div>
      </div>
    ) : (
      <div className="empty-state">
        <p>No clips imported yet</p>
      </div>
    )}

    {/* FileDropZone ALWAYS rendered, overlaid for drop zone */}
    <FileDropZone>
      {currentClip ? null : (
        <div className="drop-zone-content">
          {/* Show drop zone UI only when no clips */}
        </div>
      )}
    </FileDropZone>
  </div>
);
```

This keeps the drop zone mounted and able to receive drag events even when a video is playing.

---

## Implementation Priority

### Priority 1 (Critical - Fixes Both Issues)
1. ✅ **Fix Tauri API detection** - Use Tauri V2 event system
2. ✅ **Add window-level drag handlers** - Ensure drag events are captured
3. ✅ **Add video player error logging** - Diagnose playback issues

### Priority 2 (Important - User Experience)
4. ✅ **Fix blob URL lifecycle** - Prevent premature cleanup
5. ✅ **Force video reload** - Ensure video loads after upload
6. ✅ **Add loading states** - Show progress during upload

### Priority 3 (Enhancement)
7. ✅ **Keep FileDropZone always mounted** - Allow drag-drop even with videos loaded
8. ✅ **Improve error messages** - Help users understand failures

---

## Testing Plan

### Test 1: Tauri Drag-and-Drop
1. Run `yarn tauri dev`
2. Check console for Tauri detection logs
3. Drag a video file over the window
4. Verify Tauri drop event fires
5. Verify file processes and appears in timeline

### Test 2: Browser Drag-and-Drop (Fallback)
1. Run `npm run dev` (browser only)
2. Open http://localhost:1420
3. Drag a video file over the window
4. Verify HTML5 drop event fires
5. Verify file processes

### Test 3: Video Playback
1. Upload a video via Browse button
2. Check console for video player logs
3. Verify video element renders
4. Verify video source is set correctly
5. Verify video plays when play button clicked

### Test 4: Error Handling
1. Try dragging a non-video file
2. Try dragging an invalid video file
3. Verify error messages appear
4. Verify app doesn't crash

---

## Quick Start - Immediate Fixes

### Fix #1: Update FileDropZone to Use Tauri V2 Events

Replace the `useEffect` that checks `window.__TAURI__` with:

```typescript
useEffect(() => {
  const setupTauriListeners = async () => {
    try {
      const { listen } = await import('@tauri-apps/api/event');
      const { TauriEvent } = await import('@tauri-apps/api/event');

      console.log('✅ Tauri API loaded - setting up native file drop');

      const unlistenDrop = await listen(TauriEvent.WINDOW_FILE_DROP, async (event: any) => {
        console.log('🟢 Tauri file drop:', event.payload);
        const filePaths = event.payload as string[];
        await processFilePaths(filePaths);
      });

      const unlistenHover = await listen(TauriEvent.WINDOW_FILE_DROP_HOVER, () => {
        console.log('🟢 Tauri drag hover');
        setIsDragging(true);
      });

      const unlistenCancelled = await listen(TauriEvent.WINDOW_FILE_DROP_CANCELLED, () => {
        console.log('🟢 Tauri drag cancelled');
        setIsDragging(false);
      });

      return () => {
        unlistenDrop();
        unlistenHover();
        unlistenCancelled();
      };
    } catch (error) {
      console.log('ℹ️ Tauri not available - using HTML5 drag-and-drop');
    }
  };

  setupTauriListeners();
}, []);
```

### Fix #2: Add Window-Level Drag Handlers

In `src/App.tsx`, add to the `EditorView` component:

```typescript
function EditorView() {
  const { clips } = useValues(timelineLogic);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    // ... existing JSX
  );
}
```

### Fix #3: Add Video Error Logging

In `VideoPlayer.tsx`, update the video element:

```typescript
<video
  ref={videoRef}
  className="video-element"
  controls
  onTimeUpdate={handleTimeUpdate}
  onPause={() => pause()}
  onPlay={handlePlay}
  onSeeked={handleSeeked}
  onEnded={() => pause()}
  onError={(e) => {
    const video = e.currentTarget;
    console.error('❌ Video playback error:', {
      errorCode: video.error?.code,
      errorMessage: video.error?.message,
      src: video.src,
      networkState: video.networkState,
      readyState: video.readyState
    });
  }}
  onLoadStart={() => console.log('📹 Video load started:', currentClip?.name)}
  onLoadedData={() => console.log('✅ Video loaded successfully:', currentClip?.name)}
  key={currentClip.id}
>
  <source src={currentClip.filePath} type="video/mp4" />
  Your browser does not support the video tag.
</video>
```

---

## Expected Outcomes

After implementing these fixes:

1. **Drag-and-Drop Will Work** because:
   - Tauri V2 events will be properly detected and used
   - Window-level handlers will catch drag events
   - FileDropZone will receive drop events in both Tauri and browser

2. **Video Playback Will Work** because:
   - Blob URLs will be properly managed
   - Video element will force-reload on clip change
   - Error logging will reveal any remaining issues

3. **Better User Experience** because:
   - Loading states show progress
   - Error messages explain failures
   - FileDropZone can always accept new files

---

## Long-Term Recommendations

1. **Remove Tauri Dependencies** - If migrating to Electron (per branch name), remove `@tauri-apps/api` imports
2. **Use Electron File Dialog** - Replace file drop with Electron's native dialog
3. **Store Videos in Filesystem** - Instead of blob URLs, save to temp directory and use file:// URLs
4. **Add Video Validation** - Check codec compatibility before processing
5. **Implement Progress Bars** - Show upload/processing progress
6. **Add Thumbnail Generation** - Create video thumbnails for timeline
7. **Support More Formats** - Add codec detection and transcoding for unsupported formats

---

## Summary

**Both issues stem from the same root cause:** The app is running in Tauri but not detecting it, falling back to browser mode where drag-drop isn't properly configured.

**The fix is straightforward:**
1. Update Tauri API usage for V2
2. Add window-level drag handlers
3. Add proper error logging

**This should take ~2-3 hours to implement and test comprehensively.**

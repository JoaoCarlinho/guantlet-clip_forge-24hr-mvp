# CRITICAL FIX PLAN - Tauri Event Listener Error

## CRITICAL FINDING

The logs reveal the exact problem:

```
[Log] ✅ Tauri API loaded - setting up native file drop
[Log] 🔍 Running in: TAURI MODE (V2)
[Log] ℹ️ Tauri not available - using HTML5 drag-and-drop only
[Log] Error details: – "invalid args `event` for command `listen`: command listen missing required key event"
```

**Root Cause:** The `listen()` function in Tauri V2 is receiving an invalid event parameter. The `TauriEvent` enum is not being converted to a string properly.

---

## The Problem

In our implementation, we're using:
```typescript
const { listen } = await import('@tauri-apps/api/event');
const { TauriEvent } = await import('@tauri-apps/api/event');

await listen(TauriEvent.WINDOW_FILE_DROP, async (event: any) => {
  // ...
});
```

But Tauri V2's `listen()` expects:
1. Either a **string** event name
2. OR the enum needs to be used differently

---

## Analysis from Logs

The sequence shows:
1. ✅ Tauri API successfully loaded
2. ✅ Code correctly identifies "TAURI MODE (V2)"
3. ❌ `listen()` call fails with "invalid args"
4. ⚠️  Falls back to "BROWSER MODE" due to error
5. ⚠️  HTML5 drag-and-drop handlers never fire because FileDropZone is not visible

**Result:**
- Tauri events don't work (API error)
- HTML5 events don't work (FileDropZone hidden after component unmounts)
- NO DRAG-DROP FUNCTIONALITY AT ALL

---

## The Fix

### Option 1: Use String Event Names (Recommended)

Tauri V2 uses string-based event names for file drop:

```typescript
await listen('tauri://file-drop', async (event: any) => {
  const filePaths = event.payload as string[];
  await processFilePaths(filePaths);
});

await listen('tauri://file-drop-hover', () => {
  setIsDragging(true);
});

await listen('tauri://file-drop-cancelled', () => {
  setIsDragging(false);
});
```

### Option 2: Remove TauriEvent Import

The `TauriEvent` enum might not exist in Tauri V2 API, or it might be internal-only.

---

## Implementation

### Fix FileDropZone.tsx

**Replace lines 22-59 with:**

```typescript
const setupTauriListeners = async () => {
  try {
    // Try to import Tauri V2 event module
    const { listen } = await import('@tauri-apps/api/event');

    console.log('✅ Tauri API loaded - setting up native file drop');
    console.log('🔍 Running in: TAURI MODE (V2)');

    // Use string event names for Tauri V2
    const unlistenDrop = await listen('tauri://file-drop', async (event: any) => {
      console.log('🟢 Tauri file drop event:', event.payload);
      setIsDragging(false);
      dragCounter.current = 0;

      const filePaths = event.payload as string[];
      console.log(`📁 Received ${filePaths.length} file path(s) from Tauri:`, filePaths);
      await processFilePaths(filePaths);
    });
    unlisteners.push(unlistenDrop);
    console.log('✅ Tauri file-drop listener registered');

    // Listen for drag hover events
    const unlistenHover = await listen('tauri://file-drop-hover', () => {
      console.log('🟢 Tauri drag hover event');
      setIsDragging(true);
    });
    unlisteners.push(unlistenHover);
    console.log('✅ Tauri file-drop-hover listener registered');

    // Listen for drag cancelled events
    const unlistenCancelled = await listen('tauri://file-drop-cancelled', () => {
      console.log('🟢 Tauri drag cancelled event');
      setIsDragging(false);
      dragCounter.current = 0;
    });
    unlisteners.push(unlistenCancelled);
    console.log('✅ Tauri file-drop-cancelled listener registered');

  } catch (error) {
    console.log('ℹ️ Tauri not available - using HTML5 drag-and-drop only');
    console.log('🔍 Running in: BROWSER MODE');
    console.log('Error details:', error);
  }
};
```

**Key Changes:**
1. Remove `TauriEvent` import - not needed
2. Use string event names: `'tauri://file-drop'`, `'tauri://file-drop-hover'`, `'tauri://file-drop-cancelled'`
3. Keep all error handling and logging

---

## Secondary Issue: FileDropZone Mounting/Unmounting

The logs also show:
```
[Log] 🔍 FileDropZone mounted, checking environment...
[Log] 🧹 Cleaning up Tauri listeners
[Log] [KEA] Event: beforeUnmount
[Log] 🔍 FileDropZone mounted, checking environment...
```

FileDropZone is being mounted, then unmounted, then re-mounted. This is because:

1. App starts → FileDropZone shows (no clips)
2. React strict mode re-renders → FileDropZone unmounts/remounts
3. If a clip exists from previous session → FileDropZone unmounts (hidden)

**Solution:** Keep FileDropZone always mounted but overlay it:

### Update VideoPlayer.tsx

```typescript
return (
  <div className="video-player-container" style={{ position: 'relative' }}>
    {/* Always render FileDropZone for drag-drop capability */}
    <FileDropZone>
      {!currentClip && (
        <div className="drop-zone-content">
          <div className="drop-zone-icon">{/* ... */}</div>
          <h3>Drop video files here</h3>
          <p>or</p>
          <button className="browse-button" onClick={openFilePicker}>
            Browse Files
          </button>
          <p className="file-types">Supports MP4 and MOV files</p>
        </div>
      )}
    </FileDropZone>

    {/* Show video player on top when clip exists */}
    {currentClip && (
      <div className="video-wrapper" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}>
        <video {...props} />
        <div className="video-info">{/* ... */}</div>
      </div>
    )}
  </div>
);
```

This keeps FileDropZone mounted at all times, ensuring drag-drop listeners stay active.

---

## Complete Fix Checklist

- [ ] Fix Tauri event names (use strings instead of enum)
- [ ] Remove TauriEvent import
- [ ] Keep FileDropZone always mounted
- [ ] Update VideoPlayer to overlay video on top of FileDropZone
- [ ] Test drag-drop in Tauri mode
- [ ] Test drag-drop in browser mode
- [ ] Test video playback after upload

---

## Expected Results After Fix

### Console Output When Starting:
```
✅ Tauri API loaded - setting up native file drop
🔍 Running in: TAURI MODE (V2)
✅ Tauri file-drop listener registered
✅ Tauri file-drop-hover listener registered
✅ Tauri file-drop-cancelled listener registered
🎯 Setting up window-level drag handlers
✅ Window-level drag handlers registered
```

### When Dragging a File:
```
🟢 Tauri drag hover event
(drag UI shows)
```

### When Dropping a File:
```
🟢 Tauri file drop event: ["/Users/.../video.mp4"]
📁 Received 1 file path(s) from Tauri: ["/Users/.../video.mp4"]
Processing file path: /Users/.../video.mp4
✓ Added clip: video.mp4 (120.5s)
🎬 VideoPlayer render: {clipsCount: 1, hasCurrentClip: true, ...}
📹 Setting up video for clip: video.mp4
✅ Video load started for: video.mp4
✅ Video metadata loaded: {duration: 120.5, ...}
✅ Video data loaded successfully for: video.mp4
✅ Video can play: video.mp4
```

---

## Why Previous Fix Didn't Work

The previous fix used `TauriEvent.WINDOW_FILE_DROP` which:
1. Is the correct enum in Tauri API definitions
2. BUT the enum values might not serialize properly when passed to `listen()`
3. The `listen()` function expects a string, not an enum value
4. Even if TypeScript accepts it, the Tauri IPC layer rejects it

The error message "command listen missing required key event" indicates the Tauri backend didn't receive a valid event name string.

---

## Implementation Priority

1. **CRITICAL:** Fix Tauri event listener (use string names)
2. **HIGH:** Keep FileDropZone always mounted
3. **MEDIUM:** Test in both Tauri and browser modes

This should take ~15 minutes to implement and test.

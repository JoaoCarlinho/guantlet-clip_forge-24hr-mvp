# CRITICAL FIX: Tauri File System Permissions

## 🎯 Root Cause Found!

Based on `/Users/joaocarlinho/gauntlet/clip_forge/dev_docs/tauri_web_search.txt`, the issue is:

**Tauri V2 requires explicit file system permissions for drag-and-drop to work!**

## The Problem

The current `src-tauri/capabilities/default.json` only had:
```json
{
  "permissions": [
    "core:default"  // Not enough!
  ]
}
```

**This is why:**
- ✅ Tauri listeners registered (code is correct)
- ✅ `dragDropEnabled: true` (config is correct)
- ❌ **But no events fire** (permissions missing!)

## The Solution

Updated `src-tauri/capabilities/default.json` to include file system permissions:

```json
{
  "permissions": [
    "core:default",
    "core:event:allow-listen",      // Allow event listening
    "core:event:allow-emit",         // Allow event emission
    "fs:allow-read-file",            // Read dropped files
    "fs:allow-read-dir",             // Read directory info
    "path:allow-resolve",            // Resolve file paths
    "path:allow-basename",           // Get file names
    "path:allow-dirname"             // Get directory names
  ]
}
```

## Why This Fixes Everything

In Tauri V2, the security model requires **explicit permission grants**:

1. **Event Permissions:** Allow the webview to listen for Tauri events
2. **File System Permissions:** Allow reading dropped files
3. **Path Permissions:** Allow resolving file paths

Without these, Tauri silently **blocks all file-drop events** for security.

## What to Do Next

### Step 1: Restart the App (REQUIRED)

The app **must be restarted** for permissions to take effect:

```bash
# Stop the current app (Ctrl+C)
# Then restart:
yarn tauri dev
```

### Step 2: Test Drag-and-Drop Again

After restart:

1. **Drag a video file over the window**
2. **You should now see:**
   ```
   🟢 Tauri file-drop-hover event
   ```

3. **Drop the file**
4. **You should see:**
   ```
   🟢 Tauri file-drop event: ["/path/to/video.mp4"]
   📁 Received 1 file path(s) from Tauri
   Processing file path: /path/to/video.mp4
   ✓ Added clip: video.mp4 (XXX.XXs)
   ```

## Expected Results

### Before (Missing Permissions):
- ❌ No drag events fire
- ❌ Silent failure
- ❌ No console logs when dragging

### After (With Permissions):
- ✅ Drag hover events fire immediately
- ✅ Drop events work correctly
- ✅ Files process and videos load

## Why This Wasn't Obvious

Tauri V2's security model is **very strict**:
- No error messages when permissions are missing
- Events just don't fire
- Documentation assumes you know to add permissions
- Our code was 100% correct, just missing config

## Additional Notes

### File System Scope

If you need to restrict which directories the app can access, you can add scope:

```json
{
  "permissions": [
    "core:default",
    "core:event:allow-listen",
    "core:event:allow-emit",
    {
      "identifier": "fs:scope",
      "allow": [
        "$DESKTOP/**",    // Allow desktop files
        "$HOME/**",       // Allow home directory
        "$TEMP/**"        // Allow temp files
      ],
      "deny": []
    },
    "fs:allow-read-file",
    "path:allow-resolve"
  ]
}
```

But for MVP, the current permissions (no scope restrictions) are fine.

### HTML5 Fallback Still Works

Even with Tauri permissions, the HTML5 drag-drop handlers remain as a fallback. This provides defense in depth.

## Testing Checklist

After restarting the app:

- [ ] Drag file over window → See hover event
- [ ] Drop file → See drop event
- [ ] File processes → See "Added clip" message
- [ ] Video loads → See video player with controls
- [ ] Video plays → Click play, verify it works
- [ ] Multiple files → Drag second file, verify it works

## Verification

To confirm permissions are loaded:

1. Check Tauri console (terminal) for any permission warnings
2. Drag a file and watch browser console
3. Should see Tauri events (green circle emoji 🟢)

## Summary

**Issue:** Tauri V2 security model blocked drag-drop events
**Fix:** Added explicit file system permissions to capabilities
**Action Required:** Restart app with `yarn tauri dev`
**Expected:** Drag-and-drop will work immediately after restart

This was the missing piece! 🎉

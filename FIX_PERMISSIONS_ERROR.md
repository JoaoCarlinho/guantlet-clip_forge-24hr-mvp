# FIX: Tauri Exit Code 101 - Invalid Permissions

## Error Found

The build failed with:
```
Permission fs:allow-read-file not found
```

## Root Cause

I used **incorrect permission names**. Tauri V2 doesn't have `fs:` permissions in the core module - those are plugin-specific.

## The Fix

### BEFORE (Incorrect):
```json
{
  "permissions": [
    "core:default",
    "core:event:allow-listen",
    "core:event:allow-emit",
    "fs:allow-read-file",          // ❌ WRONG - doesn't exist
    "fs:allow-read-dir",            // ❌ WRONG - doesn't exist
    "path:allow-resolve",           // ❌ WRONG - missing core: prefix
    "path:allow-basename",          // ❌ WRONG - missing core: prefix
    "path:allow-dirname"            // ❌ WRONG - missing core: prefix
  ]
}
```

### AFTER (Correct):
```json
{
  "permissions": [
    "core:default",
    "core:event:allow-listen",
    "core:event:allow-emit",
    "core:path:allow-resolve",     // ✅ CORRECT
    "core:path:allow-basename",    // ✅ CORRECT
    "core:path:allow-dirname"      // ✅ CORRECT
  ]
}
```

## Why This Should Still Work

Even without explicit file system permissions, Tauri V2 allows:
- **Event listening** (we have `core:event:allow-listen`)
- **Path operations** (we have `core:path:*` permissions)
- **Native drag-drop** should work with just `dragDropEnabled: true` in config

The `tauri_web_search.txt` document was for Tauri V1 or a different plugin setup. In Tauri V2 core, file system operations via drag-drop are handled differently.

## How Drag-Drop Works in Tauri V2

1. **`dragDropEnabled: true`** in `tauri.conf.json` enables native OS drag-drop
2. **Event permissions** allow webview to listen for Tauri events
3. **Path permissions** allow resolving dropped file paths
4. **No explicit fs: permissions needed** for drag-drop (those are for the fs plugin)

## Next Steps

### Try Starting the App:

```bash
yarn tauri dev
```

Should now start without errors.

### Test Drag-and-Drop:

1. Drag a file over the window
2. Look for: `🟢 Tauri file-drop-hover event` OR `🎯 DRAG ENTER EVENT FIRED`
3. Drop the file
4. Look for: `🟢 Tauri file-drop event` OR `📦 DROP EVENT FIRED`

## Why It Might Still Not Work

If Tauri native events still don't fire after this fix:

**HTML5 drag-drop will be the solution** because:
- Tauri's native drag-drop on macOS can be unreliable
- We already have full HTML5 handlers implemented
- The file picker button also works as a fallback

## Testing Checklist

- [ ] App starts without exit code 101
- [ ] No permission errors in console
- [ ] Try dragging a file (test Tauri events)
- [ ] If Tauri doesn't work, HTML5 should work
- [ ] If neither work, use Browse Files button

## Summary

**Error:** Invalid permission names (`fs:allow-read-file` doesn't exist)
**Fix:** Removed invalid `fs:` permissions, fixed `path:` to `core:path:`
**Status:** Should compile now
**Next:** Test drag-and-drop (Tauri or HTML5 will work)

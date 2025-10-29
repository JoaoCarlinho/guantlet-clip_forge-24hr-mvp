# Drag-and-Drop Debug Instructions

## Changes Made

I've added comprehensive debug logging to the FileDropZone component to diagnose why drag-and-drop is not working.

### Debug Logging Added:

1. **Environment Detection** - Logs whether running in Tauri or Browser mode
2. **Tauri Event Listeners** - Logs when Tauri listeners are registered
3. **HTML5 Drag Events** - Logs all drag events (dragenter, dragover, dragleave, drop)
4. **Visual Indicator** - Added a temporary red dashed border to the drop zone

## Testing Instructions

### Step 1: Start the Application
```bash
npm run dev
# or
yarn dev
```

### Step 2: Open Browser Console
- Open the application
- Open DevTools (F12 or Cmd+Option+I on Mac)
- Go to the Console tab

### Step 3: Check Initial Logs

You should see logs like:
```
🔍 FileDropZone mounted, checking environment...
🔍 window.__TAURI__ exists: true/false
🔍 Running in: TAURI MODE / BROWSER MODE
```

**If in TAURI MODE**, you should also see:
```
⚙️ Setting up Tauri file drop listeners...
✅ Tauri drag-over listener registered
✅ Tauri drop listener registered
✅ Tauri drag-drop listener registered
```

**If in BROWSER MODE**, you should see:
```
ℹ️ Tauri not detected - using HTML5 drag-and-drop only
```

### Step 4: Test Drag-and-Drop

1. **Find a video file** (MP4 or MOV)
2. **Drag the file over the application window**
3. **Watch the console for logs**

#### Expected Logs for SUCCESSFUL drag-and-drop:

**When you start dragging over the window:**
```
🎯 DRAG ENTER EVENT FIRED {dragCounter: 0, hasItems: true, itemsLength: 1, types: ["Files"]}
✅ Setting isDragging to TRUE
🔄 DRAG OVER EVENT FIRED
🔄 DRAG OVER EVENT FIRED
... (many drag over events)
```

**When you drop the file:**
```
📦 DROP EVENT FIRED {filesCount: 1, types: ["Files"]}
📁 Dropped 1 file(s): ["your-video.mp4"]
Processing file: your-video.mp4, type: video/mp4, size: XX.XX MB
✓ Added clip: your-video.mp4 (XXX.XXs)
```

#### What to Look For:

1. **NO LOGS AT ALL** when dragging?
   - The FileDropZone component is not receiving events
   - Possible causes:
     - Component is covered by another element
     - CSS `pointer-events: none` on parent
     - Tauri window config issue

2. **Logs appear but `hasItems: false`**?
   - Drag events are firing but no files detected
   - Possible causes:
     - Dragging something other than files
     - Tauri security restrictions

3. **Logs appear for DRAG ENTER but not DROP**?
   - Events are firing but drop is prevented
   - Possible causes:
     - Browser default behavior not prevented
     - Event propagation issue

4. **Tauri events not registering** (in Tauri mode)?
   - Check `src-tauri/tauri.conf.json` has `"dragDropEnabled": true`
   - Tauri API might not be loaded

### Step 5: Visual Verification

You should see a **RED DASHED BORDER** around the drop zone area. This confirms:
- The FileDropZone component is rendering
- The component is visible and taking up space

If you **don't see the red border**:
- The FileDropZone is not being rendered
- Check if `clips.length > 0` (VideoPlayer shows the drop zone only when no clips)

### Step 6: Test Different Scenarios

1. **Drag from Desktop** - Drag a video file from your desktop
2. **Drag from Finder/Explorer** - Drag from file manager
3. **Multiple Files** - Drag multiple video files at once
4. **Non-Video Files** - Drag a text file (should be rejected with warning)

## Common Issues and Solutions

### Issue: No events firing at all

**Check:**
1. Is the red border visible? If not, the component isn't rendered
2. Are you running `npm run dev` or `tauri dev`?
3. Is the browser console showing the initial mount logs?

**Solution:**
- If no mount logs, the component isn't mounting - check App.tsx routing
- If red border not visible, the VideoPlayer might be showing the video instead of the drop zone

### Issue: Events fire but drop doesn't work

**Check the console for:**
- Are all event handlers being called?
- Does the drop event fire?
- Are there any errors after the drop event?

**Solution:**
- Check if `e.preventDefault()` is being called
- Check if files array is empty in drop handler

### Issue: Works in browser but not Tauri

**Check:**
1. `window.__TAURI__` exists (should be `true` in Tauri)
2. Tauri event listeners are registered
3. `dragDropEnabled: true` in tauri.conf.json

**Solution:**
- If Tauri events not registering, try `tauri dev` instead of `npm run dev`
- Check Tauri configuration
- Try using Tauri v2 drag-drop API

## Next Steps

Based on the console output, we can determine:

1. **If events aren't firing** → Component rendering issue or CSS blocking
2. **If events fire but files are empty** → Tauri/browser security restriction
3. **If everything logs correctly** → Issue is in the file processing logic

Please run the application, test drag-and-drop, and share:
1. Screenshot of the console logs
2. Whether you see the red border
3. What mode it's running in (Tauri or Browser)
4. Any error messages

## Removing Debug Code

Once we've identified the issue, we can remove:
1. All the `console.log` statements
2. The inline `style` prop with the red border

These are only for debugging purposes.

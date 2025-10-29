# VIDEO PLAYBACK TROUBLESHOOTING

## Current Status

Based on the latest logs, **the video IS loading successfully**:

### Evidence from Desktop Console (logs/desktop_console.md)
```
Line 217: 📹 Setting up video for clip: "ScreenRecording_10-23-2025 13-54-38_1.MP4"
Line 218: 📹 Video source: "blob:http://localhost:1420/0534730d-3001-48cf-a1a9-af59cf929e58"
Line 219: 📹 Video element exists: true
Line 236: 📹 Video onLoadStart (inline)
Line 237: ✅ Video load started
Line 238: ✅ Video metadata loaded
Line 240: ✅ Video onLoadedData (inline)
Line 241: ✅ Video data loaded successfully
Line 242: ✅ Video can play
```

**Conclusion:** Video loading works perfectly. The issue is **visibility/rendering**, not loading.

---

## Root Cause Analysis

The problem is **NOT** that the video isn't loading - it's that:
1. The video element may not be visible in the UI
2. The video wrapper may not have proper dimensions
3. You may be looking at old logs from before the fix

---

## IMPORTANT: You MUST Restart the Dev Server!

The logs you provided show line numbers that **don't match** the current code:
- Your logs show: `VideoPlayer.tsx, line 14`
- Current code has debug logs at: `line 16`

**This means you're running OLD CODE before my fixes!**

### How to Restart:

1. **Stop both servers:**
   ```bash
   # Press Ctrl+C in the terminal running the app
   # Or close the terminal windows
   ```

2. **Kill any lingering processes:**
   ```bash
   # On macOS/Linux:
   killall node
   pkill -f "tauri dev"
   pkill -f "vite"

   # Or find and kill specific processes:
   ps aux | grep -E "(vite|tauri|node)" | grep -v grep
   # Then kill the PIDs shown
   ```

3. **Clear any caches:**
   ```bash
   # Clear Vite cache
   rm -rf node_modules/.vite

   # Clear Tauri build cache (optional)
   cd src-tauri
   cargo clean
   cd ..
   ```

4. **Restart the application:**

   **For BROWSER mode:**
   ```bash
   npm run dev
   ```

   **For DESKTOP mode:**
   ```bash
   yarn tauri dev
   ```

5. **Wait for full startup:**
   - Wait for "VITE ready in X ms"
   - Wait for "Running `target/debug/app`" (desktop only)
   - Open the app in browser or wait for desktop window

6. **Upload a video and check NEW logs:**
   - The first log should say: `📂 FILE DROP ZONE WILL BE SHOWN`
   - After uploading: `✅ VIDEO WRAPPER WILL BE RENDERED`
   - Then: `📹 Setting up video for clip: ...`

---

## What I Changed

### Fix #1: Proper Display Control
**File:** [src/components/Player/VideoPlayer.tsx:155-157](src/components/Player/VideoPlayer.tsx#L155-L157)

```tsx
<div style={{ display: currentClip ? 'none' : 'block', height: '100%', width: '100%' }}>
  <FileDropZone />
</div>
```

**Effect:** FileDropZone is completely hidden when video exists (not just overlaid)

### Fix #2: Explicit Video Wrapper Sizing
**File:** [src/components/Player/VideoPlayer.tsx:161-169](src/components/Player/VideoPlayer.tsx#L161-L169)

```tsx
<div
  className="video-wrapper"
  style={{
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%'
  }}
>
```

**Effect:** Video wrapper explicitly takes full available space

### Fix #3: Enhanced Debug Logging
**File:** [src/components/Player/VideoPlayer.tsx:27-31](src/components/Player/VideoPlayer.tsx#L27-L31)

```tsx
if (currentClip) {
  console.log('✅ VIDEO WRAPPER WILL BE RENDERED');
} else {
  console.log('📂 FILE DROP ZONE WILL BE SHOWN');
}
```

**Effect:** Clearly shows which UI is being rendered

---

## Testing Steps

### Step 1: Verify Code is Running

After restarting, open the browser/desktop app and check console:

**Expected on app load (before uploading video):**
```
📂 FILE DROP ZONE WILL BE SHOWN
🔍 FileDropZone mounted, checking environment...
🎯 Setting up window-level drag handlers
✅ Window-level drag handlers registered
```

### Step 2: Upload a Video

Drag-and-drop or use "Browse Files" button.

**Expected logs:**
```
📦 DROP EVENT FIRED
📁 Dropped 1 file(s): ["video.mp4"]
Processing file: video.mp4, type: video/mp4, size: X MB
✓ Added clip: video.mp4 (X.XXs)
🎬 VideoPlayer render: {clipsCount: 1, hasCurrentClip: true, ...}
✅ VIDEO WRAPPER WILL BE RENDERED  ← This is the KEY log!
📹 Setting up video for clip: video.mp4
📹 Video source: blob:http://localhost:1420/...
📹 Video element exists: true
✅ Video load started
✅ Video metadata loaded
✅ Video data loaded successfully
✅ Video can play
```

### Step 3: Visual Verification

**What you SHOULD see:**
1. ✅ FileDropZone disappears
2. ✅ Video player appears with video loaded
3. ✅ Video controls visible (play, pause, scrubber)
4. ✅ Video info panel showing:
   - Clip name
   - Full duration
   - Trim points
5. ✅ Video can be played using controls

**What you should NOT see:**
- ❌ Blank screen
- ❌ FileDropZone still visible with video controls
- ❌ Red debug border (removed in FileDropZone.tsx)
- ❌ Layout issues or overlapping elements

---

## If Video is STILL Not Visible

### Check 1: Verify Video Wrapper is Rendered

Open browser DevTools (F12) → Elements/Inspector:

Look for:
```html
<div class="video-wrapper" style="display: flex; flex-direction: column; height: 100%; width: 100%;">
  <video class="video-element" src="blob:http://localhost:1420/..." controls>
    ...
  </video>
</div>
```

**If you DON'T see this:** The component isn't rendering (check React errors)

**If you DO see this but video not visible:** Check computed styles:

1. Select the `<video>` element in DevTools
2. Check "Computed" tab
3. Look for:
   - `display:` should NOT be `none`
   - `visibility:` should NOT be `hidden`
   - `opacity:` should NOT be `0`
   - `width:` and `height:` should have actual pixel values
   - `z-index:` should not be negative

### Check 2: Verify Parent Container Has Height

The video player needs its parent to have height. Check:

```html
<section class="player-section">  <!-- Should have height -->
  <div class="video-player-container">  <!-- Should have height: 100% -->
    <div class="video-wrapper">  <!-- Should have height: 100% -->
      <video>...</video>
    </div>
  </div>
</section>
```

In DevTools, select `.player-section` and check computed height. It should be > 0px.

### Check 3: Console Errors

Check for any React errors or warnings:
- Blob URL errors
- Security/CORS errors (shouldn't happen with local blobs)
- React hydration errors
- CSS-in-JS errors

### Check 4: Video Element State

In browser console, run:
```javascript
const video = document.querySelector('video');
console.log({
  src: video.src,
  readyState: video.readyState,  // Should be 4 (HAVE_ENOUGH_DATA)
  networkState: video.networkState,  // Should be 1 (NETWORK_IDLE)
  error: video.error,  // Should be null
  currentTime: video.currentTime,
  duration: video.duration,
  paused: video.paused
});
```

### Check 5: CSS Issues

Verify no conflicting CSS. In DevTools, check the video element's styles for:
- No `display: none`
- No `height: 0` or `max-height: 0`
- No `transform: scale(0)`
- No negative margins pushing it offscreen
- No `clip-path` hiding it

---

## Common Issues and Solutions

### Issue: Video loads but screen is blank

**Cause:** Parent container has no height or video wrapper is not taking space

**Solution:** Check `.player-section` in App.tsx has explicit height:
```css
.player-section {
  height: 100%;  /* or explicit px value */
  min-height: 400px;  /* fallback */
}
```

### Issue: I see FileDropZone AND video at the same time

**Cause:** Old code still running (display: none not applied)

**Solution:**
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Restart dev server
3. Clear browser cache

### Issue: Video wrapper shows but video element is invisible

**Cause:** Video element CSS may be hiding it

**Solution:** Add inline style override:
```tsx
<video
  ref={videoRef}
  className="video-element"
  style={{ display: 'block', width: '100%', height: 'auto' }}  // Override any hiding CSS
  controls
  ...
>
```

### Issue: Logs say video loads but I can't click play button

**Cause:** Video controls may be hidden or overlapped

**Solution:** Check z-index and pointer-events:
```tsx
<video
  style={{
    zIndex: 100,  // Ensure it's on top
    pointerEvents: 'auto'  // Ensure it's clickable
  }}
  ...
>
```

---

## Debugging Checklist

After restarting, verify each item:

- [ ] Server restarted and no old processes running
- [ ] Browser/desktop app fully refreshed
- [ ] Console shows NEW log format: `📂 FILE DROP ZONE WILL BE SHOWN` (before upload)
- [ ] Console shows: `✅ VIDEO WRAPPER WILL BE RENDERED` (after upload)
- [ ] Console shows all video load success messages
- [ ] No JavaScript errors in console
- [ ] DevTools shows video-wrapper div with proper styles
- [ ] DevTools shows video element with src attribute
- [ ] Video element has dimensions (width/height) in DevTools
- [ ] Video element readyState is 4 (HAVE_ENOUGH_DATA)
- [ ] Video controls are visible in UI
- [ ] Can click on video controls

---

## If All Else Fails

### Nuclear Option: Clean Rebuild

```bash
# Stop all servers
killall node
pkill -f tauri

# Clean everything
rm -rf node_modules
rm -rf node_modules/.vite
rm -rf dist
cd src-tauri
cargo clean
cd ..

# Reinstall
npm install  # or yarn install

# Rebuild and run
npm run dev  # browser
# OR
yarn tauri dev  # desktop
```

### Provide These Details for Further Troubleshooting:

1. **NEW logs** after restart showing:
   - The `✅ VIDEO WRAPPER WILL BE RENDERED` message
   - All video load messages

2. **Screenshot** of:
   - Browser/desktop app showing the "not working" state
   - DevTools Elements tab showing DOM structure
   - DevTools Console showing logs

3. **Browser DevTools check:**
   ```javascript
   // Run this in console and paste output:
   const video = document.querySelector('video');
   const wrapper = document.querySelector('.video-wrapper');
   const container = document.querySelector('.video-player-container');

   console.log('Video:', {
     exists: !!video,
     src: video?.src,
     visible: video ? window.getComputedStyle(video).display !== 'none' : false,
     dimensions: video ? {
       width: video.offsetWidth,
       height: video.offsetHeight
     } : null
   });

   console.log('Wrapper:', {
     exists: !!wrapper,
     display: wrapper ? window.getComputedStyle(wrapper).display : null,
     dimensions: wrapper ? {
       width: wrapper.offsetWidth,
       height: wrapper.offsetHeight
     } : null
   });

   console.log('Container:', {
     exists: !!container,
     dimensions: container ? {
       width: container.offsetWidth,
       height: container.offsetHeight
     } : null
   });
   ```

4. **What specifically happens:**
   - Do you see FileDropZone or blank screen?
   - Can you see any part of video controls?
   - Does clicking where video should be do anything?
   - Does it work in browser mode but not desktop (or vice versa)?

---

## Summary

**The video IS loading successfully.** The issue is purely visual/layout.

**Most likely cause:** You're running old code. **MUST restart dev server.**

**After restart:** Look for the new log messages `✅ VIDEO WRAPPER WILL BE RENDERED` to confirm new code is running.

**If still not working after restart:** Use DevTools to inspect DOM and check which of the common issues above applies.

The video element is definitely being created, loaded, and ready to play. We just need to make sure it's visible and properly sized in the UI.

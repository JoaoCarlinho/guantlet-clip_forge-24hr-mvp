# VIDEO VISIBILITY DEBUG - High Contrast Markers

## What I Changed

Added highly visible borders and backgrounds to make it absolutely clear where the video element is rendering:

### Video Wrapper
```typescript
style={{
  backgroundColor: '#0000ff',    // BLUE background
  border: '5px solid yellow',    // YELLOW border
  overflow: 'visible',           // Changed from 'hidden'
  ...
}}
```

### Video Element
```typescript
style={{
  width: '800px',
  height: '600px',
  backgroundColor: '#ff0000',    // RED background
  border: '10px solid lime',     // LIME GREEN border
  ...
}}
```

## What You Should See After Restart

### Scenario 1: Video Element is Visible
**You will see:**
- A large **BLUE rectangle** with **YELLOW border** (video-wrapper)
- Inside it, an 800x600px area with **LIME GREEN border** and **RED background** (video element)
- If video content is rendering, it will show on top of the red background
- If video content is NOT rendering, you'll see solid red with lime border

**This means:** Video element is being rendered in the correct location

### Scenario 2: Only Blue/Yellow Rectangle Visible
**You will see:**
- **BLUE rectangle** with **YELLOW border** (video-wrapper)
- But NO lime green border or red area inside

**This means:** Video wrapper renders but video element doesn't render (React conditional rendering issue)

### Scenario 3: Nothing Visible
**You see:**
- No blue, no yellow, no lime, no red
- Just the normal dark background

**This means:**
- Either `currentClip` is falsy so video-wrapper isn't rendered
- Or video-wrapper is rendering with 0 dimensions
- Or it's positioned outside viewport

## Testing Steps

### Step 1: Restart
```bash
killall node
pkill -f "tauri dev"
npm run dev       # browser
# OR
yarn tauri dev    # desktop
```

### Step 2: Upload Video
Drag-and-drop or browse for a video file.

### Step 3: Look for Colors

**Scan your entire screen for:**
- 🟦 BLUE rectangles
- 🟨 YELLOW borders
- 🟢 LIME GREEN borders
- 🟥 RED backgrounds

**Even if they're in the wrong place, we need to know if they're rendering AT ALL.**

### Step 4: Report What You See

**Option A: "I see blue rectangle with yellow border and inside it lime green border with red background"**
→ Video element is rendering! The issue is video CONTENT not displaying

**Option B: "I see blue rectangle with yellow border but nothing inside it"**
→ Video wrapper renders but video element doesn't

**Option C: "I don't see any colors at all"**
→ Video wrapper isn't rendering or is completely invisible

**Option D: "I see the colors but they're in a weird location (like bottom of page)"**
→ Layout issue causing misplacement

## Browser DevTools Check

If you don't see any colors, open DevTools and check:

```javascript
// Check if elements exist
const wrapper = document.querySelector('.video-wrapper');
const video = document.querySelector('video');

console.log({
  wrapperExists: !!wrapper,
  videoExists: !!video,
  wrapperDisplay: wrapper ? window.getComputedStyle(wrapper).display : null,
  wrapperVisibility: wrapper ? window.getComputedStyle(wrapper).visibility : null,
  wrapperBgColor: wrapper ? window.getComputedStyle(wrapper).backgroundColor : null,
  videoBorder: video ? window.getComputedStyle(video).border : null,
  videoBgColor: video ? window.getComputedStyle(video).backgroundColor : null
});
```

**Expected if rendering:**
```
wrapperExists: true
videoExists: true
wrapperDisplay: 'flex'
wrapperVisibility: 'visible'
wrapperBgColor: 'rgb(0, 0, 255)'  // blue
videoBorder: '10px solid rgb(0, 255, 0)'  // lime
videoBgColor: 'rgb(255, 0, 0)'  // red
```

## What The Colors Tell Us

### Red Background Visible
- Video element is 800x600px
- Rendering in correct location
- BUT video content is not drawing
- **Problem:** Video decoder/renderer not working

### Lime Border Visible But No Red
- Video element exists
- Has dimensions
- But background not showing
- **Problem:** CSS being overridden or content filling entire area

### Yellow Border Visible But No Lime/Red
- Video wrapper renders
- But video element not being created
- **Problem:** React render condition failing or video element unmounting

### No Colors At All
- Components not rendering
- **Problem:** `currentClip` is falsy or components not in DOM

## Next Steps Based on Results

### If You See All Colors
**Video element is fine. Problem is video content rendering.**

Try:
1. Different video file
2. Different video codec (H.264 MP4)
3. Check browser console for codec errors
4. Try disabling hardware acceleration

### If You See Some Colors
**Partial rendering. Check which elements exist.**

Try:
1. Check React DevTools component tree
2. Look for conditional rendering bugs
3. Check if video ref is attached correctly

### If You See No Colors
**Nothing rendering at all.**

Try:
1. Check if `currentClip` has a value
2. Check console for React errors
3. Verify component is mounted
4. Check if FileDropZone is hiding video-wrapper

## Reverting Colors

Once we identify the issue, you can remove the debug colors:

```typescript
// Video wrapper - remove these:
backgroundColor: '#0000ff',  // DELETE
border: '5px solid yellow',  // DELETE

// Video element - change these back:
backgroundColor: '#000',     // Change from #ff0000
border: undefined,           // Change from '10px solid lime'
```

## Summary

**Goal:** Make video element IMPOSSIBLE to miss

**Method:** Bright contrasting colors on all containers

**What to report:**
1. Which colors do you see (if any)?
2. Where on the screen are they?
3. What's the size of the colored areas?
4. Screenshot if possible

This will definitively tell us:
- ✅ Is the video element rendering?
- ✅ Where is it located?
- ✅ What are its dimensions?
- ✅ Is the problem layout or video content?

---

**Please restart, upload a video, and tell me exactly what colors you see!** 🎨

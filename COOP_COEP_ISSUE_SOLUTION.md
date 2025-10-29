# COOP/COEP Headers Conflict with getDisplayMedia()

## The Real Problem

The error "Media devices API not available" appearing in **Chrome browser** is caused by a **conflict between security headers**:

### Current Configuration ([vite.config.ts](vite.config.ts))
```typescript
headers: {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
}
```

### Why These Headers Exist
These headers enable `SharedArrayBuffer`, which is **required for FFmpeg.wasm** to convert WebM videos to MP4.

### The Conflict
**`Cross-Origin-Embedder-Policy: require-corp`** blocks `getDisplayMedia()` because:
1. The browser's screen picker UI is cross-origin
2. COEP requires all resources to explicitly opt-in via CORP headers
3. The browser UI cannot provide these headers

## Evidence from Logs

The log file contains:
```
Media devices API not available. If you are using the desktop app,
please try the browser version instead: npm run dev, then open
http://localhost:1420 in Chrome or Edge.
```

But this error **shows in the browser**, not the desktop app, indicating the API check is failing even though it should be available.

## The Dilemma

```
┌─────────────────────────────────────────────────────┐
│           Need Both Features:                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  COOP/COEP Headers ON                              │
│    ✅ FFmpeg.wasm works (WebM → MP4 conversion)    │
│    ❌ getDisplayMedia() blocked                     │
│                                                     │
│  COOP/COEP Headers OFF                             │
│    ✅ getDisplayMedia() works (screen capture)     │
│    ❌ FFmpeg.wasm blocked (no MP4 conversion)      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Solution Options

### Option 1: Remove COOP/COEP Headers (Recommended)
**Trade-off**: Lose FFmpeg.wasm MP4 conversion, keep screen recording

```typescript
// vite.config.ts
server: {
  port: 1420,
  strictPort: true,
  // Remove these headers:
  // headers: {
  //   "Cross-Origin-Embedder-Policy": "require-corp",
  //   "Cross-Origin-Opener-Policy": "same-origin",
  // },
}
```

**Result**:
- ✅ Screen recording works in browser
- ✅ Users get WebM files (still usable)
- ❌ No automatic MP4 conversion in browser
- ✅ Desktop app still gets MP4 (native recording)

### Option 2: Use Service Worker with Conditional Headers
**Trade-off**: Complex setup, but can enable both features conditionally

Create a service worker that:
1. Serves the app **without** COOP/COEP for initial load
2. Enables COOP/COEP **only** when loading FFmpeg.wasm
3. Uses separate iframe for FFmpeg processing

**Result**:
- ✅ Screen recording works
- ✅ FFmpeg works (in separate context)
- ⚠️ Complex implementation
- ⚠️ Requires service worker setup

### Option 3: Split Into Two Modes
**Trade-off**: User chooses which feature they need

Two separate URLs:
- `http://localhost:1420/` - No headers, screen recording works
- `http://localhost:1420/ffmpeg` - With headers, FFmpeg works

**Result**:
- ✅ Both features available
- ❌ User must manually switch
- ⚠️ Confusing UX

### Option 4: Use Chrome Extension
**Trade-off**: Additional installation, but full features

Create a Chrome extension that:
1. Provides screen capture via `chrome.tabCapture` or `chrome.desktopCapture`
2. No COOP/COEP restrictions
3. Can still use FFmpeg.wasm

**Result**:
- ✅ Both features work
- ❌ Requires extension installation
- ❌ Only works in Chrome/Edge

### Option 5: Skip MP4 Conversion (Simplest)
**Trade-off**: Users get WebM files instead of MP4

```typescript
// Just remove the conversion step
// Users download WebM directly
// Most video players support WebM nowadays
```

**Result**:
- ✅ Screen recording works
- ✅ Simple solution
- ⚠️ WebM files (not ideal for all users)
- ✅ Can convert offline if needed

## Recommended Solution

### **Implement Option 1 + Option 5: Remove Headers, Skip Conversion**

**Rationale**:
1. **Screen recording is core functionality** - Must work
2. **WebM is acceptable** - Modern players support it
3. **Desktop app provides MP4** - Users who need MP4 can use desktop version
4. **Simple and reliable** - No complex workarounds

### Implementation

1. **Remove COOP/COEP headers** from vite.config.ts
2. **Skip FFmpeg conversion** in browser
3. **Keep conversion** in desktop app (native recording)
4. **Show format info** to users

## Implementation Plan

### Step 1: Update Vite Config

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    // Remove COOP/COEP headers to allow getDisplayMedia()
    // headers: {
    //   "Cross-Origin-Embedder-Policy": "require-corp",
    //   "Cross-Origin-Opener-Policy": "same-origin",
    // },
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
});
```

### Step 2: Update Recording Controls

```typescript
// RecordingControls.tsx
const handleStopRecording = async () => {
  const clip = await recorder.stopRecording();
  if (clip) {
    // Check if we're in browser or desktop
    const isBrowser = !('__TAURI__' in window);

    if (isBrowser) {
      // Browser: Download WebM directly (no conversion)
      console.log('📦 Browser mode: Downloading WebM');
      const a = document.createElement('a');
      a.href = clip.url;
      a.download = `recording-${timestamp}.webm`;
      a.click();
    } else {
      // Desktop: MP4 from native recording
      console.log('📦 Desktop mode: MP4 from native recording');
      // ... existing code
    }
  }
};
```

### Step 3: Add User Notification

```typescript
// Show format info to user
{isBrowser && (
  <div className="format-notice">
    ℹ️ Browser recordings are saved as WebM format.
    For MP4, use the desktop app.
  </div>
)}
```

### Step 4: Update Documentation

```markdown
## Browser vs Desktop

| Feature | Browser | Desktop |
|---------|---------|---------|
| Screen Recording | ✅ WebM | ✅ MP4 |
| Format | WebM (VP9) | MP4 (H.264) |
| Conversion | Not available* | Built-in |
| Quality | High | High |

*COOP/COEP headers required for FFmpeg.wasm conflict with getDisplayMedia()
```

## Alternative: Hybrid Approach

If MP4 conversion is **absolutely required** in browser:

### Use OffscreenCanvas + Worker

```typescript
// Record to WebM
// Upload to server for conversion
// OR use external service (cloudconvert, etc.)
// OR provide offline conversion tool
```

## Testing After Fix

### Browser Test
```bash
npm run dev
# Open http://localhost:1420
# Click Start Recording
# Should see browser's screen picker ✅
# Recording should work ✅
# Download as WebM ✅
```

### Desktop Test
```bash
npm run tauri dev
# Click Start Recording
# Should use native FFmpeg ✅
# Download as MP4 ✅
```

## Summary

**Root Cause**: COOP/COEP headers block getDisplayMedia()

**Best Solution**: Remove headers, accept WebM in browser, MP4 in desktop

**Trade-off**: Lose browser-based MP4 conversion, keep screen recording

**Result**: Screen recording works everywhere, format depends on platform

## Decision Matrix

| Solution | Screen Recording | MP4 Conversion | Complexity | UX |
|----------|-----------------|----------------|------------|-----|
| Remove Headers | ✅ | ❌ | ⭐ | ⭐⭐⭐ |
| Service Worker | ✅ | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Split Modes | ✅ | ✅ | ⭐⭐ | ⭐ |
| Extension | ✅ | ✅ | ⭐⭐⭐⭐ | ⭐⭐ |
| Skip Conversion | ✅ | ❌ | ⭐ | ⭐⭐⭐ |

**Recommendation**: Remove Headers + Skip Conversion (⭐ complexity, ⭐⭐⭐ UX)

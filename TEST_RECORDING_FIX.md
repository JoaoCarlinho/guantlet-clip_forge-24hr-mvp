# Testing the Recording Fix

## What Was Changed

### The Problem
The hook was checking `inTauri AND !hasMediaAPI`, but in Tauri's WebView, the Media Devices API might partially exist, causing the detection to fail.

### The Fix
Changed [useRecorder.ts:56](src/hooks/useRecorder.ts#L56) to:
```typescript
// OLD (buggy):
const useNative = inTauri && !hasMediaAPI;

// NEW (fixed):
const useNative = inTauri;  // ALWAYS use native in Tauri
```

**Rationale**: If we're running in Tauri (desktop app), we should ALWAYS use native FFmpeg recording, regardless of whether Media API appears to be available. The Media API in Tauri's WebView is unreliable.

## How to Test

### Step 1: Restart the Desktop App

```bash
# Stop the current app (Ctrl+C if running)

# Clean start
npm run dev
```

### Step 2: Check Console Logs

**When the app starts**, you should see in console:

```
🔍 Recording mode detection:
  - Running in Tauri: true
  - Media Devices API available: <doesn't matter>
  - Using native recording: true
✅ Using NATIVE recording mode (FFmpeg-based)
```

**Key Point**: `Using native recording: true` regardless of Media API status

### Step 3: Test Recording

1. Click **"Start Recording"**
2. **Check console** - should see:
   ```
   🎬 Starting native recording with config: {...}
   📡 Invoking start_native_recording...
   ```

3. If you see this instead, Rust backend is not built:
   ```
   ❌ Failed to invoke: start_native_recording
   ```

### Step 4: If Rust Backend Not Built

The Tauri commands need to be compiled:

```bash
# Option 1: Let npm handle it
pkill -f tauri
npm run dev

# Option 2: Manual Rust build (if you have cargo)
cd src-tauri
cargo build
cd ..
npm run dev
```

## Expected Behavior

### ✅ Success (What You Should See)

```
Console logs:
  🔍 Recording mode detection:
    - Running in Tauri: true
    - Using native recording: true
  ✅ Using NATIVE recording mode (FFmpeg-based)

Click "Start Recording":
  🎬 Starting native recording with config: {...}
  📡 Invoking start_native_recording...
  ✅ Native recording started: /tmp/clip_forge_recording_...mp4
  ✅ Recording state updated to isRecording: true

Recording in progress...

Click "Stop Recording":
  ⏹ Stopping native recording
  📡 Invoking stop_native_recording...
  ✅ Native recording stopped
  📁 Reading recorded file...
  ✅ Blob created: 15234560 bytes
  ⬇️ MP4 download triggered
```

### ❌ If You Still See the Error

```
❌ Screen capture failed: Media devices API not available...
```

This means the hook is STILL returning the browser recorder. Possible causes:

1. **Old code cached** - The file change hasn't been loaded
   - Solution: Hard refresh or restart dev server

2. **`__TAURI__` not in window** - App not actually running in Tauri
   - Solution: Make sure `npm run dev` opens a desktop window, not browser

3. **Hook not re-rendering** - Component using old instance
   - Solution: Add a `key` prop to force remount

## Debug Steps

### Check 1: Is `__TAURI__` Available?

Add this to [RecordingControls.tsx](src/components/Recording/RecordingControls.tsx) temporarily:

```typescript
useEffect(() => {
  console.log('🔍 DEBUG: __TAURI__ in window?', '__TAURI__' in window);
  console.log('🔍 DEBUG: window.__TAURI__:', (window as any).__TAURI__);
}, []);
```

**Expected**: `true` and an object (not undefined)

### Check 2: Is Hook Using Latest Code?

Add this to [useRecorder.ts:66](src/hooks/useRecorder.ts#L66):

```typescript
export const useRecorder = () => {
  console.log('🔍 DEBUG: useRecorder called, version 2.0'); // ← Add this
  const nativeRecorder = useNativeRecorder();
  // ...
```

**Expected**: See "version 2.0" in console (confirms file is loaded)

### Check 3: Which Recorder is Being Returned?

After line 76 in [useRecorder.ts](src/hooks/useRecorder.ts):

```typescript
if (useNative) {
  console.log('✅ Using NATIVE recording mode (FFmpeg-based)');
  console.log('🔍 DEBUG: Returning nativeRecorder:', nativeRecorder);
  return nativeRecorder;
}
```

**Expected**: See the native recorder object

## Common Issues

### Issue 1: "Command start_native_recording not found"

**Symptom**: Rust backend not compiled

**Fix**:
```bash
cd src-tauri
cargo build
cd ..
npm run dev
```

### Issue 2: Still Shows Browser Mode

**Symptom**: Console shows "Using BROWSER recording mode"

**Check**: Is app actually in Tauri?
```bash
# In console, run:
console.log('__TAURI__' in window);
```

If `false`, you're running in browser, not desktop app!

### Issue 3: FFmpeg Not Found

**Symptom**: Recording starts but fails immediately

**Fix**:
```bash
# Install FFmpeg
brew install ffmpeg

# Verify
ffmpeg -version
```

## Verification Checklist

- [ ] File change saved: [useRecorder.ts:56](src/hooks/useRecorder.ts#L56) shows `const useNative = inTauri;`
- [ ] Dev server restarted: Stopped and ran `npm run dev` again
- [ ] Desktop window opened: NOT a browser tab
- [ ] Console shows: "Using NATIVE recording mode"
- [ ] Console shows: "Running in Tauri: true"
- [ ] Click "Start Recording" → No Media API error
- [ ] Console shows: "Starting native recording"
- [ ] Recording completes and downloads MP4

## If All Else Fails

Share this output:

```bash
# 1. Check if file changed
cat src/hooks/useRecorder.ts | grep -A 2 "const useNative"

# 2. Check Tauri detection
npm run dev
# Then in console:
console.log('__TAURI__' in window)

# 3. Share console output when clicking "Start Recording"
```

## Success Criteria

✅ **No more "Media devices API not available" error**
✅ **Console shows "Using NATIVE recording mode"**
✅ **Recording starts with FFmpeg**
✅ **MP4 file downloads successfully**

---

**After this fix, the desktop app will ALWAYS use native FFmpeg recording, completely bypassing the Media Devices API!**

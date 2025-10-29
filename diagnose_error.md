# Diagnosing "Media devices API not available" Error

## The Error is Still Showing Because:

The native recorder code has been **created but not compiled/loaded** into the desktop app yet.

## Quick Fix Steps

### Option 1: Full Rebuild (Recommended)

```bash
# 1. Clean everything
rm -rf src-tauri/target
rm -rf dist
rm -rf node_modules/.vite

# 2. Build TypeScript
npm run build

# 3. This will trigger Rust compilation
npm run dev
```

### Option 2: Manual Check

Let me verify what's actually happening. Run this in your terminal:

```bash
# Check if native_recorder module compiles
cd src-tauri
cargo check --message-format=short 2>&1 | grep -i error
cd ..
```

## Why the Error Persists

The error message comes from [useRecorder.ts:122-126](src/hooks/useRecorder.ts#L122-L126):

```typescript
if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
  throw new Error(
    'Media devices API not available. ' +
    'If you are using the desktop app, please try the browser version instead...'
  );
}
```

This error is being thrown **before** the code reaches the native recorder detection logic because:

1. The detection logic at line 50-63 runs OUTSIDE the component
2. But the actual recording attempt happens INSIDE the browser recorder code path
3. The native recorder isn't being used yet

## The Real Issue

Looking at the code flow:

```typescript
// Line 50-63: Detection runs
const shouldUseNativeRecording = (): boolean => {
  const inTauri = '__TAURI__' in window;
  const hasMediaAPI = !!navigator?.mediaDevices?.getDisplayMedia;
  return inTauri && !hasMediaAPI;
};

// Line 65-75: Routing happens
export const useRecorder = () => {
  const nativeRecorder = useNativeRecorder();
  const useNative = shouldUseNativeRecording();

  if (useNative) {
    console.log('✅ Using NATIVE recording mode (FFmpeg-based)');
    return nativeRecorder; // ← Should return here
  }

  console.log('✅ Using BROWSER recording mode (Media Devices API)');
  // ... browser code that throws the error
};
```

**The problem**: The detection is working, but maybe:
1. `__TAURI__` is not in window (app not running in Tauri)
2. OR `navigator.mediaDevices` exists but `getDisplayMedia` doesn't
3. OR the hook is being called before Tauri initializes

## Debugging Steps

### 1. Check Console Logs

When you start the desktop app, you should see ONE of these:

```
✅ Using NATIVE recording mode (FFmpeg-based)
```
OR
```
✅ Using BROWSER recording mode (Media Devices API)
```

**Which one do you see?**

### 2. Add Debug Logging

If you don't see either message, add this temporarily to [useRecorder.ts:65](src/hooks/useRecorder.ts#L65):

```typescript
export const useRecorder = () => {
  console.log('🔍 useRecorder called');
  console.log('  - window.__TAURI__:', '__TAURI__' in window);
  console.log('  - navigator.mediaDevices:', !!navigator?.mediaDevices);
  console.log('  - getDisplayMedia:', !!navigator?.mediaDevices?.getDisplayMedia);

  const nativeRecorder = useNativeRecorder();
  const useNative = shouldUseNativeRecording();

  console.log('  - useNative result:', useNative);

  if (useNative) {
    console.log('✅ Using NATIVE recording mode (FFmpeg-based)');
    return nativeRecorder;
  }
  // ...
```

### 3. Check if App is Actually Running in Tauri

```bash
# Run the app
npm run dev

# Check the app title/window
# If it says "Vite + React" → Browser mode
# If it's a native window → Tauri mode
```

## Most Likely Causes

### Cause 1: Running in Browser Instead of Desktop App

**Symptom**: You're opening `http://localhost:1420` in a browser

**Solution**: Don't open browser! Let `npm run dev` open the native window

**Check**: `npm run dev` should launch a **desktop application window**, not a browser tab

### Cause 2: Tauri Not Building

**Symptom**: `npm run dev` opens browser instead of desktop window

**Solution**:
```bash
# Check if tauri CLI is available
npx tauri --version

# If not, install it
npm install @tauri-apps/cli

# Then run
npm run dev
```

### Cause 3: Old Build is Cached

**Symptom**: Changes not reflecting

**Solution**:
```bash
# Kill any running processes
pkill -f tauri
pkill -f vite

# Clean and rebuild
rm -rf src-tauri/target
npm run dev
```

## Quick Verification

Run this and tell me the output:

```bash
# Check what npm run dev actually does
npm run dev -- --help 2>&1 | head -20
```

If it shows Vite help instead of Tauri help, that's the issue!

## Expected Flow (Working Correctly)

```
1. Run: npm run dev
2. Tauri CLI starts
3. Rust backend compiles (includes native_recorder.rs)
4. Vite dev server starts
5. Desktop window opens (NOT browser)
6. App loads with __TAURI__ in window
7. useRecorder detects Tauri + no Media API
8. Returns nativeRecorder
9. Click "Start Recording"
10. Native FFmpeg recording starts ✅
```

## What to Check Right Now

1. **Run this command and share the output:**
   ```bash
   npm run dev 2>&1 | head -50
   ```

2. **Does it open:**
   - [ ] A **native desktop window** (correct)
   - [ ] A **browser tab** at localhost:1420 (wrong - that's browser mode)

3. **In the console, do you see:**
   - [ ] "Using NATIVE recording mode" (correct)
   - [ ] "Using BROWSER recording mode" (wrong - detection failed)
   - [ ] Neither message (wrong - hook not running)

## Next Steps

Please share:
1. Output of `npm run dev`
2. Whether it opens a desktop window or browser
3. Console logs when you click "Start Recording"

This will tell us exactly where the issue is!

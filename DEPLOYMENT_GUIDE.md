# 🚀 ClipForge Deployment Guide

**Complete instructions for building, deploying, and using ClipForge**

Version: 1.0.0
Last Updated: October 29, 2025

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Building the Desktop App](#building-the-desktop-app)
3. [Building for Browser](#building-for-browser)
4. [Chrome Browser Setup](#chrome-browser-setup)
5. [Distribution](#distribution)
6. [User Guide](#user-guide)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software

#### 1. Node.js and Yarn
```bash
# macOS
brew install node yarn

# Linux
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g yarn

# Windows
# Download from https://nodejs.org/
# Download Yarn from https://yarnpkg.com/
```

**Verify installation:**
```bash
node --version  # Should be v20+
yarn --version  # Should be 1.22+
```

#### 2. Rust and Cargo (For Desktop App Only)
```bash
# All platforms
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow on-screen instructions, then:
source $HOME/.cargo/env  # Linux/macOS
# or restart terminal

rustup update
```

**Verify installation:**
```bash
cargo --version  # Should be 1.70+
rustc --version
```

#### 3. FFmpeg (Required for Video Processing)
```bash
# macOS
brew install ffmpeg

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
# Extract to C:\ffmpeg
# Add C:\ffmpeg\bin to PATH environment variable
```

**Verify installation:**
```bash
ffmpeg -version  # Should show FFmpeg version info
```

#### 4. Tauri CLI (For Desktop App Only)
```bash
cargo install tauri-cli
```

**Verify installation:**
```bash
cargo tauri --version
```

### System Requirements

**Development Machine:**
- CPU: Quad-core 2.5 GHz+
- RAM: 8 GB+
- Disk: 5 GB free space (for build tools and dependencies)
- OS: macOS 10.15+, Windows 10+, or Linux (Ubuntu 20.04+)

**End User Machine (Desktop App):**
- CPU: Dual-core 2.0 GHz
- RAM: 4 GB
- Disk: 500 MB free space
- FFmpeg must be installed

**End User Machine (Browser):**
- Chrome 90+ or Edge 90+
- No installation required

---

## 🏗️ Building the Desktop App

### Step 1: Clone and Install Dependencies

```bash
git clone https://github.com/JoaoCarlinho/guantlet-clip_forge-24hr-mvp.git
cd guantlet-clip_forge-24hr-mvp
yarn install
```

### Step 2: Build the Application

```bash
npm run build
```

This will:
1. Compile TypeScript to JavaScript
2. Build React frontend with Vite
3. Compile Rust backend
4. Package into platform-specific bundles

**Build time:** 3-5 minutes (first build), 1-2 minutes (subsequent builds)

### Step 3: Locate Build Artifacts

#### macOS
```bash
# Application bundle
src-tauri/target/release/bundle/macos/ClipForge.app

# DMG installer (if enabled)
src-tauri/target/release/bundle/dmg/ClipForge_1.0.0_aarch64.dmg  # Apple Silicon
src-tauri/target/release/bundle/dmg/ClipForge_1.0.0_x64.dmg     # Intel
```

#### Linux
```bash
# AppImage
src-tauri/target/release/bundle/appimage/clip-forge_1.0.0_amd64.AppImage

# Deb package
src-tauri/target/release/bundle/deb/clip-forge_1.0.0_amd64.deb
```

#### Windows
```bash
# MSI installer
src-tauri/target/release/bundle/msi/ClipForge_1.0.0_x64_en-US.msi

# NSIS installer (if enabled)
src-tauri/target/release/bundle/nsis/ClipForge_1.0.0_x64-setup.exe
```

### Step 4: Test the Build

#### macOS
```bash
open src-tauri/target/release/bundle/macos/ClipForge.app
```

#### Linux
```bash
chmod +x src-tauri/target/release/bundle/appimage/clip-forge_1.0.0_amd64.AppImage
./src-tauri/target/release/bundle/appimage/clip-forge_1.0.0_amd64.AppImage
```

#### Windows
```bash
# Run the .msi installer or double-click the .exe
```

---

## 🌐 Building for Browser

### Step 1: Build Frontend Only

```bash
vite build
```

Output will be in the `dist/` folder.

### Step 2: Test Locally

```bash
npm run preview
```

Open http://localhost:4173 in Chrome

### Step 3: Deploy to Web Server

#### Option A: Static File Hosting (Netlify, Vercel, GitHub Pages)

```bash
# Deploy dist/ folder to your hosting provider
# Example with Netlify CLI:
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Option B: Self-Hosted (Nginx Example)

```nginx
server {
    listen 80;
    server_name clipforge.example.com;

    root /var/www/clipforge/dist;
    index index.html;

    # Required headers for screen capture API
    add_header Cross-Origin-Opener-Policy same-origin always;
    add_header Cross-Origin-Embedder-Policy require-corp always;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Important**: The browser version REQUIRES these headers for screen capture to work:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

---

## 🌐 Chrome Browser Setup

### For Development (localhost)

#### Method 1: Using Vite Dev Server (Recommended)

```bash
npm run dev
```

The Vite dev server automatically sets the required headers.

#### Method 2: CORS Extension (Quick Test)

1. Install "CORS Unblock" extension from Chrome Web Store
2. Enable it for localhost only
3. Run `npm run preview`

**Warning**: Never use CORS extensions in production!

### For Production Deployment

#### Required HTTP Headers

Your web server MUST send these headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

#### Configuration Examples

##### Nginx
```nginx
add_header Cross-Origin-Opener-Policy same-origin always;
add_header Cross-Origin-Embedder-Policy require-corp always;
```

##### Apache
```apache
Header always set Cross-Origin-Opener-Policy "same-origin"
Header always set Cross-Origin-Embedder-Policy "require-corp"
```

##### Netlify (`netlify.toml`)
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
```

##### Vercel (`vercel.json`)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        }
      ]
    }
  ]
}
```

#### Browser Compatibility

| Browser | Version | Screen Capture | Status |
|---------|---------|----------------|--------|
| Chrome | 90+ | ✅ Yes | Fully Supported |
| Edge | 90+ | ✅ Yes | Fully Supported |
| Firefox | 88+ | ⚠️ Limited | Partial Support |
| Safari | 13+ | ❌ No | Not Supported |

**Recommendation**: Use Chrome or Edge for the best experience.

### Testing Browser Setup

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for initialization logs:
   ```
   🔍 Recording mode detection:
     - Running in Tauri: false
     - Media Devices API available: true
     - Using native recording: false
   ✅ Using BROWSER recording mode (Media Devices API)
   ```

4. Try starting a recording
5. If you see permission prompts, grant them
6. If you see errors, check:
   - Headers are set correctly (Network tab → Response Headers)
   - Using a Chromium-based browser
   - Not blocking popups/permissions

---

## 📦 Distribution

### Desktop App Distribution

#### macOS

**Option 1: Direct Distribution (.app)**
1. Zip the `.app` bundle
   ```bash
   cd src-tauri/target/release/bundle/macos
   zip -r ClipForge-1.0.0-macOS.zip ClipForge.app
   ```
2. Distribute the zip file
3. Users: Extract and drag to Applications folder

**Option 2: DMG Installer (Recommended)**
1. Enable DMG in `tauri.conf.json`:
   ```json
   {
     "bundle": {
       "targets": ["dmg"]
     }
   }
   ```
2. Build: `npm run build`
3. Distribute the `.dmg` file from `src-tauri/target/release/bundle/dmg/`

**Option 3: Notarization (For Distribution Outside Mac App Store)**
```bash
# Sign the app
codesign --force --deep --sign "Developer ID Application: Your Name" ClipForge.app

# Create DMG
# ... create DMG ...

# Notarize
xcrun notarytool submit ClipForge.dmg \
  --apple-id your@email.com \
  --password app-specific-password \
  --team-id TEAMID
```

#### Linux

**Option 1: AppImage (Universal)**
```bash
# AppImage is already generated
chmod +x src-tauri/target/release/bundle/appimage/clip-forge_1.0.0_amd64.AppImage

# Distribute this file
# Users can run it directly without installation
```

**Option 2: Deb Package (Debian/Ubuntu)**
```bash
# Use the generated .deb file
src-tauri/target/release/bundle/deb/clip-forge_1.0.0_amd64.deb

# Users install with:
sudo dpkg -i clip-forge_1.0.0_amd64.deb
sudo apt-get install -f  # Fix dependencies
```

#### Windows

**MSI Installer (Recommended)**
```bash
# Distribute the generated MSI
src-tauri/target/release/bundle/msi/ClipForge_1.0.0_x64_en-US.msi

# Users: Double-click to install
```

### Browser App Distribution

1. **Build**: `vite build`
2. **Upload** `dist/` folder to your hosting provider
3. **Configure** headers (see Chrome Browser Setup section)
4. **Test** deployment in Chrome
5. **Share** the URL with users

### GitHub Releases (Recommended)

```bash
# Create a new release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# On GitHub:
# 1. Go to Releases → Draft a new release
# 2. Choose tag v1.0.0
# 3. Upload build artifacts:
#    - ClipForge.app.zip (macOS)
#    - clip-forge_1.0.0_amd64.AppImage (Linux)
#    - ClipForge_1.0.0_x64_en-US.msi (Windows)
# 4. Add release notes
# 5. Publish release
```

---

## 📖 User Guide

### Installing ClipForge (Desktop)

#### macOS
1. Download `ClipForge.app.zip` or `ClipForge.dmg`
2. Extract (if zip) and drag to Applications folder
3. Double-click to open
4. Grant screen recording permissions when prompted:
   - System Preferences → Security & Privacy → Screen Recording
   - Enable ClipForge
   - Restart the app

#### Linux
1. Download `clip-forge_1.0.0_amd64.AppImage`
2. Make executable: `chmod +x clip-forge_1.0.0_amd64.AppImage`
3. Run: `./clip-forge_1.0.0_amd64.AppImage`
4. Optional: Install AppImageLauncher for desktop integration

#### Windows
1. Download `ClipForge_1.0.0_x64_en-US.msi`
2. Double-click to install
3. Follow installation wizard
4. Launch from Start Menu

### Using ClipForge

#### 1. Recording Screen

**Desktop App:**
1. Click "Start Recording" button
2. Select options:
   - ✅ Screen (required)
   - [ ] Webcam (optional)
   - [ ] Audio (optional)
3. Click "Start Recording"
4. Record your content
5. Click "Stop Recording"
6. Recording appears on timeline automatically

**Browser:**
1. Open ClipForge in Chrome
2. Click "Start Recording"
3. Click "Allow" when prompted for screen capture
4. Select screen/window/tab to record
5. Click "Share"
6. Same recording process as desktop

#### 2. Editing Clips on Timeline

- **Add Clips**: Drag video files from your computer onto the timeline
- **Rearrange**: Drag clips left/right to change order
- **Trim**: Click clip → Drag blue handles at edges to trim
- **Delete**: Click clip → Press Delete key or click "Remove" button
- **Preview**: Click any clip to see it in the player above

#### 3. Exporting Video

1. Select Export Quality:
   - **Low**: Fast export, smaller file (good for drafts)
   - **Medium**: Balanced (recommended)
   - **High**: Best quality, larger file (final exports)

2. Click "Export X Clips" button

3. Review clip order in preview modal

4. Click "Start Export"

5. Choose save location

6. Wait for export to complete (progress bar shows status)

7. Click "Open File Location" to view your video

**Export Times (approximate):**
- Low: 0.5x realtime (10 min video → 5 min export)
- Medium: 1x realtime (10 min video → 10 min export)
- High: 2x realtime (10 min video → 20 min export)

---

## 🐛 Troubleshooting

### Desktop App Issues

#### "FFmpeg not found"
**Cause**: FFmpeg is not installed or not in PATH
**Solution**:
```bash
# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/
# Add to PATH
```

#### "Screen recording permission denied" (macOS)
**Cause**: macOS security settings
**Solution**:
1. System Preferences → Security & Privacy → Screen Recording
2. Unlock padlock (bottom left)
3. Check the box for ClipForge
4. Restart ClipForge

#### App won't open (macOS)
**Cause**: macOS Gatekeeper
**Solution**:
1. Right-click ClipForge.app → Open
2. Click "Open" in the dialog
3. Or: System Preferences → Security & Privacy → General → Click "Open Anyway"

#### "Cannot verify developer" (macOS)
**Cause**: App is not notarized
**Solution**:
```bash
# Remove quarantine attribute
xattr -cr ClipForge.app
```

### Browser Issues

#### "getDisplayMedia is not defined"
**Cause**: Missing CORS headers
**Solution**:
- Check server is sending required headers
- Use Chrome/Edge (not Safari/Firefox)
- Verify headers in DevTools Network tab

#### Recording button doesn't work
**Cause**: Permissions not granted
**Solution**:
1. Check browser permissions: chrome://settings/content
2. Allow camera/microphone/screen capture for your site
3. Try in Incognito mode to reset permissions

#### Export fails or produces corrupt video
**Cause**: Browser limitations
**Solution**:
- Use desktop app for best export results
- Try exporting smaller clips in browser
- Check available disk space

### Build Issues

#### "Cargo not found"
**Cause**: Rust not installed
**Solution**:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

#### TypeScript errors during build
**Cause**: Stale dependencies or type mismatches
**Solution**:
```bash
rm -rf node_modules yarn.lock
yarn install
npm run build
```

#### Build fails on Linux
**Cause**: Missing system dependencies
**Solution**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

---

## 📊 File Locations

### macOS
- App: `/Applications/ClipForge.app`
- Recordings: `~/Videos/` (user chooses)
- Exports: `~/Videos/` (user chooses)
- Logs: `~/Library/Logs/com.clipforge.app/`

### Linux
- App: Wherever AppImage is stored
- Recordings: `~/Videos/` (user chooses)
- Exports: `~/Videos/` (user chooses)
- Logs: `~/.local/share/com.clipforge.app/logs/`

### Windows
- App: `C:\Program Files\ClipForge\`
- Recordings: `C:\Users\<username>\Videos\` (user chooses)
- Exports: `C:\Users\<username>\Videos\` (user chooses)
- Logs: `%APPDATA%\com.clipforge.app\logs\`

---

## 🔐 Security Notes

### Desktop App
- App requests screen recording permissions (required for functionality)
- All processing happens locally (no cloud upload)
- No telemetry or analytics
- Open source - audit the code yourself

### Browser App
- Runs entirely in browser (no server-side processing)
- Recordings stay in browser memory
- No data sent to external servers
- Requires CORS headers (security feature, not vulnerability)

---

## 📞 Support

**Issues**: https://github.com/JoaoCarlinho/guantlet-clip_forge-24hr-mvp/issues
**Email**: JSkeete@gmail.com
**Documentation**: See README.md and other docs in repository

---

## ✅ Deployment Checklist

### Desktop App
- [ ] Rust and Cargo installed
- [ ] FFmpeg installed
- [ ] Node.js and Yarn installed
- [ ] `yarn install` completed
- [ ] `npm run build` succeeded
- [ ] Build artifacts located
- [ ] Tested on target platform
- [ ] Packaged for distribution (zip/dmg/msi)
- [ ] README and docs included
- [ ] GitHub release created (optional)

### Browser App
- [ ] Node.js and Yarn installed
- [ ] `yarn install` completed
- [ ] `vite build` succeeded
- [ ] Tested locally with `npm run preview`
- [ ] Server configured with required headers
- [ ] Deployed to hosting provider
- [ ] Tested in Chrome on deployed URL
- [ ] DNS configured (if custom domain)
- [ ] SSL certificate installed (recommended)

---

**Last Updated**: October 29, 2025
**Version**: 1.0.0
**Maintainer**: ClipForge Team

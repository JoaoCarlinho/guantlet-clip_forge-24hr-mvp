# 📤 Google Drive Upload Guide for ClipForge

**For uploading ClipForge build artifacts and documentation to Google Drive**

Target Folder: https://drive.google.com/drive/folders/1PqP_5N15Qx_dAHTsPdFTTwcGcHypxtfs?usp=sharing

---

## 📋 Overview

This guide provides step-by-step instructions for organizing and uploading ClipForge files to Google Drive for distribution and deployment.

---

## 📁 Recommended Folder Structure

Create the following structure in the Google Drive folder:

```
ClipForge v1.0.0/
│
├── 📄 README.md
├── 📄 DEPLOYMENT_GUIDE.md
├── 📄 PR7_RELEASE_PACKAGING_DEPLOYMENT.md
│
├── 📂 Documentation/
│   ├── README.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── PR7_RELEASE_PACKAGING_DEPLOYMENT.md
│   ├── PR5_EXPORT_PIPELINE.md
│   ├── PR4_SMOOTH_TIMELINE_TRANSITIONS_SUMMARY.md
│   ├── PR3_TIMELINE_EDITOR_SUMMARY.md
│   └── build-release.sh
│
├── 📂 Desktop App Builds/
│   ├── macOS/
│   │   ├── ClipForge-1.0.0-macOS.zip
│   │   └── ClipForge_1.0.0_aarch64.dmg (if available)
│   ├── Linux/
│   │   ├── clip-forge_1.0.0_amd64.AppImage
│   │   └── clip-forge_1.0.0_amd64.deb
│   └── Windows/
│       └── ClipForge_1.0.0_x64_en-US.msi
│
├── 📂 Browser Build/
│   └── clipforge-browser-v1.0.0.zip
│
└── 📂 Source Code/
    └── clipforge-source-v1.0.0.tar.gz
```

---

## 📝 Files to Upload Immediately

These files are ready to upload right now (no build required):

### 1. Documentation Files

From repository root:

| File | Description | Size |
|------|-------------|------|
| `README.md` | Main project documentation | ~15 KB |
| `DEPLOYMENT_GUIDE.md` | Complete deployment instructions | ~24 KB |
| `PR7_RELEASE_PACKAGING_DEPLOYMENT.md` | PR #7 summary | ~18 KB |
| `PR5_EXPORT_PIPELINE.md` | Export feature documentation | ~9 KB |
| `PR4_SMOOTH_TIMELINE_TRANSITIONS_SUMMARY.md` | Timeline transitions | ~14 KB |
| `PR3_TIMELINE_EDITOR_SUMMARY.md` | Timeline editor docs | ~11 KB |
| `build-release.sh` | Automated build script | ~5 KB |

**Upload Steps**:
1. Create "Documentation" folder in Google Drive
2. Upload all 7 files above
3. Verify files are accessible

### 2. Browser Build (Available Now)

The browser build is already compiled in the `dist/` folder:

**Steps to Prepare**:
```bash
cd /Users/joaocarlinho/gauntlet/clip_forge
cd dist
zip -r ../clipforge-browser-v1.0.0.zip .
cd ..
```

**Upload Steps**:
1. Create "Browser Build" folder in Google Drive
2. Upload `clipforge-browser-v1.0.0.zip`
3. Add a README in the folder explaining:
   - Unzip and upload to web server
   - Must configure CORS headers (see DEPLOYMENT_GUIDE.md)
   - Works in Chrome/Edge browsers

---

## ⏳ Files to Upload After Building

These require Cargo/Rust installation and a successful build:

### 3. Desktop App Builds

**Prerequisites**:
```bash
# Install Rust and Cargo (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
cargo install tauri-cli
```

**Build Commands**:
```bash
cd /Users/joaocarlinho/gauntlet/clip_forge
./build-release.sh
# or
npm run build
```

**Prepare macOS Build**:
```bash
cd src-tauri/target/release/bundle/macos
zip -r ~/ClipForge-1.0.0-macOS.zip ClipForge.app
```

**Upload Steps**:
1. Create "Desktop App Builds/macOS" folder
2. Upload `ClipForge-1.0.0-macOS.zip`
3. If DMG exists, upload from `src-tauri/target/release/bundle/dmg/`

**Linux Builds** (if available):
```bash
# AppImage is ready to upload from:
src-tauri/target/release/bundle/appimage/clip-forge_1.0.0_amd64.AppImage

# Deb package:
src-tauri/target/release/bundle/deb/clip-forge_1.0.0_amd64.deb
```

**Windows Builds** (if cross-compiled or built on Windows):
```bash
src-tauri/target/release/bundle/msi/ClipForge_1.0.0_x64_en-US.msi
```

### 4. Source Code Archive

**Prepare Source Archive**:
```bash
cd /Users/joaocarlinho/gauntlet/clip_forge
tar -czf clipforge-source-v1.0.0.tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=src-tauri/target \
  --exclude=.git \
  .
```

**Upload Steps**:
1. Create "Source Code" folder
2. Upload `clipforge-source-v1.0.0.tar.gz`

---

## 📄 Create README Files for Each Folder

### Browser Build README

Create `Browser Build/README.txt`:
```
ClipForge Browser Build v1.0.0
================================

This is the browser version of ClipForge that runs in Chrome/Edge.

INSTALLATION:
1. Unzip clipforge-browser-v1.0.0.zip
2. Upload the contents to your web server

IMPORTANT - CORS Headers Required:
Your web server MUST send these HTTP headers:
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp

See DEPLOYMENT_GUIDE.md for configuration examples for:
- Nginx
- Apache
- Netlify
- Vercel

BROWSER COMPATIBILITY:
✅ Chrome 90+
✅ Edge 90+
⚠️  Firefox 88+ (partial support)
❌ Safari (limited support)

For detailed instructions, see DEPLOYMENT_GUIDE.md in the Documentation folder.
```

### Desktop App README

Create `Desktop App Builds/README.txt`:
```
ClipForge Desktop App v1.0.0
==============================

Platform-specific builds for macOS, Linux, and Windows.

REQUIREMENTS:
- FFmpeg must be installed on the system
  macOS: brew install ffmpeg
  Linux: sudo apt install ffmpeg
  Windows: Download from ffmpeg.org and add to PATH

INSTALLATION:

macOS:
1. Download ClipForge-1.0.0-macOS.zip
2. Extract the zip file
3. Drag ClipForge.app to Applications folder
4. First launch: Right-click → Open (to bypass Gatekeeper)
5. Grant screen recording permission when prompted

Linux (AppImage):
1. Download clip-forge_1.0.0_amd64.AppImage
2. Make executable: chmod +x clip-forge_1.0.0_amd64.AppImage
3. Run: ./clip-forge_1.0.0_amd64.AppImage

Linux (Deb):
1. Download clip-forge_1.0.0_amd64.deb
2. Install: sudo dpkg -i clip-forge_1.0.0_amd64.deb
3. Fix dependencies: sudo apt-get install -f

Windows:
1. Download ClipForge_1.0.0_x64_en-US.msi
2. Double-click to install
3. Follow installation wizard

For detailed instructions and troubleshooting, see DEPLOYMENT_GUIDE.md.
```

---

## 🔐 Set Permissions

### Recommended Settings

1. **Main Folder**: View only (anyone with link)
2. **Individual Files**: View/Download only
3. **Share Link**: Copy and distribute

### Steps to Set Permissions

1. Right-click the "ClipForge v1.0.0" folder
2. Click "Share" → "Get link"
3. Change to "Anyone with the link"
4. Set to "Viewer" (not "Editor")
5. Click "Copy link"
6. Share this link with users

---

## ✅ Upload Checklist

### Phase 1: Immediate Upload (No Build Required)

- [ ] Create main "ClipForge v1.0.0" folder in Google Drive
- [ ] Create "Documentation" subfolder
- [ ] Upload all documentation files:
  - [ ] README.md
  - [ ] DEPLOYMENT_GUIDE.md
  - [ ] PR7_RELEASE_PACKAGING_DEPLOYMENT.md
  - [ ] PR5_EXPORT_PIPELINE.md
  - [ ] PR4_SMOOTH_TIMELINE_TRANSITIONS_SUMMARY.md
  - [ ] PR3_TIMELINE_EDITOR_SUMMARY.md
  - [ ] build-release.sh
- [ ] Create "Browser Build" subfolder
- [ ] Zip dist/ folder as clipforge-browser-v1.0.0.zip
- [ ] Upload browser build zip
- [ ] Create Browser Build README.txt
- [ ] Set folder permissions (anyone with link, viewer)
- [ ] Copy and save Google Drive link

### Phase 2: After Building Desktop App

- [ ] Install Rust/Cargo (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- [ ] Run build script (`./build-release.sh`)
- [ ] Create "Desktop App Builds" folder with subfolders
- [ ] Prepare macOS build:
  - [ ] Zip ClipForge.app
  - [ ] Upload to "Desktop App Builds/macOS"
  - [ ] Upload DMG (if available)
- [ ] Prepare Linux builds (if available):
  - [ ] Upload AppImage to "Desktop App Builds/Linux"
  - [ ] Upload Deb package
- [ ] Prepare Windows builds (if available):
  - [ ] Upload MSI to "Desktop App Builds/Windows"
- [ ] Create Desktop App Builds README.txt
- [ ] Create "Source Code" folder
- [ ] Create source tarball
- [ ] Upload source code archive
- [ ] Verify all files uploaded correctly
- [ ] Test download links
- [ ] Update any references with final Google Drive link

---

## 📊 Expected File Sizes

| File | Approximate Size |
|------|------------------|
| README.md | 15 KB |
| DEPLOYMENT_GUIDE.md | 24 KB |
| PR7 Documentation | 18 KB |
| Other PR docs | 10-15 KB each |
| build-release.sh | 5 KB |
| Browser Build (zip) | 2-5 MB |
| macOS App (zip) | 40-60 MB |
| macOS DMG | 45-70 MB |
| Linux AppImage | 80-120 MB |
| Linux Deb | 40-60 MB |
| Windows MSI | 50-80 MB |
| Source Code (tar.gz) | 5-10 MB |

**Total Storage** (all builds): ~300-400 MB

---

## 🌐 Sharing the Link

Once uploaded, share the Google Drive link with:

### For End Users
```
ClipForge v1.0.0 - Video Editor

Download: [Google Drive Link]

Choose your version:
- Desktop App (macOS, Linux, Windows) - Full features, requires FFmpeg
- Browser App (Chrome/Edge) - No installation, limited features

See Documentation folder for complete instructions.
```

### For Developers
```
ClipForge v1.0.0 - Source & Builds

Google Drive: [Link]

Contents:
- Source code (with build instructions)
- Pre-built binaries (all platforms)
- Complete documentation
- Browser deployment files

Prerequisites:
- Node.js 20+, Yarn
- Rust/Cargo (for building)
- FFmpeg (for runtime)

See DEPLOYMENT_GUIDE.md for details.
```

---

## 🔧 Maintenance

### Updating Files

When you release a new version:

1. Create new version folder: "ClipForge v1.1.0"
2. Upload new builds and updated docs
3. Keep old versions for reference
4. Update share links in README/website

### Version Control

Recommended structure for multiple versions:
```
Google Drive Root/
├── ClipForge v1.0.0/
├── ClipForge v1.1.0/
└── ClipForge Latest/ (symlink/shortcut to newest version)
```

---

## 🆘 Troubleshooting

### Upload Failures

**Large File Issues**:
- Google Drive has a 5TB total limit
- Individual file uploads may take time
- Use Google Drive desktop app for large files (AppImage, MSI)

**Permission Errors**:
- Ensure you have edit access to the target folder
- Check Google Drive storage quota
- Try uploading in smaller batches

### Download Issues for Users

**Virus Warning on Downloads**:
- Google Drive may warn for executable files (.app, .exe, .msi)
- This is normal for unsigned apps
- Users can click "Download anyway"

**Slow Downloads**:
- Large files (especially AppImage) take time
- Users can use Google Drive desktop client for faster downloads
- Consider creating a torrent for very large files (optional)

---

## 📞 Support

If you encounter issues:

1. Check Google Drive storage quota
2. Verify file permissions
3. Try uploading smaller batches
4. Use Google Drive desktop app for large files
5. Contact: JSkeete@gmail.com

---

## ✅ Quick Command Reference

```bash
# Prepare browser build
cd dist && zip -r ../clipforge-browser-v1.0.0.zip . && cd ..

# Build desktop app
./build-release.sh

# Zip macOS app
cd src-tauri/target/release/bundle/macos
zip -r ~/ClipForge-1.0.0-macOS.zip ClipForge.app

# Create source archive
tar -czf clipforge-source-v1.0.0.tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=src-tauri/target \
  --exclude=.git \
  .
```

---

**Last Updated**: October 29, 2025
**Version**: 1.0.0
**Target**: https://drive.google.com/drive/folders/1PqP_5N15Qx_dAHTsPdFTTwcGcHypxtfs?usp=sharing

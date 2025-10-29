#!/bin/bash

# ClipForge Release Build Script
# Builds both desktop and browser versions with all necessary checks

set -e  # Exit on error

echo "🎬 ClipForge Release Build Script"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "   Install: brew install node"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check Yarn
if ! command -v yarn &> /dev/null; then
    echo -e "${RED}❌ Yarn not found${NC}"
    echo "   Install: npm install -g yarn"
    exit 1
fi
echo -e "${GREEN}✅ Yarn $(yarn --version)${NC}"

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}⚠️  FFmpeg not found${NC}"
    echo "   Required for video processing"
    echo "   Install: brew install ffmpeg"
    echo "   Continuing anyway (only needed at runtime)..."
else
    echo -e "${GREEN}✅ FFmpeg $(ffmpeg -version | head -n1 | awk '{print $3}')${NC}"
fi

# Check Cargo (for desktop build)
BUILD_DESKTOP=true
if ! command -v cargo &> /dev/null; then
    echo -e "${YELLOW}⚠️  Cargo not found - skipping desktop build${NC}"
    echo "   To build desktop app, install Rust:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    BUILD_DESKTOP=false
else
    echo -e "${GREEN}✅ Cargo $(cargo --version | awk '{print $2}')${NC}"
fi

echo ""

# Install dependencies
echo "📦 Installing dependencies..."
yarn install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Build browser version
echo "🌐 Building browser version..."
vite build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Browser build complete${NC}"
    echo "   Output: dist/"
else
    echo -e "${RED}❌ Browser build failed${NC}"
    exit 1
fi
echo ""

# Build desktop version (if Cargo is available)
if [ "$BUILD_DESKTOP" = true ]; then
    echo "🖥️  Building desktop app..."
    echo "   This may take several minutes..."
    npm run build

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Desktop build complete${NC}"

        # Show build artifacts
        echo ""
        echo "📦 Build artifacts:"

        # macOS
        if [ -d "src-tauri/target/release/bundle/macos" ]; then
            echo "   macOS:"
            ls -lh src-tauri/target/release/bundle/macos/ | grep -v "^total" | awk '{print "     - " $9}'
        fi

        # DMG
        if [ -d "src-tauri/target/release/bundle/dmg" ]; then
            echo "   DMG:"
            ls -lh src-tauri/target/release/bundle/dmg/*.dmg 2>/dev/null | awk '{print "     - " $9 " (" $5 ")"}'
        fi

        # AppImage
        if [ -d "src-tauri/target/release/bundle/appimage" ]; then
            echo "   Linux AppImage:"
            ls -lh src-tauri/target/release/bundle/appimage/*.AppImage 2>/dev/null | awk '{print "     - " $9 " (" $5 ")"}'
        fi

        # Deb
        if [ -d "src-tauri/target/release/bundle/deb" ]; then
            echo "   Linux Deb:"
            ls -lh src-tauri/target/release/bundle/deb/*.deb 2>/dev/null | awk '{print "     - " $9 " (" $5 ")"}'
        fi

        # MSI
        if [ -d "src-tauri/target/release/bundle/msi" ]; then
            echo "   Windows MSI:"
            ls -lh src-tauri/target/release/bundle/msi/*.msi 2>/dev/null | awk '{print "     - " $9 " (" $5 ")"}'
        fi
    else
        echo -e "${RED}❌ Desktop build failed${NC}"
        echo "   Check error messages above"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Skipping desktop build (Cargo not available)${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}🎉 Build complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Test the builds:"
echo "     - Browser: npm run preview"
if [ "$BUILD_DESKTOP" = true ]; then
    if [ -d "src-tauri/target/release/bundle/macos" ]; then
        echo "     - Desktop: open src-tauri/target/release/bundle/macos/ClipForge.app"
    fi
fi
echo ""
echo "  2. Distribute:"
echo "     - Browser: Upload dist/ folder to your web server"
if [ "$BUILD_DESKTOP" = true ]; then
    echo "     - Desktop: See src-tauri/target/release/bundle/ for installers"
fi
echo ""
echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""

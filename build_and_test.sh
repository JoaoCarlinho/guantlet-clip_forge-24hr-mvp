#!/bin/bash

echo "================================================"
echo "  ClipForge - Build and Test Native Recording"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check FFmpeg
echo -e "${BLUE}Step 1: Checking FFmpeg...${NC}"
if command -v ffmpeg &> /dev/null; then
    echo -e "${GREEN}✓${NC} FFmpeg is installed"
    ffmpeg -version | head -n 1
else
    echo -e "${RED}✗${NC} FFmpeg is NOT installed"
    echo -e "${YELLOW}Install with: brew install ffmpeg${NC}"
    exit 1
fi
echo ""

# Step 2: Check if cargo is available
echo -e "${BLUE}Step 2: Checking Rust/Cargo...${NC}"
if command -v cargo &> /dev/null; then
    echo -e "${GREEN}✓${NC} Cargo is available"
    cargo --version

    # Build Rust backend
    echo -e "${BLUE}Step 3: Building Rust backend...${NC}"
    cd src-tauri
    if cargo build 2>&1 | tee /tmp/cargo_build.log; then
        echo -e "${GREEN}✓${NC} Rust backend built successfully"
    else
        echo -e "${RED}✗${NC} Rust backend build failed"
        echo "Check /tmp/cargo_build.log for details"
        exit 1
    fi
    cd ..
else
    echo -e "${YELLOW}⚠${NC} Cargo not available, will try npm build"
fi
echo ""

# Step 3: Build via npm
echo -e "${BLUE}Step 4: Building application...${NC}"
if npm run build 2>&1 | tee /tmp/npm_build.log; then
    echo -e "${GREEN}✓${NC} Application built successfully"
else
    echo -e "${RED}✗${NC} Build failed"
    echo "Check /tmp/npm_build.log for details"
    exit 1
fi
echo ""

# Step 4: Instructions
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Next steps:"
echo "1. Run the desktop app:"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "2. Test recording:"
echo "   • Click 'Start Recording'"
echo "   • Check console for:"
echo -e "     ${GREEN}✅ Using NATIVE recording mode (FFmpeg-based)${NC}"
echo ""
echo "3. If you see the error still:"
echo "   • Check console for actual error message"
echo "   • The native recorder may not be initializing"
echo "   • Try: npm run dev -- --verbose"
echo ""

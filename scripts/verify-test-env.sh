#!/bin/bash
# ClipForge MVP - Test Environment Verification Script
# This script verifies all prerequisites for manual testing are met

set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "ClipForge Test Environment Check"
echo "=================================="
echo ""

# Track overall status
ALL_CHECKS_PASSED=true

# Function to print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
print_error() {
    echo -e "${RED}✗${NC} $1"
    ALL_CHECKS_PASSED=false
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check 1: macOS Platform
echo "1. Checking platform..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    MACOS_VERSION=$(sw_vers -productVersion)
    print_success "macOS detected: $MACOS_VERSION"
else
    print_warning "Not running on macOS (detected: $OSTYPE)"
    print_warning "ClipForge MVP targets macOS. Testing may have issues."
fi
echo ""

# Check 2: Node.js version
echo "2. Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')

    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_success "Node.js $NODE_VERSION (required: 18+)"
    else
        print_error "Node.js version too old: $NODE_VERSION (required: 18+)"
        echo "  Install with: brew install node@20"
    fi
else
    print_error "Node.js not found"
    echo "  Install with: brew install node"
fi
echo ""

# Check 3: Yarn
echo "3. Checking Yarn..."
if command -v yarn &> /dev/null; then
    YARN_VERSION=$(yarn --version)
    print_success "Yarn $YARN_VERSION"
else
    print_error "Yarn not found"
    echo "  Install with: npm install -g yarn"
fi
echo ""

# Check 4: Rust toolchain
echo "4. Checking Rust..."
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version | awk '{print $2}')
    print_success "Rust $RUST_VERSION"
else
    print_warning "Rust not found (needed for Tauri build)"
    echo "  Install with: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
fi
echo ""

# Check 5: FFmpeg
echo "5. Checking FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')
    print_success "FFmpeg $FFMPEG_VERSION"

    # Check for H.264 encoder
    if ffmpeg -encoders 2>/dev/null | grep -q libx264; then
        print_success "  H.264 encoder (libx264) available"
    else
        print_warning "  H.264 encoder (libx264) not found"
    fi
else
    print_error "FFmpeg not found"
    echo "  Install with: brew install ffmpeg"
fi
echo ""

# Check 6: Docker
echo "6. Checking Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    print_success "Docker $DOCKER_VERSION"

    # Check if Docker daemon is running
    if docker ps &> /dev/null; then
        print_success "  Docker daemon is running"
    else
        print_error "  Docker daemon is not running"
        echo "  Start Docker Desktop from Applications"
    fi
else
    print_error "Docker not found"
    echo "  Install Docker Desktop from: https://www.docker.com/products/docker-desktop"
fi
echo ""

# Check 7: Docker Compose
echo "7. Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $4}' | sed 's/,//')
    print_success "Docker Compose $COMPOSE_VERSION"
else
    print_error "Docker Compose not found"
    echo "  Docker Compose should be included with Docker Desktop"
fi
echo ""

# Check 8: Redis container
echo "8. Checking Redis container..."
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q clipforge_redis; then
    REDIS_STATUS=$(docker ps --filter "name=clipforge_redis" --format "{{.Status}}")

    if echo "$REDIS_STATUS" | grep -q "healthy"; then
        print_success "Redis container is running and healthy"
        print_success "  Status: $REDIS_STATUS"
    else
        print_warning "Redis container is running but not healthy"
        echo "  Status: $REDIS_STATUS"
    fi
else
    print_warning "Redis container not running"
    echo "  Start with: docker-compose -f docker-compose.dev.yml up -d"
fi
echo ""

# Check 9: Project dependencies
echo "9. Checking project dependencies..."
if [ -d "node_modules" ]; then
    print_success "node_modules directory exists"

    # Check for key dependencies
    if [ -d "node_modules/@tauri-apps" ]; then
        print_success "  Tauri dependencies installed"
    fi

    if [ -d "node_modules/react" ]; then
        print_success "  React dependencies installed"
    fi

    if [ -d "node_modules/@ffmpeg" ]; then
        print_success "  FFmpeg WASM dependencies installed"
    fi
else
    print_warning "node_modules not found"
    echo "  Run: yarn install"
fi
echo ""

# Check 10: Environment files
echo "10. Checking environment configuration..."
if [ -f ".env.development" ]; then
    print_success ".env.development file exists"

    # Check for required variables
    if grep -q "REDIS_URL" .env.development; then
        REDIS_URL=$(grep REDIS_URL .env.development | cut -d'=' -f2)
        print_success "  REDIS_URL configured: $REDIS_URL"
    fi
else
    print_warning ".env.development not found"
    echo "  This file should exist from Phase 1"
fi
echo ""

# Check 11: Test video files
echo "11. Checking for test video files..."
if [ -d "$HOME/Movies" ]; then
    VIDEO_COUNT=$(find "$HOME/Movies" -type f \( -iname "*.mp4" -o -iname "*.mov" \) 2>/dev/null | wc -l | xargs)

    if [ "$VIDEO_COUNT" -gt 0 ]; then
        print_success "Found $VIDEO_COUNT test video files in ~/Movies"
    else
        print_warning "No MP4/MOV files found in ~/Movies"
        echo "  Download test videos or create sample files for testing"
    fi
else
    print_warning "~/Movies directory not found"
fi
echo ""

# Check 12: Build verification
echo "12. Checking build configuration..."
if [ -f "package.json" ]; then
    print_success "package.json exists"

    # Check for required scripts
    if grep -q "\"dev\"" package.json; then
        print_success "  'dev' script configured"
    fi

    if grep -q "\"build\"" package.json; then
        print_success "  'build' script configured"
    fi
fi

if [ -f "vite.config.ts" ]; then
    print_success "vite.config.ts exists"
fi

if [ -f "src-tauri/tauri.conf.json" ]; then
    print_success "Tauri configuration exists"
fi
echo ""

# Check 13: Port availability
echo "13. Checking port availability..."
if ! lsof -Pi :1420 -sTCP:LISTEN &> /dev/null; then
    print_success "Port 1420 is available (Vite dev server)"
else
    print_warning "Port 1420 is in use"
    echo "  Another process may be using this port"
fi

if ! lsof -Pi :6379 -sTCP:LISTEN &> /dev/null; then
    print_warning "Port 6379 is not in use (Redis should be running here)"
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q clipforge_redis; then
    print_success "Port 6379 is in use by Redis container"
else
    print_warning "Port 6379 is in use by unknown process"
fi
echo ""

# Summary
echo "=================================="
echo "Summary"
echo "=================================="
echo ""

if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You can start the application with:"
    echo "  yarn tauri dev"
    echo ""
    echo "Or run the front-end only with:"
    echo "  yarn dev"
    echo ""
else
    echo -e "${YELLOW}⚠ Some checks failed or require attention${NC}"
    echo ""
    echo "Review the output above and fix any issues before running tests."
    echo ""
fi

# Quick start guide
echo "=================================="
echo "Quick Start Guide"
echo "=================================="
echo ""
echo "1. Start Redis (if not running):"
echo "   docker-compose -f docker-compose.dev.yml up -d"
echo ""
echo "2. Start the application:"
echo "   yarn tauri dev"
echo ""
echo "3. Run manual tests:"
echo "   Follow tests/manual_tests.md"
echo ""
echo "4. Monitor Redis:"
echo "   docker logs -f clipforge_redis"
echo ""
echo "5. Stop Redis when done:"
echo "   docker-compose -f docker-compose.dev.yml down"
echo ""

exit 0

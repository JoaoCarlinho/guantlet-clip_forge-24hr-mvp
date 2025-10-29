#!/bin/bash

# FFmpeg Installation Test Script for ClipForge Native Recording
# This script verifies that FFmpeg is properly installed and configured

set -e

echo "================================================"
echo "  ClipForge Native Recording - FFmpeg Test"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Check if FFmpeg is installed
echo "Test 1: Checking FFmpeg installation..."
if command -v ffmpeg &> /dev/null; then
    test_result 0 "FFmpeg is installed"
    FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
    echo "   Version: $FFMPEG_VERSION"
else
    test_result 1 "FFmpeg is NOT installed"
    echo -e "${YELLOW}   Install with: brew install ffmpeg${NC}"
fi
echo ""

# Test 2: Check FFmpeg version
echo "Test 2: Checking FFmpeg version..."
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION_NUM=$(ffmpeg -version 2>&1 | grep -oP 'ffmpeg version \K[0-9]+\.[0-9]+' | head -n 1)
    if [ ! -z "$FFMPEG_VERSION_NUM" ]; then
        test_result 0 "FFmpeg version detected: $FFMPEG_VERSION_NUM"
    else
        test_result 1 "Could not determine FFmpeg version"
    fi
else
    test_result 1 "FFmpeg not available for version check"
fi
echo ""

# Test 3: Check for required encoders
echo "Test 3: Checking required video encoders..."
if command -v ffmpeg &> /dev/null; then
    if ffmpeg -encoders 2>&1 | grep -q "libx264"; then
        test_result 0 "H.264 encoder (libx264) available"
    else
        test_result 1 "H.264 encoder (libx264) NOT available"
    fi
else
    test_result 1 "FFmpeg not available for encoder check"
fi
echo ""

# Test 4: Check for required audio encoders
echo "Test 4: Checking required audio encoders..."
if command -v ffmpeg &> /dev/null; then
    if ffmpeg -encoders 2>&1 | grep -q "aac"; then
        test_result 0 "AAC audio encoder available"
    else
        test_result 1 "AAC audio encoder NOT available"
    fi
else
    test_result 1 "FFmpeg not available for audio encoder check"
fi
echo ""

# Test 5: Check platform-specific input devices
echo "Test 5: Checking platform-specific input devices..."
OS_TYPE=$(uname -s)
case "$OS_TYPE" in
    Darwin)
        echo "   Platform: macOS"
        if ffmpeg -devices 2>&1 | grep -q "avfoundation"; then
            test_result 0 "AVFoundation input device available"
        else
            test_result 1 "AVFoundation input device NOT available"
        fi
        ;;
    Linux)
        echo "   Platform: Linux"
        if ffmpeg -devices 2>&1 | grep -q "x11grab"; then
            test_result 0 "x11grab input device available"
        else
            test_result 1 "x11grab input device NOT available"
        fi
        ;;
    MINGW*|MSYS*|CYGWIN*)
        echo "   Platform: Windows"
        if ffmpeg -devices 2>&1 | grep -q "gdigrab"; then
            test_result 0 "gdigrab input device available"
        else
            test_result 1 "gdigrab input device NOT available"
        fi
        ;;
    *)
        echo -e "${YELLOW}   Platform: Unknown ($OS_TYPE)${NC}"
        test_result 1 "Unknown platform"
        ;;
esac
echo ""

# Test 6: Test actual screen capture (5 seconds)
echo "Test 6: Testing actual screen capture (5 seconds)..."
if command -v ffmpeg &> /dev/null; then
    TEST_OUTPUT="/tmp/clipforge_test_$(date +%s).mp4"

    case "$OS_TYPE" in
        Darwin)
            # macOS test
            echo "   Recording 5 seconds of screen (macOS)..."
            if ffmpeg -f avfoundation -framerate 30 -capture_cursor 1 -i "1:none" \
                      -c:v libx264 -preset ultrafast -crf 23 -t 5 -y "$TEST_OUTPUT" \
                      >/dev/null 2>&1; then
                if [ -f "$TEST_OUTPUT" ] && [ -s "$TEST_OUTPUT" ]; then
                    FILE_SIZE=$(ls -lh "$TEST_OUTPUT" | awk '{print $5}')
                    test_result 0 "Screen capture successful (file size: $FILE_SIZE)"
                    echo "   Test file: $TEST_OUTPUT"
                    rm -f "$TEST_OUTPUT"
                else
                    test_result 1 "Screen capture failed: empty or missing file"
                fi
            else
                test_result 1 "Screen capture failed: FFmpeg error"
                echo -e "${YELLOW}   Note: On macOS 10.14+, grant screen recording permission:${NC}"
                echo -e "${YELLOW}   System Preferences → Security & Privacy → Screen Recording${NC}"
            fi
            ;;
        Linux)
            # Linux test
            echo "   Recording 5 seconds of screen (Linux)..."
            if ffmpeg -f x11grab -framerate 30 -video_size 1920x1080 -i :0.0 \
                      -c:v libx264 -preset ultrafast -crf 23 -t 5 -y "$TEST_OUTPUT" \
                      >/dev/null 2>&1; then
                if [ -f "$TEST_OUTPUT" ] && [ -s "$TEST_OUTPUT" ]; then
                    FILE_SIZE=$(ls -lh "$TEST_OUTPUT" | awk '{print $5}')
                    test_result 0 "Screen capture successful (file size: $FILE_SIZE)"
                    echo "   Test file: $TEST_OUTPUT"
                    rm -f "$TEST_OUTPUT"
                else
                    test_result 1 "Screen capture failed: empty or missing file"
                fi
            else
                test_result 1 "Screen capture failed: FFmpeg error"
                echo -e "${YELLOW}   Note: Ensure DISPLAY is set: export DISPLAY=:0${NC}"
            fi
            ;;
        MINGW*|MSYS*|CYGWIN*)
            # Windows test
            echo "   Recording 5 seconds of screen (Windows)..."
            if ffmpeg -f gdigrab -framerate 30 -i desktop \
                      -c:v libx264 -preset ultrafast -crf 23 -t 5 -y "$TEST_OUTPUT" \
                      >/dev/null 2>&1; then
                if [ -f "$TEST_OUTPUT" ] && [ -s "$TEST_OUTPUT" ]; then
                    FILE_SIZE=$(ls -lh "$TEST_OUTPUT" | awk '{print $5}')
                    test_result 0 "Screen capture successful (file size: $FILE_SIZE)"
                    echo "   Test file: $TEST_OUTPUT"
                    rm -f "$TEST_OUTPUT"
                else
                    test_result 1 "Screen capture failed: empty or missing file"
                fi
            else
                test_result 1 "Screen capture failed: FFmpeg error"
            fi
            ;;
        *)
            test_result 1 "Cannot test screen capture on unknown platform"
            ;;
    esac
else
    test_result 1 "FFmpeg not available for capture test"
fi
echo ""

# Summary
echo "================================================"
echo "                  TEST SUMMARY"
echo "================================================"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Your system is ready for native recording.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Review the output above for details.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  • Install FFmpeg: brew install ffmpeg (macOS)"
    echo "  • Grant screen recording permission (macOS)"
    echo "  • Set DISPLAY variable (Linux): export DISPLAY=:0"
    echo ""
    echo "For more help, see: NATIVE_RECORDING_SETUP.md"
    exit 1
fi

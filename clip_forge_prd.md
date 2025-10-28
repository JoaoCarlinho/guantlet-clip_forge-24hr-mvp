# ClipForge - Product Requirements Document

**Version:** 1.0  
**Last Updated:** October 27, 2025  
**Target MVP Delivery:** Tuesday 10:59 PM CT  
**Platform:** macOS Desktop Application

---

## Executive Summary

ClipForge is a desktop video editor designed to provide a fast, stable, and intuitive editing experience similar to iMovie and Loom. The application focuses on essential video editing workflows including screen recording, webcam capture, clip import, timeline-based editing, and high-quality exports—all while maintaining optimal performance and stability.

### Core Value Proposition
- **Performance First:** Responsive timeline with 10+ clips, smooth 30+ fps preview playback
- **Stability Guaranteed:** No crashes during export, no memory leaks during extended sessions (15+ minutes)
- **Quality Output:** Exports maintain reasonable quality without file bloat
- **Quick to Launch:** Fast application startup and responsive UI

---

## User Stories

### Primary User Personas

**Persona 1: Content Creator (Solo)**
- Creates tutorial videos, product demos, and educational content
- Needs to combine screen recordings with webcam footage
- Values quick turnaround time from recording to published video

**Persona 2: Remote Team Collaborator**
- Records async updates, demos, and presentations for distributed teams
- Needs basic editing to trim mistakes and combine multiple takes
- Prioritizes ease of use and reliable exports

### User Stories for MVP

#### Story 1: Import and Preview
**As a** content creator  
**I want to** import video files (MP4/MOV) into the application  
**So that** I can begin editing my recorded content

**Acceptance Criteria:**
- User can drag and drop video files into the application
- User can use a file picker to select videos
- Imported videos appear in the timeline view
- User can play back imported videos in the preview player
- Preview plays smoothly at 30+ fps

#### Story 2: Basic Trimming
**As a** video editor  
**I want to** set in and out points on a video clip  
**So that** I can remove unwanted footage from the beginning or end

**Acceptance Criteria:**
- User can select a clip in the timeline
- User can set an in-point (start trim)
- User can set an out-point (end trim)
- Preview reflects the trimmed version
- Changes are non-destructive to original file

#### Story 3: Timeline Management
**As a** content creator  
**I want to** see all my clips arranged on a timeline  
**So that** I can understand the structure and sequence of my video

**Acceptance Criteria:**
- Timeline displays all imported clips in sequence
- Each clip shows visual representation (thumbnail or preview)
- Timeline remains responsive with 10+ clips loaded
- User can see clip durations and positions

#### Story 4: Video Export
**As a** video editor  
**I want to** export my edited timeline as an MP4 file  
**So that** I can share or publish my finished video

**Acceptance Criteria:**
- User can trigger export process
- Export completes without crashing
- Exported file maintains reasonable quality
- File size is not excessively bloated
- User receives confirmation when export is complete

#### Story 5: Application Stability
**As a** user working on a project  
**I want to** edit my video for extended periods  
**So that** I can complete complex editing tasks without interruption

**Acceptance Criteria:**
- Application runs without memory leaks for 15+ minutes
- No crashes during normal editing operations
- Application launches quickly
- UI remains responsive throughout editing session

---

## Key Features for MVP

### Phase 1: Core Infrastructure (MVP - Tuesday 10:59 PM CT)

#### 1. Desktop Application Framework
- Native macOS application using Tauri
- Quick launch time (< 3 seconds to usable state)
- Proper window management and system integration
- Packaged as distributable .app bundle

#### 2. Video Import System
- **Drag & Drop Support:** Files can be dragged into application window
- **File Picker:** System dialog for selecting video files
- **Supported Formats:** MP4, MOV (H.264 codec priority)
- **Import Validation:** Check file format and codec compatibility
- **Asset Management:** Track imported files and their locations

#### 3. Timeline View
- **Visual Representation:** Show clips as blocks on horizontal timeline
- **Thumbnail Preview:** Display first frame of each clip
- **Time Markers:** Show timestamp indicators
- **Clip Information:** Display clip name and duration
- **Performance:** Handle 10+ clips without lag

#### 4. Video Preview Player
- **Playback Controls:** Play, pause, seek
- **Smooth Playback:** Minimum 30 fps during preview
- **Time Synchronization:** Preview position matches timeline cursor
- **Quality Toggle:** Option for reduced preview quality if needed
- **HTML5 Video Element:** Leverage browser video capabilities

#### 5. Basic Trim Functionality
- **In/Out Point Selection:** Click or drag to set trim points
- **Visual Indicators:** Show trim markers on timeline
- **Preview Update:** Preview reflects current trim settings
- **Reset Option:** Clear trim points to restore full clip
- **Non-Destructive:** Original files remain unmodified

#### 6. Video Export
- **Export Settings:**
  - Output format: MP4 (H.264)
  - Resolution: Match source or 1080p
  - Bitrate: 5-10 Mbps for quality/size balance
- **Progress Indicator:** Show export progress
- **Error Handling:** Graceful failure with user feedback
- **Output Location:** User selects save location
- **Success Confirmation:** Notify when export completes

#### 7. Application Packaging
- **Native Build:** Not just dev mode
- **macOS .app Bundle:** Proper application structure
- **Code Signing:** (Optional for MVP, required for distribution)
- **Installer:** DMG or direct .app for easy installation

---

## Tech Stack

### Recommended Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│  - UI Components (Timeline, Player)     │
│  - State Management (Kea)               │
│  - Rendering (Canvas/DOM)               │
└─────────────────┬───────────────────────┘
                  │
                  │ Tauri IPC
                  │
┌─────────────────▼───────────────────────┐
│         Backend (Rust/Tauri)            │
│  - File System Access                   │
│  - FFmpeg Integration                   │
│  - Video Processing                     │
│  - Export Pipeline                      │
└─────────────────────────────────────────┘
```

### Core Technologies

#### 1. Application Framework: **Tauri v1.5+**
**Why Tauri:**
- Native performance with small binary size (~3-5MB vs Electron's 50MB+)
- Lower memory footprint critical for video editing
- Rust backend provides safety and performance
- Native macOS integration
- Active community and good documentation

**Trade-offs:**
- Smaller ecosystem than Electron
- More complex setup for native modules
- Rust learning curve for backend features

#### 2. Frontend: **React 18+**
**Why React:**
- Leverages your existing React knowledge
- Large ecosystem of UI components
- Excellent performance with virtual DOM
- Strong community and tooling

**Implementation:**
- Create React App or Vite for setup
- TypeScript for type safety
- Modern hooks-based components

#### 3. State Management: **Kea 3.0+**
**Why Kea:**
- Redux-like architecture with less boilerplate
- Easy to test and debug
- Good for complex state like timeline data
- Familiar if you know Redux patterns

**State Structure:**
```javascript
{
  timeline: {
    clips: [],
    duration: 0,
    currentTime: 0
  },
  player: {
    playing: false,
    currentClip: null
  },
  project: {
    unsavedChanges: false,
    exportProgress: 0
  }
}
```

#### 4. Video Processing: **FFmpeg**
**Integration Option 1: Tauri Command + System FFmpeg (Recommended for MVP)**
- Install FFmpeg on system (via Homebrew)
- Call via Rust commands in Tauri backend
- Fast, reliable, full feature set
- Requires FFmpeg installation by user

**Integration Option 2: @ffmpeg/ffmpeg (Backup)**
- WASM-based FFmpeg in browser
- No system dependencies
- Slower performance (WASM overhead)
- Good for prototyping

**Recommended for MVP:** System FFmpeg via Tauri commands

#### 5. Timeline Rendering: **HTML5 Canvas + React**
**Why Canvas:**
- Better performance for many clips (10+)
- Precise control over rendering
- Smooth animations and interactions
- Lower DOM overhead

**Alternative:** DOM-based with React components
- Easier to implement initially
- May have performance issues with 10+ clips
- Good for MVP if Canvas proves too complex

**Recommendation:** Start with DOM-based, migrate to Canvas if performance requires

#### 6. Video Player: **HTML5 Video Element**
**Why Native:**
- Hardware acceleration built-in
- Reliable playback on macOS
- Simple API
- Good enough for MVP

**Enhancement Path:** VideoJS for advanced controls (post-MVP)

---

## Tech Stack Pitfalls & Recommendations

### Critical Considerations

#### 1. Memory Management ⚠️
**Challenge:** Video editing is memory-intensive  
**Solutions:**
- Load video metadata only, not full files into memory
- Use video element's native buffering
- Implement clip unloading for clips out of view
- Monitor memory usage during development
- Test with 10+ high-resolution clips

**Kea Consideration:**
- Don't store large binary data in Kea state
- Store file paths and metadata only
- Use refs for video elements

#### 2. FFmpeg Integration Path ⚠️
**Decision Point:** Where to run FFmpeg?

**Option A: Tauri Backend (Recommended)**
```rust
// Rust command in Tauri
#[tauri::command]
async fn export_video(clips: Vec<Clip>) -> Result<String, String> {
    // FFmpeg processing in Rust
}
```
**Pros:** Fast, native performance, full FFmpeg features  
**Cons:** Requires system FFmpeg, more complex setup

**Option B: WASM FFmpeg in Frontend**
```javascript
import { createFFmpeg } from '@ffmpeg/ffmpeg';
```
**Pros:** No dependencies, easier to start  
**Cons:** Slower, memory-heavy, limited features

**MVP Recommendation:** Start with Option B for speed, plan migration to Option A

#### 3. Timeline Performance ⚠️
**Challenge:** Maintaining 60fps UI with 10+ clips

**Solutions:**
- Virtual scrolling for long timelines
- Debounce timeline updates
- Use `requestAnimationFrame` for smooth playback cursor
- Pre-generate thumbnails during import
- Consider Canvas rendering for final implementation

**React Optimization:**
```javascript
// Memoize timeline clips
const TimelineClip = React.memo(({ clip }) => {
  // Render logic
});

// Use useCallback for event handlers
const handleClipDrag = useCallback((clipId, position) => {
  // Update logic
}, []);
```

#### 4. Video Format Compatibility ⚠️
**Challenge:** Supporting various codecs and containers

**MVP Strategy:**
- Focus on H.264 MP4 (most common)
- Detect unsupported formats and show clear error
- Provide conversion option (post-MVP)

**Format Detection:**
```javascript
// Use ffprobe to check format
tauri.invoke('probe_video', { path: filePath })
```

#### 5. Export Quality vs Size Balance ⚠️
**Challenge:** Avoiding bloated files while maintaining quality

**Recommended Settings:**
```bash
# FFmpeg export command
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  -c:a aac \
  -b:a 128k \
  output.mp4
```

**CRF Values:**
- 18: Nearly lossless (~3x source size)
- 23: High quality, balanced size (recommended)
- 28: Lower quality, smaller size

#### 6. Tauri-Specific Gotchas ⚠️

**File Path Handling:**
```javascript
// Wrong: Direct file access
<video src="/path/to/video.mp4" />

// Right: Use Tauri's convertFileSrc
import { convertFileSrc } from '@tauri-apps/api/tauri';
<video src={convertFileSrc(filePath)} />
```

**IPC Performance:**
- Don't send large data through IPC
- Stream data when possible
- Use file paths, not file contents

**Resource Loading:**
- Use Tauri's asset protocol for bundled resources
- Be aware of CORS issues with local files

---

## Reference Architecture from GitHub Examples

### 1. [Montage](https://github.com/MatijaNovosel/montage)
**Key Learnings:**
- Uses Vue but architectural patterns apply
- Good example of timeline implementation
- Shows video processing pipeline
- Reference for project structure

**Applicable Patterns:**
- Component organization for video editor
- State management for timeline
- Export workflow implementation

### 2. [Video Stream Tauri React](https://github.com/scandav/video-stream-tauri-react)
**Key Learnings:**
- Direct React + Tauri integration example
- Shows IPC patterns for media handling
- Video streaming approach
- Build and packaging setup

**Applicable Code:**
- Tauri configuration
- React video player setup
- File handling through Tauri commands

### 3. [CrabNebula Cloud Publish Guide](https://docs.crabnebula.dev/cloud/guides/publish-cloud-github/)
**Key Learnings:**
- GitHub Actions workflow for Tauri builds
- Cross-platform build strategies
- Release automation
- Code signing process

**Post-MVP Utility:**
- Setting up CI/CD for builds
- Automated testing pipeline
- Distribution workflow

---

## Development Phases

### Phase 1: MVP (Due Tuesday 10:59 PM CT)
**Goal:** Working desktop app with core features

**Week 1 - Days 1-2: Foundation**
- [ ] Set up Tauri project with React and Kea
- [ ] Configure build system
- [ ] Create basic window and routing
- [ ] Test packaging process

**Week 1 - Days 3-4: Import & Preview**
- [ ] Implement drag & drop
- [ ] Add file picker
- [ ] Create video player component
- [ ] Build simple timeline view (DOM-based)

**Week 1 - Days 5-6: Editing & Export**
- [ ] Add trim functionality (in/out points)
- [ ] Implement basic export with FFmpeg
- [ ] Test with 10+ clips
- [ ] Fix performance issues

**Week 1 - Day 7: Testing & Polish**
- [ ] Memory leak testing (15+ minutes)
- [ ] Export quality verification
- [ ] Build final package
- [ ] Create simple user guide

### Phase 2: Post-MVP Enhancements
- Screen recording integration
- Webcam capture
- Multi-track timeline
- Transitions and effects
- Audio editing
- Clip arrangement (drag to reorder)

---

## Success Metrics for MVP

### Performance Metrics
- [ ] Application launch: < 3 seconds
- [ ] Timeline responsiveness: 60fps with 10+ clips
- [ ] Preview playback: 30+ fps minimum
- [ ] Export completion rate: 100% (no crashes)
- [ ] Memory stability: No leaks over 15 minutes

### Quality Metrics
- [ ] Export file size: < 2x source size for CRF 23
- [ ] Export quality: Visually comparable to source
- [ ] UI responsiveness: No input lag during editing

### Functionality Checklist
- [ ] Desktop app launches as native .app
- [ ] Drag & drop video import works
- [ ] File picker video import works
- [ ] Timeline displays 10+ clips
- [ ] Video preview plays imported clips
- [ ] Trim in/out points function correctly
- [ ] Export to MP4 completes successfully
- [ ] Packaged as distributable application

---

## Technical Risks & Mitigation

### High Risk

**Risk 1: FFmpeg Integration Complexity**
- **Impact:** Could block export functionality
- **Mitigation:** Use @ffmpeg/ffmpeg for MVP, plan Rust integration
- **Contingency:** Pre-built FFmpeg binaries bundled with app

**Risk 2: Timeline Performance with 10+ Clips**
- **Impact:** UI could become unresponsive
- **Mitigation:** Start with DOM, have Canvas implementation ready
- **Contingency:** Reduce clip preview quality, implement pagination

**Risk 3: Memory Leaks in Video Player**
- **Impact:** App crashes during extended sessions
- **Mitigation:** Proper cleanup in React useEffect, regular testing
- **Contingency:** Implement auto-save, warn users of memory usage

### Medium Risk

**Risk 4: Export Quality/Size Balance**
- **Impact:** Files too large or quality too poor
- **Mitigation:** Test multiple CRF values, provide user choice
- **Contingency:** Add export presets (Quality/Balanced/Small)

**Risk 5: File Format Compatibility**
- **Impact:** Some imported videos won't play
- **Mitigation:** Focus on H.264 MP4, clear error messages
- **Contingency:** Add format conversion during import

---

## Dependencies & Prerequisites

### Development Environment
- macOS (primary development target)
- Node.js 18+ and npm/yarn
- Rust toolchain (for Tauri)
- FFmpeg (installed via Homebrew)

### Required Knowledge
- React fundamentals ✓ (You have this)
- Kea state management (Documentation available)
- Basic Rust (For Tauri commands - can copy/paste initially)
- FFmpeg command-line basics
- Video codec understanding (H.264, containers)

### External Services
- None required for MVP (all local processing)

---

## Open Questions & Decisions Needed

1. **FFmpeg Distribution:** Bundle FFmpeg or require system installation?
   - **Recommendation:** Require installation for MVP, bundle post-MVP

2. **Timeline Implementation:** DOM or Canvas for initial version?
   - **Recommendation:** DOM for MVP speed, Canvas if performance issues

3. **Export Settings UI:** Fixed settings or user-configurable?
   - **Recommendation:** Fixed for MVP (CRF 23, Medium preset)

4. **File Format Support:** MP4 only or add MOV/other formats?
   - **Recommendation:** MP4 and MOV for MVP, expand later

5. **Project Persistence:** Save/load project files?
   - **Recommendation:** Not in MVP, add in Phase 2

---

## Next Steps

1. **Review this PRD** and provide feedback
2. **Make decisions** on open questions
3. **Set up development environment** (Tauri + React + Kea)
4. **Create initial project structure**
5. **Begin Phase 1 - Days 1-2** implementation
6. **Establish testing protocol** for performance and stability

---

## Appendix A: Kea State Structure Example

```javascript
// projectLogic.js
import { kea } from 'kea';

export const projectLogic = kea({
  actions: {
    addClip: (clip) => ({ clip }),
    removeClip: (clipId) => ({ clipId }),
    setTrimPoints: (clipId, inPoint, outPoint) => ({ clipId, inPoint, outPoint }),
    setCurrentTime: (time) => ({ time }),
    togglePlayback: true,
    startExport: true,
    exportComplete: (path) => ({ path }),
    exportFailed: (error) => ({ error }),
  },
  
  reducers: {
    clips: [[], {
      addClip: (state, { clip }) => [...state, clip],
      removeClip: (state, { clipId }) => state.filter(c => c.id !== clipId),
      setTrimPoints: (state, { clipId, inPoint, outPoint }) => 
        state.map(c => c.id === clipId ? { ...c, inPoint, outPoint } : c),
    }],
    
    currentTime: [0, {
      setCurrentTime: (_, { time }) => time,
    }],
    
    playing: [false, {
      togglePlayback: (state) => !state,
    }],
    
    exportStatus: ['idle', {
      startExport: () => 'exporting',
      exportComplete: () => 'complete',
      exportFailed: () => 'failed',
    }],
  },
  
  selectors: {
    totalDuration: [
      (selectors) => [selectors.clips],
      (clips) => clips.reduce((sum, clip) => {
        const duration = (clip.outPoint || clip.duration) - (clip.inPoint || 0);
        return sum + duration;
      }, 0),
    ],
    
    trimmedClips: [
      (selectors) => [selectors.clips],
      (clips) => clips.map(clip => ({
        ...clip,
        effectiveStart: clip.inPoint || 0,
        effectiveEnd: clip.outPoint || clip.duration,
        effectiveDuration: (clip.outPoint || clip.duration) - (clip.inPoint || 0),
      })),
    ],
  },
  
  listeners: ({ actions, values }) => ({
    startExport: async () => {
      try {
        const exportPath = await invoke('export_timeline', {
          clips: values.trimmedClips,
        });
        actions.exportComplete(exportPath);
      } catch (error) {
        actions.exportFailed(error.toString());
      }
    },
  }),
});
```

---

## Appendix B: Recommended File Structure

```
clipforge/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── commands.rs     # Tauri commands
│   │   ├── ffmpeg.rs       # FFmpeg integration
│   │   └── utils.rs        # Helper functions
│   ├── tauri.conf.json     # Tauri configuration
│   └── Cargo.toml          # Rust dependencies
│
├── src/                    # React frontend
│   ├── components/
│   │   ├── Timeline/
│   │   │   ├── Timeline.jsx
│   │   │   ├── TimelineClip.jsx
│   │   │   └── TimelineCursor.jsx
│   │   ├── Player/
│   │   │   ├── VideoPlayer.jsx
│   │   │   └── PlaybackControls.jsx
│   │   └── shared/
│   │       ├── Button.jsx
│   │       └── FileDropZone.jsx
│   │
│   ├── logic/              # Kea logic modules
│   │   ├── projectLogic.js
│   │   ├── timelineLogic.js
│   │   └── playerLogic.js
│   │
│   ├── utils/
│   │   ├── videoUtils.js   # Video helper functions
│   │   └── timeUtils.js    # Time formatting
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── public/                 # Static assets
├── package.json
└── README.md
```

---

**Document Status:** Draft for Review  
**Next Review Date:** After initial feedback  
**Owner:** Development Team
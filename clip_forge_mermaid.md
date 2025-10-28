Here’s a **Mermaid system architecture + SDLC diagram** for the **ClipForge MVP**, integrating the development phases from `clip_forge_24hr_task_list.txt` and the technical architecture defined in `ClipForge_PRD.md`.

This diagram shows:

* How each codebase layer (React frontend ↔ Tauri backend ↔ system services) connects
* Where Redis, FFmpeg, Docker, and GitHub fit into the development lifecycle
* PR-based development flow

---

```mermaid
%%{init: {'theme':'neutral', 'themeVariables': { 'primaryColor': '#cce5ff', 'edgeLabelBackground':'#ffffff', 'tertiaryColor':'#ffffff'}}}%%
graph TD

%% FRONTEND
subgraph F["Frontend - React (Vite + Kea)"]
    A1[App.jsx - UI Shell]
    A2[Timeline Components<br>(Timeline.jsx, TimelineClip.jsx)]
    A3[Player Components<br>(VideoPlayer.jsx, PlaybackControls.jsx)]
    A4[Kea State Logic<br>(projectLogic.js, timelineLogic.js)]
    A5[Shared Components<br>(Button.jsx, FileDropZone.jsx)]
end

%% BACKEND
subgraph B["Backend - Tauri (Rust)"]
    B1[main.rs - Tauri entry]
    B2[commands.rs - IPC Bridge]
    B3[ffmpeg.rs - Video Processing]
    B4[cache.rs - Redis Caching]
    B5[config.rs - Environment Loader]
end

%% SYSTEM
subgraph S["System Dependencies & Services"]
    S1[FFmpeg CLI<br>System installed via Homebrew]
    S2[Redis Cache<br>(Docker Service)]
    S3[MinIO / Postgres (Optional - Phase 2)]
end

%% DEV INFRA
subgraph D["Development & Deployment Infrastructure"]
    D1[Docker Compose<br>docker-compose.dev.yml]
    D2[.env.development - Environment Variables]
    D3[GitHub Repo<br>joaocarlinho/gauntlet-clip_forge-24hr-mvp]
    D4[GitHub PR Workflow<br>(feature → dev → main)]
    D5[GitHub Actions<br>CI/CD for Tauri Builds]
end

%% INTERACTIONS
A1 --> A2
A2 --> A4
A3 --> A4
A4 -->|Tauri IPC| B2
B1 --> B2
B2 --> B3
B3 -->|FFmpeg Command| S1
B2 --> B4
B4 -->|Cache Metadata & Thumbnails| S2
B2 --> B5
B5 --> D2

%% GIT FLOW
D3 --> D4
D4 -->|PR Merge| D5
D5 -->|Build Artifact (.app)| A1

%% DOCKER INTERACTIONS
D1 --> S2
D1 --> S3

%% PHASE FLOW
subgraph P["Development Lifecycle (24hr MVP)"]
    P1[Phase 1: Environment Setup<br>🟣 You configure Redis, FFmpeg, Docker]
    P2[Phase 2: Core Dev<br>Tauri + React + Kea + FFmpeg WASM]
    P3[Phase 3: Testing & Performance<br>Manual tests, Memory Profiling]
    P4[Phase 4: Packaging & Deployment<br>macOS .app Build, GitHub Release]
end

P1 --> P2
P2 --> P3
P3 --> P4
P4 -->|Release Tag| D3

%% CONNECTIONS BETWEEN LAYERS
A4 -.->|Send IPC Commands| B2
B2 -.->|Return Data/Events| A4
B3 -.->|Use FFmpeg CLI| S1
B4 -.->|Cache in Redis| S2
B5 -.->|Load ENV Config| D2

%% TESTING & MONITORING
subgraph T["Testing & Validation"]
    T1[Manual Tests - /tests/manual_tests.md]
    T2[Memory Tests - /tests/memory_test.rs]
end
P3 --> T1
P3 --> T2
T1 --> A2
T2 --> B3
```

---

### 🔍 Diagram Breakdown

| Layer                    | Description                                                                                    | Key Technologies               |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------ |
| **Frontend (React)**     | UI, timeline rendering, video preview, trim controls, Kea state management.                    | React, Kea, HTML5 video        |
| **Backend (Tauri/Rust)** | Handles FFmpeg processing, file system, caching, and system IPC.                               | Tauri, Rust, FFmpeg            |
| **System Services**      | Redis for caching metadata and thumbnails. Optional MinIO and Postgres for future scalability. | Redis, MinIO, PostgreSQL       |
| **Dev/Deploy Infra**     | Docker for service orchestration, GitHub for PR workflow, CI/CD builds for `.app`.             | Docker Compose, GitHub Actions |
| **Phases**               | Clear mapping from environment setup to deployment, aligned with your 24hr MVP delivery cycle. | Git-based iterative PRs        |

---

Would you like me to **generate a `.mmd` file** (for embedding or import into Draw.io/Figma/Mermaid Live)?
That would let you preview or version-control this diagram directly within your `docs/` folder in GitHub.

Here’s a comprehensive **task list and development plan** for the ClipForge MVP, derived directly from the PRD.
The document is formatted as `clip_forge_24hr_task_list.txt` and includes **phase-based breakdowns**, **file mappings**, **PR associations**, and **highlighted tasks (🟣)** for environment setup you’ll handle directly.

---

# 📘 clip_forge_24hr_task_list

**Repository:** `github.com/joaocarlinho/gauntlet-clip_forge-24hr-mvp`
**Goal:** Deliver functional macOS MVP by Tuesday 10:59 PM CT
**Phases:** Environment Setup → Development → MCP/Manual Testing → Deployment
**Branching Model:**

* `main` – stable release branch
* `dev` – ongoing development
* Feature branches for each PR (merged into `dev`, then `main`)

---

## 🧩 PHASE 1 – ENVIRONMENT CONFIGURATION (You)

| Task                                             | Description                                                                                                           | Files                                            | Responsible |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------- |
| **🟣 1.1 Install Dependencies**                  | Ensure **Node.js (18+)**, **Rust toolchain**, and **FFmpeg** (via Homebrew) are installed.                            | –                                                | You         |
| **🟣 1.2 Setup Project Repository**              | Create GitHub repo `gauntlet-clip_forge-24hr-mvp` (public). Initialize with `.gitignore`, `README.md`, and `LICENSE`. | `.gitignore`, `README.md`, `.github/workflows/*` | You         |
| **🟣 1.3 Initialize React + Tauri Project**      | Create Tauri app scaffold using Vite (React + TS). Verify `tauri dev` launches.                                       | `/src`, `/src-tauri`, `tauri.conf.json`          | You         |
| **🟣 1.4 Configure FFmpeg CLI Access**           | Install FFmpeg locally (`brew install ffmpeg`), confirm `$PATH` access.                                               | `.zshrc` / `.bash_profile`                       | You         |
| **🟣 1.5 Create Docker Compose Dev Environment** | Set up Redis (mandatory for MVP memory management). MinIO and Postgres optional for post-MVP.                         | `/docker-compose.dev.yml`                        | You         |
| **🟣 1.6 Add .env Files**                        | Define `.env.development` with Redis and optional services.                                                           | `.env.development`, `/src-tauri/src/config.rs`   | You         |
| **🟣 1.7 Verify Build Commands**                 | Test builds using `yarn tauri dev` and `yarn tauri build`.                                                            | –                                                | You         |
| **🟣 1.8 Initialize Git Workflow**               | Create `main`, `dev`, and `feature/*` branches. Configure PR template.                                                | `.github/PULL_REQUEST_TEMPLATE.md`               | You         |

**Deliverable PR #1: `feature/environment-setup` → `dev`**

---

## ⚙️ PHASE 2 – DEVELOPMENT

### PR #2: `feature/core-infrastructure`

**Goal:** Functional Tauri + React base app with working build and routing.

| Step | Task               | Description                                                     | Files                                                                                |
| ---- | ------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 2.1  | Create app shell   | Basic Tauri window, App.jsx structure, and React Router config. | `src/App.jsx`, `src/main.jsx`, `src-tauri/src/main.rs`                               |
| 2.2  | Add Kea logic base | Set up Kea store and project logic.                             | `src/logic/projectLogic.js`, `src/logic/timelineLogic.js`                            |
| 2.3  | Add UI skeleton    | Add Timeline, Player, and shared components folders.            | `/src/components/Timeline/*`, `/src/components/Player/*`, `/src/components/shared/*` |
| 2.4  | Basic styling      | Create `index.css` and minimal layout for MVP UI.               | `src/index.css`                                                                      |

---

### PR #3: `feature/import-and-preview`

**Goal:** Implement file import and preview features.

| Step | Task                               | Description                                        | Files                                                      |
| ---- | ---------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| 3.1  | Implement drag-and-drop            | Add `FileDropZone.jsx` for importing videos.       | `src/components/shared/FileDropZone.jsx`                   |
| 3.2  | Add file picker                    | Use HTML input for selecting MP4/MOV.              | Same as above                                              |
| 3.3  | Render video preview               | Integrate `<video>` tag and Tauri path conversion. | `src/components/Player/VideoPlayer.jsx`                    |
| 3.4  | Display imported clips on timeline | Basic DOM-based clip listing.                      | `src/components/Timeline/Timeline.jsx`, `timelineLogic.js` |

---

### PR #4: `feature/trim-functionality`

**Goal:** Enable in/out point trimming and UI reflection.

| Step | Task                    | Description                                  | Files                                    |
| ---- | ----------------------- | -------------------------------------------- | ---------------------------------------- |
| 4.1  | Add trim logic          | Add `setTrimPoints()` to `timelineLogic.js`. | `src/logic/timelineLogic.js`             |
| 4.2  | Add trim markers        | Visual in/out markers on timeline.           | `TimelineClip.jsx`, `TimelineCursor.jsx` |
| 4.3  | Preview trimmed section | Update player based on trim state.           | `VideoPlayer.jsx`, `timelineLogic.js`    |

---

### PR #5: `feature/video-export`

**Goal:** Implement basic export pipeline using @ffmpeg/ffmpeg (WASM).

| Step | Task                       | Description                                | Files                                                        |
| ---- | -------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| 5.1  | Add FFmpeg WASM dependency | `npm install @ffmpeg/ffmpeg`               | `package.json`                                               |
| 5.2  | Create export function     | Implement export logic with CRF 23 preset. | `src-tauri/src/ffmpeg.rs` (later), `src/utils/videoUtils.js` |
| 5.3  | Add export UI              | Simple export button and progress bar.     | `src/components/shared/Button.jsx`, `projectLogic.js`        |
| 5.4  | Notify user on completion  | Implement success/error states.            | `projectLogic.js`, `App.jsx`                                 |

---

### PR #6: `feature/performance-stability`

**Goal:** Ensure smooth UI, memory cleanup, and 15+ min runtime stability.

| Step | Task                        | Description                                 | Files                                  |
| ---- | --------------------------- | ------------------------------------------- | -------------------------------------- |
| 6.1  | Optimize Kea reducers       | Remove large binary state refs.             | `timelineLogic.js`, `projectLogic.js`  |
| 6.2  | Memory leak checks          | Use React cleanup and Tauri commands.       | `VideoPlayer.jsx`, `main.rs`           |
| 6.3  | Cache thumbnails in Redis   | Connect Redis to Tauri backend for caching. | `src-tauri/src/cache.rs`, `Cargo.toml` |
| 6.4  | Test multi-clip performance | Validate 10+ clip responsiveness.           | –                                      |

---

## 🧪 PHASE 3 – MCP / MANUAL TESTING

| Task | Description              | Files                                        |                          |
| ---- | ------------------------ | -------------------------------------------- | ------------------------ |
| 7.1  | Import/export test suite | Manual testing of all supported workflows.   | `/tests/manual_tests.md` |
| 7.2  | Memory profiling         | Test 15-minute sessions and memory usage.    | `tests/memory_test.rs`   |
| 7.3  | Export validation        | Test multiple CRF values and compare output. | –                        |
| 7.4  | UI responsiveness        | Ensure 30+ fps preview, no input lag.        | –                        |

**Deliverable PR #7: `feature/manual-testing` → `dev`**

---

## 🚀 PHASE 4 – DEPLOYMENT

| Task | Description           | Files                                                |                                 |
| ---- | --------------------- | ---------------------------------------------------- | ------------------------------- |
| 8.1  | Package macOS app     | `yarn tauri build` to generate `.app` bundle.        | `/src-tauri/tauri.conf.json`    |
| 8.2  | Test local install    | Run `.app` bundle, validate basic flows.             | –                               |
| 8.3  | Create GitHub Release | Tag version `v1.0.0-mvp` and attach `.app` artifact. | `.github/workflows/release.yml` |
| 8.4  | Document setup        | Write deployment and usage instructions.             | `README.md`                     |

**Deliverable PR #8: `release/mvp` → `main`**

---

## 📁 PROJECT FILE STRUCTURE

```
gauntlet-clip_forge-24hr-mvp/
├── src/                      # React frontend
│   ├── components/
│   │   ├── Timeline/
│   │   ├── Player/
│   │   └── shared/
│   ├── logic/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
│
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── ffmpeg.rs
│   │   ├── cache.rs
│   │   └── config.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── tests/
│   ├── memory_test.rs
│   └── manual_tests.md
│
├── docker-compose.dev.yml
├── .env.development
├── package.json
├── README.md
└── LICENSE
```

---

## ✅ GIT & PR CHECKLIST SUMMARY

| Phase | PR Branch                       | Description                       | Merge Target |
| ----- | ------------------------------- | --------------------------------- | ------------ |
| 1     | `feature/environment-setup`     | Env configuration and scaffolding | `dev`        |
| 2     | `feature/core-infrastructure`   | Base Tauri + React + Kea setup    | `dev`        |
| 3     | `feature/import-and-preview`    | File import + video playback      | `dev`        |
| 4     | `feature/trim-functionality`    | Clip trimming logic               | `dev`        |
| 5     | `feature/video-export`          | Export and FFmpeg integration     | `dev`        |
| 6     | `feature/performance-stability` | Stability, caching, optimization  | `dev`        |
| 7     | `feature/manual-testing`        | Manual validation and QA          | `dev`        |
| 8     | `release/mvp`                   | Packaged app + documentation      | `main`       |

---

Would you like me to generate this as a **`.txt` file** ready for download (e.g., `clip_forge_24hr_task_list.txt`)?
It will include the same formatting and indentation for direct inclusion in your repo’s `/docs` folder.

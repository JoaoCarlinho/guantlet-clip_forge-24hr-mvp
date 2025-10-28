import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useValues } from "kea";
import { timelineLogic } from "./logic/timelineLogic";
import Timeline from "./components/Timeline/Timeline";
import VideoPlayer from "./components/Player/VideoPlayer";
import ExportPanel from "./components/shared/ExportPanel";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>ClipForge</h1>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<EditorView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Main editor view component
function EditorView() {
  const { clips } = useValues(timelineLogic);

  return (
    <div className="editor-view">
      <div className="editor-layout">
        {/* Player area - top section */}
        <section className="player-section">
          <VideoPlayer />
        </section>

        {/* Timeline area - bottom section */}
        <section className="timeline-section">
          <Timeline />
        </section>

        {/* Export panel - side panel */}
        {clips.length > 0 && (
          <aside className="export-sidebar">
            <ExportPanel />
          </aside>
        )}
      </div>
    </div>
  );
}

export default App;

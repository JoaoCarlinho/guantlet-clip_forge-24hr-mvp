import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useValues } from "kea";
import { useEffect } from "react";
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

  // Window-level drag handlers to ensure drag-drop events are captured
  // This is critical for both browser and Tauri environments
  useEffect(() => {
    console.log('🎯 Setting up window-level drag handlers');

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      // Set dropEffect to indicate we can accept files
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      // Prevent default to avoid browser opening the file
      e.preventDefault();
      console.log('🪟 Window drop event caught (preventing default behavior)');
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    console.log('✅ Window-level drag handlers registered');

    return () => {
      console.log('🧹 Cleaning up window-level drag handlers');
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

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

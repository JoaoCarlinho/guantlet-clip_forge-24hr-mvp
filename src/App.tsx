import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Timeline from "./components/Timeline/Timeline";
import VideoPlayer from "./components/Player/VideoPlayer";
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
      </div>
    </div>
  );
}

export default App;

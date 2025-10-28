import React from "react";
import ReactDOM from "react-dom/client";
import { resetContext } from "kea";
import App from "./App";
import "./index.css";

// Initialize Kea
resetContext({
  debug: import.meta.env.DEV,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

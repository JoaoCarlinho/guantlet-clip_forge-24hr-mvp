import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Vite options tailored for Tauri development
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    // IMPORTANT: COOP/COEP headers are DISABLED to allow getDisplayMedia() for screen recording
    // These headers are required for SharedArrayBuffer (used by FFmpeg.wasm for MP4 conversion),
    // but they BLOCK the browser's screen picker UI.
    //
    // Trade-off: Browser version gets WebM files (no MP4 conversion)
    //            Desktop version still gets MP4 (via native FFmpeg recording)
    //
    // See COOP_COEP_ISSUE_SOLUTION.md for details
    //
    // headers: {
    //   "Cross-Origin-Embedder-Policy": "require-corp",
    //   "Cross-Origin-Opener-Policy": "same-origin",
    // },
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
});

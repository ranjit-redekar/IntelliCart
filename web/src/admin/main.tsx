import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./lib/theme";
import { SessionProvider } from "./lib/session";
import { ToastProvider } from "../lib/toast";
import "../index.css";

// Pages load as separate chunks. A tab left open across a deploy asks for
// chunk files that no longer exist; reload once to pick up the new build
// instead of crashing to a blank screen. The flag stops a reload loop.
window.addEventListener("vite:preloadError", () => {
  try {
    if (sessionStorage.getItem("chunk-reload")) return;
    sessionStorage.setItem("chunk-reload", "1");
  } catch {
    return;
  }
  window.location.reload();
});
try {
  sessionStorage.removeItem("chunk-reload");
} catch {
  /* storage blocked */
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <SessionProvider>
        <HashRouter>
          <ToastProvider>
            <App />
          </ToastProvider>
        </HashRouter>
      </SessionProvider>
    </ThemeProvider>
  </StrictMode>
);

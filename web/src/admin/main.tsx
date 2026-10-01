import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./lib/theme";
import { SessionProvider } from "./lib/session";
import { ToastProvider } from "../lib/toast";
import "../index.css";

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

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { PowerSyncProvider } from "@/lib/powersync/PowerSyncProvider";
import App from "./App";
import "./index.css";

// Register service worker for offline app shell
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(
      (reg) => console.debug("[SW] registered:", reg.scope),
      (err) => console.warn("[SW] registration failed:", err),
    );
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PowerSyncProvider>
          <App />
        </PowerSyncProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { PowerSyncProvider } from "@/lib/powersync/PowerSyncProvider";
import App from "./App";
import "./index.css";

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

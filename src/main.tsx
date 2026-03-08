import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PowerSyncProvider } from "@/lib/powersync/PowerSyncProvider";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <PowerSyncProvider>
        <App />
      </PowerSyncProvider>
    </BrowserRouter>
  </StrictMode>,
);

import React from "react";
import ReactDOM from "react-dom/client";
import { App, PlatformProvider } from "@floatt/app";
import "@floatt/app/styles/globals.css";
import { desktopPlatform } from "./platform.desktop";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PlatformProvider platform={desktopPlatform}>
      <App />
    </PlatformProvider>
  </React.StrictMode>,
);

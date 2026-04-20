import React from "react";
import ReactDOM from "react-dom/client";
import { App, PlatformProvider } from "@floatt/app";
import "@floatt/app/styles/globals.css";
import { webPlatform } from "./platform.web";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PlatformProvider platform={webPlatform}>
      <App />
    </PlatformProvider>
  </React.StrictMode>,
);

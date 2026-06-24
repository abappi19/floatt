"use client";

import { App, PlatformProvider } from "@floatt/app";
import { webPlatform } from "../src/platform.web";

export default function FloattApp() {
  return (
    <PlatformProvider platform={webPlatform}>
      <App />
    </PlatformProvider>
  );
}

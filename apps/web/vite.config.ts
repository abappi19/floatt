import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": new URL("../../packages/app/src", import.meta.url).pathname,
    },
  },
  optimizeDeps: {
    exclude: ["@floatt/app"],
  },
});

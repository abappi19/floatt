/** @type {import('next').NextConfig} */
const nextConfig = {
  // Floatt has no backend — everything is client-side (IndexedDB/Dexie).
  // Emit a fully static site to `out/` (same kind of artifact Vite produced).
  output: "export",
  reactStrictMode: true,
  // Compile the shared workspace package from source (the Next equivalent of
  // Vite's `optimizeDeps.exclude: ["@floatt/app"]`).
  transpilePackages: ["@floatt/app"],
  // `next/image` optimization requires a server; disable it for static export.
  images: { unoptimized: true },
};

export default nextConfig;

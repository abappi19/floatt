/**
 * Normalizes a bundled image import to a usable `src` string.
 *
 * Vite (desktop) resolves `import x from "./x.png"` to a URL string, while
 * Next.js (web) resolves it to a `StaticImageData` object ({ src, ... }).
 * Accepting both keeps shared `<img>` usage working across bundlers.
 */
export function assetSrc(asset: string | { src: string }): string {
  return typeof asset === "string" ? asset : asset.src;
}

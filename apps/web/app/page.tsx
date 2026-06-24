"use client";

import dynamic from "next/dynamic";

// Floatt is entirely client-side (IndexedDB/Dexie, Notifications, localStorage,
// Dexie live queries). Disable SSR so none of it runs during static prerender.
const FloattApp = dynamic(() => import("./FloattApp"), { ssr: false });

export default function Page() {
  return <FloattApp />;
}

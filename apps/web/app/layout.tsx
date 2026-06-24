import type { Metadata, Viewport } from "next";
import "@floatt/app/styles/globals.css";

export const metadata: Metadata = {
  title: "Floatt",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

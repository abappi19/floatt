import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "floatt:sheet-width";
const MIN_WIDTH = 280;
const DEFAULT_WIDTH = 400;

function readStoredWidth(): number {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= MIN_WIDTH ? parsed : DEFAULT_WIDTH;
}

function clampWidth(width: number): number {
  const max = Math.max(MIN_WIDTH, Math.floor(window.innerWidth * 0.9));
  return Math.min(Math.max(width, MIN_WIDTH), max);
}

export function useResizableSheetWidth() {
  const [width, setWidth] = useState<number>(() => readStoredWidth());
  const [dragging, setDragging] = useState(false);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    setWidth((w) => clampWidth(w));
    const onResize = () => setWidth((w) => clampWidth(w));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    setDragging(true);

    const handleMove = (ev: PointerEvent) => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        setWidth(clampWidth(window.innerWidth - ev.clientX));
      });
    };

    const handleUp = (ev: PointerEvent) => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
      frame.current = null;
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerup", handleUp);
      target.removeEventListener("pointercancel", handleUp);
      setDragging(false);
      setWidth((w) => {
        window.localStorage.setItem(STORAGE_KEY, String(w));
        return w;
      });
    };

    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerup", handleUp);
    target.addEventListener("pointercancel", handleUp);
  }, []);

  return { width, dragging, onPointerDown };
}

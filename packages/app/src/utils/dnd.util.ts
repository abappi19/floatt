export function toTransform(
  t: { x: number; y: number; scaleX: number; scaleY: number } | null,
): string | undefined {
  if (!t) return undefined;
  return `translate3d(${t.x}px, ${t.y}px, 0) scaleX(${t.scaleX}) scaleY(${t.scaleY})`;
}

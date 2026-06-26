import { assetSrc } from "@/utils";
import highlandsImg from "@/assets/themes/highlands.jpg";
import fjordImg from "@/assets/themes/fjord.jpg";
import cascadeImg from "@/assets/themes/cascade.jpg";
import valleyImg from "@/assets/themes/valley.jpg";
import canyonImg from "@/assets/themes/canyon.jpg";
import coastImg from "@/assets/themes/coast.jpg";
import alpenglowImg from "@/assets/themes/alpenglow.jpg";
import saltflatImg from "@/assets/themes/saltflat.jpg";
import harvestImg from "@/assets/themes/harvest.jpg";
import alpineImg from "@/assets/themes/alpine.jpg";
import canalImg from "@/assets/themes/canal.jpg";

export const THEME_IDS = [
  "default",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "crimson",
  "coral",
  "amber",
  "gold",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "ocean",
  "azure",
  "sapphire",
  "slate",
  "graphite",
  "sand",
  // image (mesh-gradient wallpaper) themes
  "aurora",
  "sunrise",
  "lagoon",
  "blossom",
  "dusk",
  "meadow",
  // photo themes
  "highlands",
  "fjord",
  "cascade",
  "valley",
  "canyon",
  "coast",
  "alpenglow",
  "saltflat",
  "harvest",
  "alpine",
  "canal",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];
export type ThemeKind = "color" | "image";

type Shape = "dots" | "waves" | "grid" | "diag";

export interface ThemeVars {
  primary: string;
  accent: string;
  accentForeground: string;
  /** background-image for the surface (gradient, or a mesh of radial gradients). */
  bg: string;
  /** solid base color under the background-image (used by mesh/image themes). */
  bgColor?: string;
  /** optional pattern overlay (SVG data URI). color themes only. */
  pattern?: string;
  patternSize?: string;
}

export interface ThemeDef {
  id: ThemeId;
  label: string;
  kind: ThemeKind;
  light: ThemeVars;
  dark: ThemeVars;
}

function patternUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function shapeSvg(shape: Shape, ink: string, op: number): string {
  const ns = "http://www.w3.org/2000/svg";
  switch (shape) {
    case "dots":
      return `<svg xmlns='${ns}' width='20' height='20'><circle cx='2' cy='2' r='1.2' fill='${ink}' fill-opacity='${op}'/></svg>`;
    case "waves":
      return `<svg xmlns='${ns}' width='56' height='28'><path d='M0 14c14 0 14-9 28-9s14 9 28 9' fill='none' stroke='${ink}' stroke-opacity='${op}' stroke-width='2'/></svg>`;
    case "grid":
      return `<svg xmlns='${ns}' width='24' height='24'><path d='M24 0H0V24' fill='none' stroke='${ink}' stroke-opacity='${op}' stroke-width='1'/></svg>`;
    case "diag":
      return `<svg xmlns='${ns}' width='16' height='16'><path d='M0 16L16 0' stroke='${ink}' stroke-opacity='${op}' stroke-width='1.5'/></svg>`;
  }
}

const SHAPE_SIZE: Record<Shape, string> = {
  dots: "20px 20px",
  waves: "56px 28px",
  grid: "24px 24px",
  diag: "16px 16px",
};

/** Solid-color theme from a hue: accent palette + tinted gradient + pattern overlay. */
function makeTheme(
  id: ThemeId,
  label: string,
  hue: number,
  shape: Shape,
  c = 1,
): ThemeDef {
  return {
    id,
    label,
    kind: "color",
    light: {
      primary: `oklch(0.55 ${0.19 * c} ${hue})`,
      accent: `oklch(0.9 ${0.08 * c} ${hue})`,
      accentForeground: `oklch(0.3 ${0.1 * c} ${hue})`,
      bg: `linear-gradient(155deg, oklch(0.94 ${0.07 * c} ${hue}), oklch(0.83 ${0.15 * c} ${hue}))`,
      pattern: patternUri(shapeSvg(shape, "black", 0.07)),
      patternSize: SHAPE_SIZE[shape],
    },
    dark: {
      primary: `oklch(0.74 ${0.18 * c} ${hue})`,
      accent: `oklch(0.32 ${0.1 * c} ${hue})`,
      accentForeground: `oklch(0.93 ${0.04 * c} ${hue})`,
      bg: `linear-gradient(155deg, oklch(0.22 ${0.11 * c} ${hue}), oklch(0.32 ${0.17 * c} ${hue}))`,
      pattern: patternUri(shapeSvg(shape, "white", 0.1)),
      patternSize: SHAPE_SIZE[shape],
    },
  };
}

type Spot = [x: number, y: number, l: number, c: number, h: number, r: number];

function meshBg(spots: Spot[]): string {
  return spots
    .map(
      ([x, y, l, c, h, r]) =>
        `radial-gradient(circle at ${x}% ${y}%, oklch(${l} ${c} ${h}) 0, transparent ${r}%)`,
    )
    .join(", ");
}

/** Image theme: a mesh-gradient "wallpaper" with its own light and dark scene. */
function imageTheme(
  id: ThemeId,
  label: string,
  hue: number,
  light: { base: string; spots: Spot[] },
  dark: { base: string; spots: Spot[] },
): ThemeDef {
  return {
    id,
    label,
    kind: "image",
    light: {
      primary: `oklch(0.55 0.19 ${hue})`,
      accent: `oklch(0.9 0.08 ${hue})`,
      accentForeground: `oklch(0.3 0.1 ${hue})`,
      bgColor: light.base,
      bg: meshBg(light.spots),
    },
    dark: {
      primary: `oklch(0.74 0.18 ${hue})`,
      accent: `oklch(0.32 0.1 ${hue})`,
      accentForeground: `oklch(0.93 0.04 ${hue})`,
      bgColor: dark.base,
      bg: meshBg(dark.spots),
    },
  };
}

/**
 * Photo theme: a real image background with a mode-aware scrim so the header
 * text stays legible (lightens the photo in light mode, darkens it in dark).
 */
function photoTheme(
  id: ThemeId,
  label: string,
  hue: number,
  img: string | { src: string },
): ThemeDef {
  const url = `url("${assetSrc(img)}")`;
  return {
    id,
    label,
    kind: "image",
    light: {
      primary: `oklch(0.55 0.19 ${hue})`,
      accent: `oklch(0.9 0.08 ${hue})`,
      accentForeground: `oklch(0.3 0.1 ${hue})`,
      bgColor: `oklch(0.9 0.02 ${hue})`,
      bg: `linear-gradient(180deg, oklch(0.99 0 0 / 0.5), oklch(0.96 0 0 / 0.12)), ${url}`,
    },
    dark: {
      primary: `oklch(0.74 0.18 ${hue})`,
      accent: `oklch(0.32 0.1 ${hue})`,
      accentForeground: `oklch(0.93 0.04 ${hue})`,
      bgColor: `oklch(0.15 0.02 ${hue})`,
      bg: `linear-gradient(180deg, oklch(0.13 0 0 / 0.55), oklch(0.13 0 0 / 0.28)), ${url}`,
    },
  };
}

const DEFAULT_THEME: ThemeDef = {
  id: "default",
  label: "Default",
  kind: "color",
  light: {
    primary: "oklch(0.52 0.24 275)",
    accent: "oklch(0.945 0.018 280)",
    accentForeground: "oklch(0.2 0.04 280)",
    bg: "none",
  },
  dark: {
    primary: "oklch(0.68 0.22 275)",
    accent: "oklch(0.23 0.03 280)",
    accentForeground: "oklch(0.92 0.01 280)",
    bg: "none",
  },
};

export const THEMES: readonly ThemeDef[] = [
  DEFAULT_THEME,
  makeTheme("indigo", "Indigo", 275, "waves"),
  makeTheme("violet", "Violet", 300, "dots"),
  makeTheme("purple", "Purple", 315, "grid"),
  makeTheme("fuchsia", "Fuchsia", 330, "diag"),
  makeTheme("pink", "Pink", 350, "dots"),
  makeTheme("rose", "Rose", 15, "waves"),
  makeTheme("crimson", "Crimson", 25, "grid"),
  makeTheme("coral", "Coral", 40, "diag"),
  makeTheme("amber", "Amber", 70, "dots"),
  makeTheme("gold", "Gold", 95, "grid"),
  makeTheme("lime", "Lime", 125, "diag"),
  makeTheme("green", "Green", 145, "dots"),
  makeTheme("emerald", "Emerald", 162, "waves"),
  makeTheme("teal", "Teal", 185, "grid"),
  makeTheme("cyan", "Cyan", 200, "diag"),
  makeTheme("sky", "Sky", 225, "dots"),
  makeTheme("ocean", "Ocean", 235, "waves"),
  makeTheme("azure", "Azure", 250, "grid"),
  makeTheme("sapphire", "Sapphire", 265, "diag"),
  makeTheme("slate", "Slate", 250, "grid", 0.28),
  makeTheme("graphite", "Graphite", 285, "dots", 0.14),
  makeTheme("sand", "Sand", 75, "grid", 0.35),
  imageTheme(
    "aurora",
    "Aurora",
    175,
    {
      base: "oklch(0.95 0.04 200)",
      spots: [
        [15, 25, 0.9, 0.13, 170, 55],
        [85, 12, 0.88, 0.13, 310, 55],
        [70, 88, 0.9, 0.12, 250, 50],
      ],
    },
    {
      base: "oklch(0.16 0.035 220)",
      spots: [
        [15, 25, 0.5, 0.16, 170, 55],
        [85, 12, 0.46, 0.17, 310, 55],
        [70, 88, 0.48, 0.15, 250, 50],
      ],
    },
  ),
  imageTheme(
    "sunrise",
    "Sunrise",
    40,
    {
      base: "oklch(0.95 0.05 70)",
      spots: [
        [20, 85, 0.9, 0.13, 30, 60],
        [80, 20, 0.93, 0.12, 75, 55],
        [50, 45, 0.88, 0.12, 350, 45],
      ],
    },
    {
      base: "oklch(0.17 0.045 35)",
      spots: [
        [20, 85, 0.5, 0.16, 30, 60],
        [80, 20, 0.5, 0.15, 75, 55],
        [50, 40, 0.45, 0.16, 350, 45],
      ],
    },
  ),
  imageTheme(
    "lagoon",
    "Lagoon",
    210,
    {
      base: "oklch(0.95 0.04 220)",
      spots: [
        [20, 25, 0.9, 0.12, 200, 55],
        [85, 30, 0.9, 0.12, 235, 55],
        [55, 90, 0.91, 0.11, 180, 50],
      ],
    },
    {
      base: "oklch(0.16 0.04 225)",
      spots: [
        [20, 25, 0.48, 0.15, 200, 55],
        [85, 30, 0.46, 0.16, 235, 55],
        [55, 90, 0.5, 0.14, 180, 50],
      ],
    },
  ),
  imageTheme(
    "blossom",
    "Blossom",
    350,
    {
      base: "oklch(0.96 0.04 350)",
      spots: [
        [25, 20, 0.92, 0.11, 350, 55],
        [80, 25, 0.9, 0.12, 20, 55],
        [60, 90, 0.91, 0.1, 320, 50],
      ],
    },
    {
      base: "oklch(0.17 0.04 350)",
      spots: [
        [25, 20, 0.48, 0.15, 350, 55],
        [80, 25, 0.46, 0.16, 20, 55],
        [60, 90, 0.48, 0.14, 320, 50],
      ],
    },
  ),
  imageTheme(
    "dusk",
    "Dusk",
    285,
    {
      base: "oklch(0.94 0.04 280)",
      spots: [
        [20, 20, 0.9, 0.12, 285, 55],
        [85, 25, 0.88, 0.12, 320, 55],
        [55, 90, 0.9, 0.11, 250, 50],
      ],
    },
    {
      base: "oklch(0.15 0.04 280)",
      spots: [
        [20, 20, 0.46, 0.16, 285, 55],
        [85, 25, 0.44, 0.16, 320, 55],
        [55, 90, 0.48, 0.15, 250, 50],
      ],
    },
  ),
  imageTheme(
    "meadow",
    "Meadow",
    140,
    {
      base: "oklch(0.95 0.05 135)",
      spots: [
        [20, 25, 0.91, 0.13, 130, 55],
        [85, 20, 0.92, 0.12, 110, 55],
        [60, 90, 0.9, 0.12, 160, 50],
      ],
    },
    {
      base: "oklch(0.16 0.04 140)",
      spots: [
        [20, 25, 0.5, 0.15, 130, 55],
        [85, 20, 0.48, 0.15, 110, 55],
        [60, 90, 0.5, 0.14, 160, 50],
      ],
    },
  ),
  photoTheme("highlands", "Highlands", 150, highlandsImg),
  photoTheme("fjord", "Fjord", 235, fjordImg),
  photoTheme("cascade", "Cascade", 155, cascadeImg),
  photoTheme("valley", "Valley", 145, valleyImg),
  photoTheme("canyon", "Canyon", 40, canyonImg),
  photoTheme("coast", "Coast", 230, coastImg),
  photoTheme("alpenglow", "Alpenglow", 20, alpenglowImg),
  photoTheme("saltflat", "Salt Flat", 230, saltflatImg),
  photoTheme("harvest", "Harvest", 65, harvestImg),
  photoTheme("alpine", "Alpine", 220, alpineImg),
  photoTheme("canal", "Canal", 200, canalImg),
];

const THEMES_BY_ID = new Map<string, ThemeDef>(THEMES.map((t) => [t.id, t]));

export function isThemeId(value: string): value is ThemeId {
  return THEMES_BY_ID.has(value);
}

/** Background-image/size/color props for a theme surface in the given mode. */
function themeBackground(v: ThemeVars): Record<string, string> {
  if (v.bg === "none") return { backgroundImage: "none" };
  const imgs: string[] = [];
  const sizes: string[] = [];
  const reps: string[] = [];
  if (v.pattern) {
    imgs.push(v.pattern);
    sizes.push(v.patternSize ?? "20px 20px");
    reps.push("repeat");
  }
  imgs.push(v.bg);
  sizes.push("cover");
  reps.push("no-repeat");
  const out: Record<string, string> = {
    backgroundImage: imgs.join(", "),
    backgroundSize: sizes.join(", "),
    backgroundRepeat: reps.join(", "),
    backgroundPosition: "center",
  };
  if (v.bgColor) out.backgroundColor = v.bgColor;
  return out;
}

/** Inline style for the task-list pane: accent tokens + the themed background. */
export function themeStyle(
  id: string,
  mode: "light" | "dark",
): Record<string, string> {
  const def = THEMES_BY_ID.get(id) ?? DEFAULT_THEME;
  const v = mode === "dark" ? def.dark : def.light;
  return {
    "--primary": v.primary,
    "--ring": v.primary,
    "--accent": v.accent,
    "--accent-foreground": v.accentForeground,
    ...themeBackground(v),
  };
}

/** A real preview of the theme surface for a picker swatch. */
export function themeSwatchStyle(
  id: string,
  mode: "light" | "dark",
): Record<string, string> {
  const def = THEMES_BY_ID.get(id) ?? DEFAULT_THEME;
  const v = mode === "dark" ? def.dark : def.light;
  if (v.bg === "none") {
    return {
      background:
        mode === "dark" ? "oklch(0.18 0.025 280)" : "oklch(0.995 0.004 90)",
    };
  }
  return themeBackground(v);
}

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
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

type Shape = "dots" | "waves" | "grid" | "diag";

export interface ThemeVars {
  primary: string;
  accent: string;
  accentForeground: string;
  /** background-image for the surface (gradient). */
  bg: string;
  /** optional pattern overlay (SVG data URI), distinct per light/dark. */
  pattern?: string;
  patternSize?: string;
}

export interface ThemeDef {
  id: ThemeId;
  label: string;
  /** CSS background for the picker swatch — mirrors the light surface. */
  swatch: string;
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

/**
 * Build a theme from a hue. Light and dark each get their own gradient and their
 * own pattern (dark ink on light, light ink on dark) — macOS-style paired
 * backgrounds. Dark surfaces are intentionally lifted in lightness + chroma so
 * the theme stays clearly visible against the near-black base.
 */
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
    swatch: `linear-gradient(135deg, oklch(0.93 ${0.05 * c} ${hue}), oklch(0.85 ${0.1 * c} ${hue}))`,
    light: {
      primary: `oklch(0.55 ${0.18 * c} ${hue})`,
      accent: `oklch(0.93 ${0.05 * c} ${hue})`,
      accentForeground: `oklch(0.3 ${0.08 * c} ${hue})`,
      bg: `linear-gradient(160deg, oklch(0.975 ${0.025 * c} ${hue}), oklch(0.9 ${0.075 * c} ${hue}))`,
      pattern: patternUri(shapeSvg(shape, "black", 0.05)),
      patternSize: SHAPE_SIZE[shape],
    },
    dark: {
      primary: `oklch(0.72 ${0.18 * c} ${hue})`,
      accent: `oklch(0.28 ${0.07 * c} ${hue})`,
      accentForeground: `oklch(0.92 ${0.03 * c} ${hue})`,
      bg: `linear-gradient(160deg, oklch(0.22 ${0.08 * c} ${hue}), oklch(0.29 ${0.12 * c} ${hue}))`,
      pattern: patternUri(shapeSvg(shape, "white", 0.07)),
      patternSize: SHAPE_SIZE[shape],
    },
  };
}

const DEFAULT_THEME: ThemeDef = {
  id: "default",
  label: "Default",
  swatch: "oklch(0.96 0.012 280)",
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
];

const THEMES_BY_ID = new Map<string, ThemeDef>(THEMES.map((t) => [t.id, t]));

export function isThemeId(value: string): value is ThemeId {
  return THEMES_BY_ID.has(value);
}

/** Inline CSS-variable overrides for a theme in the given mode. */
export function themeStyle(
  id: string,
  mode: "light" | "dark",
): Record<string, string> {
  const def = THEMES_BY_ID.get(id) ?? DEFAULT_THEME;
  const v = mode === "dark" ? def.dark : def.light;
  const style: Record<string, string> = {
    "--primary": v.primary,
    "--ring": v.primary,
    "--accent": v.accent,
    "--accent-foreground": v.accentForeground,
    "--theme-bg": v.bg,
  };
  if (v.pattern) {
    style["--theme-pattern"] = v.pattern;
    style["--theme-pattern-size"] = v.patternSize ?? "24px 24px";
  }
  return style;
}

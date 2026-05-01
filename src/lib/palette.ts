import type { ColorId, LogoId, QrColorId } from "./types";
import { CARD_GEOM_SCALE } from "./print";

const G = CARD_GEOM_SCALE;

// ─── Color ID normalization ──────────────────────────────────────────────────

const VALID_COLOR_IDS = new Set<ColorId>([
  "claret",
  "cream",
  "burgundy",
  "black",
  "white",
  "gray",
  "grayLight",
  "grayLine",
  "graySoft",
  "grayDark",
]);

/** Map legacy Folk Devils palette ids + previous La Volta names to La Volta. */
const LEGACY_COLOR_MAP: Record<string, ColorId> = {
  dark: "claret",
  oxblood: "claret",
  white: "white",
  yellow: "cream",
  black: "black",
  pink: "burgundy",
  deep: "black",
  red: "burgundy",
  green: "grayDark",
};

/** Keep palette ids as-is and pass through #rrggbb custom colors. */
export function normalizeColorValue(color: unknown, fallback: ColorId = "claret"): string {
  if (typeof color === "string") {
    const t = color.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t)) return t;
    const mapped = LEGACY_COLOR_MAP[t];
    if (mapped) return mapped;
    if (VALID_COLOR_IDS.has(t as ColorId)) return t;
  }
  return fallback;
}

/** Back-compat shim used by older call sites. */
export function normalizeColorId(color: unknown): ColorId {
  const v = normalizeColorValue(color);
  return (VALID_COLOR_IDS.has(v as ColorId) ? v : "claret") as ColorId;
}

/** Normalize a CSS color to #rrggbb for `<input type="color">` (RGB only). */
export function toHex6ForColorInput(css: string): string {
  const t = css.trim();
  const rgba = t.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgba) {
    const r = Math.min(255, Math.max(0, Number(rgba[1])));
    const g = Math.min(255, Math.max(0, Number(rgba[2])));
    const b = Math.min(255, Math.max(0, Number(rgba[3])));
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  }
  const m3 = t.match(/^#([0-9a-f]{3})$/i);
  if (m3) {
    const x = m3[1].toLowerCase();
    return `#${x[0]}${x[0]}${x[1]}${x[1]}${x[2]}${x[2]}`;
  }
  const m6 = t.match(/^#([0-9a-f]{6})$/i);
  if (m6) return `#${m6[1].toLowerCase()}`;
  return "#000000";
}

// ─── Logo normalization ──────────────────────────────────────────────────────

const VALID_LOGO_IDS = new Set<LogoId>(["lg_full", "ic_full", "none"]);

/** Map removed / legacy logo variants to the La Volta wordmark. */
export function normalizeLogoId(logo: unknown): LogoId {
  if (logo === "none") return "none";
  if (logo === "ic_full" || (typeof logo === "string" && logo.startsWith("ic_"))) return "lg_full";
  if (VALID_LOGO_IDS.has(logo as LogoId)) return logo as LogoId;
  return "lg_full";
}

// ─── Logo scale + offset clamps ─────────────────────────────────────────────

const LOGO_SCALE_MIN = 0.5;
/** Non-centered layouts need room for a big crest; centered uses its own hero size. */
const LOGO_SCALE_MAX = 3.5;

export function clampLogoScale(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 1;
  return Math.min(LOGO_SCALE_MAX, Math.max(LOGO_SCALE_MIN, x));
}

export const LOGO_SCALE_RANGE = { min: LOGO_SCALE_MIN, max: LOGO_SCALE_MAX, step: 0.05 } as const;

export const DEFAULT_LOGO_SCALE = 1.55;
export const DEFAULT_LOGO_OFFSET_X = Math.round(-42 * G);
export const DEFAULT_LOGO_OFFSET_Y = Math.round(2 * G);

/** Slider limits for position nudgers (SVG viewBox units). */
export const LOGO_OFFSET_RANGE = {
  x: Math.round(120 * G),
  y: Math.round(100 * G),
  step: 2,
} as const;
export const TEXT_OFFSET_RANGE = {
  x: Math.round(120 * G),
  y: Math.round(60 * G),
  step: 2,
} as const;

function clampNumber(n: unknown, limit: number): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.min(limit, Math.max(-limit, x));
}

export function clampLogoOffsetX(n: unknown): number {
  return clampNumber(n, LOGO_OFFSET_RANGE.x);
}
export function clampLogoOffsetY(n: unknown): number {
  return clampNumber(n, LOGO_OFFSET_RANGE.y);
}
export function clampTextOffsetX(n: unknown): number {
  return clampNumber(n, TEXT_OFFSET_RANGE.x);
}
export function clampTextOffsetY(n: unknown): number {
  return clampNumber(n, TEXT_OFFSET_RANGE.y);
}

// ─── Color palette ───────────────────────────────────────────────────────────

export type ColorDef = {
  id: ColorId;
  name: string;
  /** CSS background (for swatch chip) */
  sw: string;
  /** Card fill — either a solid hex or a linear gradient descriptor */
  fill:
    | { type: "solid"; color: string }
    | { type: "gradient"; from: string; to: string; angle: number };
  /** Primary text color on this background */
  text: string;
  /** Secondary/label text color */
  sub: string;
  /** Divider/hairline color */
  hair: string;
};

export const COLORS: ColorDef[] = [
  {
    id: "claret",
    name: "Claret",
    sw: "#491E29",
    fill: { type: "solid", color: "#491E29" },
    text: "#F6F4E8",
    sub: "rgba(246,244,232,0.78)",
    hair: "rgba(246,244,232,0.22)",
  },
  {
    id: "cream",
    name: "Cream",
    sw: "#F6F4E8",
    fill: { type: "solid", color: "#F6F4E8" },
    text: "#6B1E2D",
    sub: "rgba(107,30,45,0.72)",
    hair: "rgba(107,30,45,0.18)",
  },
  {
    id: "burgundy",
    name: "Burgundy",
    sw: "#6B1E2D",
    fill: { type: "solid", color: "#6B1E2D" },
    text: "#F6F4E8",
    sub: "rgba(246,244,232,0.78)",
    hair: "rgba(246,244,232,0.22)",
  },
  {
    id: "black",
    name: "Black",
    sw: "#000000",
    fill: { type: "solid", color: "#000000" },
    text: "#F6F4E8",
    sub: "rgba(246,244,232,0.62)",
    hair: "rgba(246,244,232,0.18)",
  },
  {
    id: "white",
    name: "White",
    sw: "#FFFFFF",
    fill: { type: "solid", color: "#FFFFFF" },
    text: "#6B1E2D",
    sub: "rgba(107,30,45,0.65)",
    hair: "rgba(107,30,45,0.14)",
  },
  {
    id: "gray",
    name: "Gray 666",
    sw: "#666666",
    fill: { type: "solid", color: "#666666" },
    text: "#FFFFFF",
    sub: "rgba(255,255,255,0.72)",
    hair: "rgba(255,255,255,0.2)",
  },
  {
    id: "grayLight",
    name: "EFEFEF",
    sw: "#EFEFEF",
    fill: { type: "solid", color: "#EFEFEF" },
    text: "#383838",
    sub: "rgba(56,56,56,0.65)",
    hair: "rgba(56,56,56,0.12)",
  },
  {
    id: "grayLine",
    name: "DEDEDE",
    sw: "#DEDEDE",
    fill: { type: "solid", color: "#DEDEDE" },
    text: "#383838",
    sub: "rgba(56,56,56,0.62)",
    hair: "rgba(56,56,56,0.14)",
  },
  {
    id: "graySoft",
    name: "D0D0D0",
    sw: "#D0D0D0",
    fill: { type: "solid", color: "#D0D0D0" },
    text: "#383838",
    sub: "rgba(56,56,56,0.6)",
    hair: "rgba(56,56,56,0.14)",
  },
  {
    id: "grayDark",
    name: "Charcoal",
    sw: "#383838",
    fill: { type: "solid", color: "#383838" },
    text: "#F6F4E8",
    sub: "rgba(246,244,232,0.65)",
    hair: "rgba(246,244,232,0.16)",
  },
];

// ─── Logo definitions ────────────────────────────────────────────────────────

export type LogoDef = {
  id: LogoId;
  label: string;
  src: string | null;
  kind: "wordmark" | "icon" | "none";
  /** Intrinsic height units in SVG viewBox (roughly) */
  h: number;
  /** Width ÷ height for layout math when not a square icon. */
  aspect?: number;
};

export const LOGOS: LogoDef[] = [
  {
    id: "lg_full",
    label: "La Volta",
    src: "/brand/lavoltaLogo.png",
    kind: "wordmark",
    h: Math.round(140 * G),
    /* lavoltaLogo.png is a square 1024×1024 with the oval crest centered.
     * Aspect 1.0 makes the reserved box match the image, so the crest fills it. */
    aspect: 1.0,
  },
  { id: "none", label: "No logo", src: null, kind: "none", h: 0 },
];

// ─── QR / solid palettes ─────────────────────────────────────────────────────

export type QrColorDef = { id: QrColorId; name: string; hex: string };
export const QR_COLORS: QrColorDef[] = [
  { id: "claret", name: "Claret", hex: "#491E29" },
  { id: "burgundy", name: "Burgundy", hex: "#6B1E2D" },
  { id: "cream", name: "Cream", hex: "#F6F4E8" },
  { id: "white", name: "White", hex: "#FFFFFF" },
  { id: "black", name: "Black", hex: "#000000" },
  { id: "gray", name: "Gray", hex: "#666666" },
];

/** Shared solid-color palette for text + QR slots. */
export type SolidPaletteDef = { id: string; name: string; hex: string };
export const FD_SOLID_PALETTE: SolidPaletteDef[] = [
  { id: "claret", name: "Claret", hex: "#491E29" },
  { id: "burgundy", name: "Burgundy", hex: "#6B1E2D" },
  { id: "cream", name: "Cream", hex: "#F6F4E8" },
  { id: "black", name: "Black", hex: "#000000" },
  { id: "white", name: "White", hex: "#FFFFFF" },
  { id: "gray", name: "Gray 666", hex: "#666666" },
  { id: "grayDark", name: "Charcoal", hex: "#383838" },
  { id: "grayLight", name: "EFEFEF", hex: "#EFEFEF" },
  { id: "grayLine", name: "DEDEDE", hex: "#DEDEDE" },
  { id: "graySoft", name: "D0D0D0", hex: "#D0D0D0" },
  { id: "grayF2", name: "F2F2F2", hex: "#F2F2F2" },
];

// ─── Flower pattern assets (optional decorative layer) ───────────────────────

export const FLOWER_SRCS: string[] = [
  "/fd/flower_01.png",
  "/fd/flower_02.png",
  "/fd/flower_03_b.png",
];

/** Art-direction size multiplier for each flower. Index matches FLOWER_SRCS. */
export const FLOWER_SCALE: readonly number[] = [2.0, 1.0, 0.9];

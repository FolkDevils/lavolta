import type { ColorId, LogoId, QrColorId } from "./types";

// ─── Color ID normalization ──────────────────────────────────────────────────

const VALID_COLOR_IDS = new Set<ColorId>([
  "dark",
  "white",
  "yellow",
  "black",
  "pink",
  "deep",
  "red",
]);

/** Keep palette ids as-is and pass through #rrggbb custom colors.
 *  Maps removed swatches and unknown values to a safe default. */
export function normalizeColorValue(color: unknown, fallback: ColorId = "dark"): string {
  if (typeof color === "string") {
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim())) return color.trim();
    if (color === "green") return "deep";
    if (VALID_COLOR_IDS.has(color as ColorId)) return color;
  }
  return fallback;
}

/** Back-compat shim used by older call sites. */
export function normalizeColorId(color: unknown): ColorId {
  const v = normalizeColorValue(color);
  return (VALID_COLOR_IDS.has(v as ColorId) ? v : "dark") as ColorId;
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

/** Map removed logo variants (e.g. white/yellow) to full-color equivalents. */
export function normalizeLogoId(logo: unknown): LogoId {
  if (logo === "none") return "none";
  if (logo === "ic_full" || (typeof logo === "string" && logo.startsWith("ic_"))) return "ic_full";
  if (VALID_LOGO_IDS.has(logo as LogoId)) return logo as LogoId;
  return "lg_full";
}

// ─── Logo scale + offset clamps ─────────────────────────────────────────────

const LOGO_SCALE_MIN = 0.5;
const LOGO_SCALE_MAX = 2;

export function clampLogoScale(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 1;
  return Math.min(LOGO_SCALE_MAX, Math.max(LOGO_SCALE_MIN, x));
}

export const LOGO_SCALE_RANGE = { min: LOGO_SCALE_MIN, max: LOGO_SCALE_MAX, step: 0.05 } as const;

export const DEFAULT_LOGO_SCALE = 1.55;
export const DEFAULT_LOGO_OFFSET_X = -42;
export const DEFAULT_LOGO_OFFSET_Y = 2;

/** Slider limits for position nudgers (SVG viewBox units). */
export const LOGO_OFFSET_RANGE = { x: 120, y: 100, step: 2 } as const;
export const TEXT_OFFSET_RANGE = { x: 120, y: 60, step: 2 } as const;

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
    id: "dark",
    name: "Dark Purple",
    sw: "linear-gradient(135deg,#650049,#29001d)",
    fill: { type: "gradient", from: "#650049", to: "#29001d", angle: 135 },
    text: "#ffd000",
    sub: "rgba(255,208,0,0.60)",
    hair: "rgba(255,208,0,0.20)",
  },
  {
    id: "white",
    name: "White",
    sw: "#ffffff",
    fill: { type: "solid", color: "#ffffff" },
    text: "#440031",
    sub: "rgba(68,0,49,0.60)",
    hair: "rgba(68,0,49,0.18)",
  },
  {
    id: "yellow",
    name: "Yellow",
    sw: "#ffd000",
    fill: { type: "solid", color: "#ffd000" },
    text: "#440031",
    sub: "rgba(68,0,49,0.70)",
    hair: "rgba(68,0,49,0.22)",
  },
  {
    id: "black",
    name: "Black",
    sw: "#000000",
    fill: { type: "solid", color: "#000000" },
    text: "#ffffff",
    sub: "rgba(255,255,255,0.55)",
    hair: "rgba(255,255,255,0.16)",
  },
  {
    id: "pink",
    name: "Pink",
    sw: "linear-gradient(135deg,#ff58cd,#440031)",
    fill: { type: "gradient", from: "#ff58cd", to: "#440031", angle: 135 },
    text: "#ffffff",
    sub: "rgba(255,255,255,0.70)",
    hair: "rgba(255,255,255,0.22)",
  },
  {
    id: "deep",
    name: "Deep Dark",
    sw: "#0a0008",
    fill: { type: "solid", color: "#0a0008" },
    text: "#ffffff",
    sub: "rgba(255,255,255,0.55)",
    hair: "rgba(255,255,255,0.14)",
  },
  {
    id: "red",
    name: "Red",
    sw: "#ff0011",
    fill: { type: "solid", color: "#ff0011" },
    text: "#ffffff",
    sub: "rgba(255,255,255,0.75)",
    hair: "rgba(255,255,255,0.22)",
  },
];

// ─── Logo definitions ────────────────────────────────────────────────────────

export type LogoDef = {
  id: LogoId;
  label: string;
  src: string | null;
  /** Which source file to use: wordmark PNG or icon SVG */
  kind: "wordmark" | "icon" | "none";
  /** Intrinsic height units in SVG viewBox (roughly) */
  h: number;
};

export const LOGOS: LogoDef[] = [
  { id: "lg_full", label: "Wordmark", src: "/fd/StaticLogoLrg.png", kind: "wordmark", h: 72 },
  { id: "ic_full", label: "Icon", src: "/fd/icon.svg", kind: "icon", h: 64 },
  { id: "none", label: "No logo", src: null, kind: "none", h: 0 },
];

// ─── QR / solid palettes ─────────────────────────────────────────────────────

export type QrColorDef = { id: QrColorId; name: string; hex: string };
export const QR_COLORS: QrColorDef[] = [
  { id: "yellow", name: "Yellow", hex: "#ffd000" },
  { id: "pink", name: "Pink", hex: "#ff58cd" },
  { id: "purple", name: "Purple", hex: "#440031" },
  { id: "red", name: "Red", hex: "#ff0011" },
  { id: "white", name: "White", hex: "#ffffff" },
  { id: "black", name: "Black", hex: "#000000" },
];

/** Shared solid-color palette for text + QR slots.
 *  Card backgrounds use COLORS which includes gradients. */
export type SolidPaletteDef = { id: string; name: string; hex: string };
export const FD_SOLID_PALETTE: SolidPaletteDef[] = [
  { id: "yellow", name: "Yellow", hex: "#ffd000" },
  { id: "pink", name: "Pink", hex: "#ff58cd" },
  { id: "purple", name: "Purple", hex: "#440031" },
  { id: "red", name: "Red", hex: "#ff0011" },
  { id: "white", name: "White", hex: "#ffffff" },
  { id: "black", name: "Black", hex: "#0d0007" },
];

// ─── Flower pattern assets ───────────────────────────────────────────────────

export const FLOWER_SRCS: string[] = [
  "/fd/flower_01.png",
  "/fd/flower_02.png",
  "/fd/flower_03_b.png",
];

/** Art-direction size multiplier for each flower, applied on top of the
 *  random per-instance scale. Index matches FLOWER_SRCS. */
export const FLOWER_SCALE: readonly number[] = [2.0, 1.0, 0.9];

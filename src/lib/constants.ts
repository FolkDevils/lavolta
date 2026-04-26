import type {
  BackLayout,
  BackState,
  ColorId,
  FrontLayout,
  FrontState,
  LogoId,
  PatternConfig,
  Person,
  QrColorId,
  QrLink,
} from "./types";

const VALID_LOGO_IDS = new Set<LogoId>(["lg_full", "ic_full", "none"]);

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
 *  Map removed swatches and unknown values to a safe default. */
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

/** Map removed logo variants (e.g. white/yellow) to full-color equivalents. */
export function normalizeLogoId(logo: unknown): LogoId {
  if (logo === "none") return "none";
  if (logo === "ic_full" || (typeof logo === "string" && logo.startsWith("ic_"))) return "ic_full";
  if (VALID_LOGO_IDS.has(logo as LogoId)) return logo as LogoId;
  return "lg_full";
}

const LOGO_SCALE_MIN = 0.5;
const LOGO_SCALE_MAX = 2;

/** Clamp logo size multiplier for front/back. */
export function clampLogoScale(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 1;
  return Math.min(LOGO_SCALE_MAX, Math.max(LOGO_SCALE_MIN, x));
}

export const LOGO_SCALE_RANGE = { min: LOGO_SCALE_MIN, max: LOGO_SCALE_MAX, step: 0.05 } as const;

/* ── Print dimensions (Standard US business card) ──────────────────
 * Finished size: 3.5" × 2.0"
 * Bleed: 0.125" on all sides
 * Full-bleed doc size: 3.75" × 2.25"
 * Safe area: 0.125" inside finished edge = 0.25" in from full-bleed edge
 *
 * SVG viewBox uses 160 units/inch (convenient whole numbers):
 *   full-bleed: 600 × 360
 *   finished:   560 × 320, offset (20, 20)
 *   safe area:  520 × 280, offset (40, 40)
 * ────────────────────────────────────────────────────────────────── */
export const DPI = 300;
export const INCH = 160; // SVG units per inch

export const FINISHED_W_IN = 3.5;
export const FINISHED_H_IN = 2.0;
export const BLEED_IN = 0.125;

export const VB_W = Math.round((FINISHED_W_IN + 2 * BLEED_IN) * INCH); // 600
export const VB_H = Math.round((FINISHED_H_IN + 2 * BLEED_IN) * INCH); // 360
export const BLEED = Math.round(BLEED_IN * INCH); // 20
export const SAFE_INSET = BLEED * 2; // 40 (0.25" from bleed edge)

/* Pixel dimensions at 300 DPI for raster export */
export const PX_W = Math.round((FINISHED_W_IN + 2 * BLEED_IN) * DPI); // 1125
export const PX_H = Math.round((FINISHED_H_IN + 2 * BLEED_IN) * DPI); // 675

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

export const FRONT_LAYOUTS: { id: FrontLayout; name: string }[] = [
  { id: "stack", name: "Stack" },
  { id: "stack_logo_left", name: "Stack · Logo left (centered)" },
  { id: "stack_logo_right", name: "Stack · Logo right (centered)" },
  { id: "centered", name: "Centered" },
  { id: "bold", name: "Bold Name" },
  { id: "text_left", name: "Text left · Logo right" },
  { id: "logo_left", name: "Logo left · Text right" },
];

const VALID_FRONT_LAYOUT = new Set<FrontLayout>([
  "stack",
  "stack_logo_left",
  "stack_logo_right",
  "centered",
  "bold",
  "text_left",
  "logo_left",
]);

/** Map legacy layout ids; clamp unknown values to `stack`. */
export function normalizeFrontLayout(layout: unknown): FrontLayout {
  if (layout === "editorial") return "text_left";
  if (VALID_FRONT_LAYOUT.has(layout as FrontLayout)) return layout as FrontLayout;
  return "stack";
}

export const BACK_LAYOUTS: { id: BackLayout; name: string }[] = [
  { id: "two_qr", name: "Two QRs" },
  { id: "logo_qr", name: "Logo + QR" },
  { id: "type", name: "Type Led" },
  { id: "minimal", name: "Minimal" },
];

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
 *  (Card backgrounds use the richer COLORS palette which includes gradients.) */
export type SolidPaletteDef = { id: string; name: string; hex: string };
export const FD_SOLID_PALETTE: SolidPaletteDef[] = [
  { id: "yellow", name: "Yellow", hex: "#ffd000" },
  { id: "pink", name: "Pink", hex: "#ff58cd" },
  { id: "purple", name: "Purple", hex: "#440031" },
  { id: "red", name: "Red", hex: "#ff0011" },
  { id: "white", name: "White", hex: "#ffffff" },
  { id: "black", name: "Black", hex: "#0d0007" },
];

export const FLOWER_SRCS: string[] = [
  "/fd/flower_01.png",
  "/fd/flower_02.png",
  "/fd/flower_03_b.png",
];

/** Art-direction size multiplier for each flower, applied on top of the
 *  random per-instance scale. Keeps the mix balanced: flower 1 reads
 *  large, flower 2 at the base size, flower 3 a touch smaller. Index
 *  matches `FLOWER_SRCS`. */
export const FLOWER_SCALE: readonly number[] = [2.0, 1.0, 0.9];

export const DEFAULT_PATTERN: PatternConfig = {
  on: true,
  f1: true,
  f2: true,
  f3: true,
  density: 30,
  size: 44,
  rot: 180,
  opacity: 14,
  seed: 4242,
};

export const DEFAULT_FRONT: FrontState = {
  color: "dark",
  textFill: null,
  subTextFill: null,
  logo: "lg_full",
  logoScale: 1,
  layout: "stack",
  pat: { ...DEFAULT_PATTERN },
};

export const DEFAULT_QR_LINKS: QrLink[] = [
  { id: "main", label: "folkdevils.io", url: "https://www.folkdevils.io/" },
  { id: "lab", label: "devilsplayground", url: "https://devilsplayground.folkdevils.io/" },
];

export const DEFAULT_BACK: BackState = {
  color: "dark",
  textFill: null,
  subTextFill: null,
  logo: "lg_full",
  logoScale: 1,
  layout: "two_qr",
  qrColor: "yellow",
  qrBody: "square",
  qrEyeFrame: "square",
  qrEyeBall: "square",
  qrFrame: null,
  qrFrameRadius: 0.06,
  qrLinks: DEFAULT_QR_LINKS.map((l) => ({ ...l })),
  qrLinkIds: ["main", "lab"],
  pat: { ...DEFAULT_PATTERN, density: 32, opacity: 16, seed: 9191 },
};

export const QR_BODY_OPTIONS: { id: BackState["qrBody"]; name: string }[] = [
  { id: "square", name: "Square" },
  { id: "rounded", name: "Rounded" },
  { id: "dots", name: "Dots" },
];

export const QR_EYE_OPTIONS: { id: BackState["qrEyeFrame"]; name: string }[] = [
  { id: "square", name: "Square" },
  { id: "rounded", name: "Rounded" },
  { id: "circle", name: "Circle" },
  { id: "tear", name: "Tear" },
];

/** Migrate the old combined qrStyle to the new triplet. */
export function qrStyleToDesignFields(style: unknown): {
  qrBody: BackState["qrBody"];
  qrEyeFrame: BackState["qrEyeFrame"];
  qrEyeBall: BackState["qrEyeBall"];
} {
  switch (style) {
    case "rounded":
      return { qrBody: "rounded", qrEyeFrame: "rounded", qrEyeBall: "rounded" };
    case "dots":
      return { qrBody: "dots", qrEyeFrame: "square", qrEyeBall: "square" };
    case "circle":
      return { qrBody: "dots", qrEyeFrame: "circle", qrEyeBall: "circle" };
    case "tear":
      return { qrBody: "dots", qrEyeFrame: "tear", qrEyeBall: "tear" };
    case "square":
    default:
      return { qrBody: "square", qrEyeFrame: "square", qrEyeBall: "square" };
  }
}

const VALID_QR_BODY = new Set<BackState["qrBody"]>(["square", "rounded", "dots"]);
const VALID_QR_EYE = new Set<BackState["qrEyeFrame"]>([
  "square",
  "rounded",
  "circle",
  "tear",
]);

export function normalizeQrBody(v: unknown): BackState["qrBody"] {
  return VALID_QR_BODY.has(v as BackState["qrBody"])
    ? (v as BackState["qrBody"])
    : "square";
}

export function normalizeQrEye(v: unknown): BackState["qrEyeFrame"] {
  return VALID_QR_EYE.has(v as BackState["qrEyeFrame"])
    ? (v as BackState["qrEyeFrame"])
    : "square";
}

export const DEFAULT_PEOPLE: Person[] = [
  {
    id: 1,
    name: "Ted Royer",
    title: "Chief Creative Office",
    phone: "(646) 621-0279",
    email: "ted@folkdevils.io",
  },
];

export const STORAGE_KEY = "fd_bcb_v4";

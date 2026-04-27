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

/** Factory-tuned wordmark defaults (front + back) for first-open / reset. */
export const DEFAULT_LOGO_SCALE = 1.55;
export const DEFAULT_LOGO_OFFSET_X = -42;
export const DEFAULT_LOGO_OFFSET_Y = 2;

/** Slider limits for position nudgers, in SVG viewBox units.
 *  Generous enough to let designers rebalance a layout, tight
 *  enough that you can't drag something completely off-card. */
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

/** TEL vs EMAIL row spacing in stack layouts (viewBox units). */
export const CONTACT_TEL_EMAIL_GAP_DEFAULT = 28;
export const CONTACT_TEL_EMAIL_GAP_RANGE = { min: 14, max: 56, step: 1 } as const;

export function clampContactTelEmailGap(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : CONTACT_TEL_EMAIL_GAP_DEFAULT;
  return Math.min(
    CONTACT_TEL_EMAIL_GAP_RANGE.max,
    Math.max(CONTACT_TEL_EMAIL_GAP_RANGE.min, x),
  );
}

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

/** Name→title vertical spacing defaults by layout (viewBox units). */
const _NAME_TITLE_PAD = SAFE_INSET + 20;
const _NAME_TITLE_CONTENT_H = VB_H - _NAME_TITLE_PAD * 2;
export const NAME_TITLE_GAP_DEFAULT_STACK = 18;
export const NAME_TITLE_GAP_DEFAULT_CENTERED = 22;
export const NAME_TITLE_GAP_DEFAULT_BOLD = Math.round(
  _NAME_TITLE_PAD + _NAME_TITLE_CONTENT_H - 34 - (_NAME_TITLE_PAD + _NAME_TITLE_CONTENT_H * 0.58),
);

export function defaultNameTitleGap(layout: FrontLayout): number {
  switch (layout) {
    case "centered":
      return NAME_TITLE_GAP_DEFAULT_CENTERED;
    case "bold":
      return NAME_TITLE_GAP_DEFAULT_BOLD;
    case "text_left":
    case "logo_left":
      return NAME_TITLE_GAP_DEFAULT_STACK;
    default:
      return NAME_TITLE_GAP_DEFAULT_STACK;
  }
}

export const NAME_TITLE_GAP_RANGE = { min: 8, max: 100, step: 1 } as const;

export function clampNameTitleGap(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : NAME_TITLE_GAP_DEFAULT_STACK;
  return Math.min(NAME_TITLE_GAP_RANGE.max, Math.max(NAME_TITLE_GAP_RANGE.min, x));
}

/** Front type scales multiply layout-specific base sizes (see `frontFont*Px`). */
export const FONT_SCALE_RANGE = { min: 0.55, max: 1.75, step: 0.05 } as const;

export function clampFontScale(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 1;
  return Math.min(FONT_SCALE_RANGE.max, Math.max(FONT_SCALE_RANGE.min, x));
}

function fontClampPx(lo: number, hi: number, n: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export const FRONT_FONT_NAME_BASE: Record<FrontLayout, number> = {
  stack: 34,
  stack_logo_left: 34,
  stack_logo_right: 34,
  centered: 28,
  bold: 56,
  text_left: 28,
  logo_left: 28,
};

/* Base font sizes are expressed in SVG viewBox units (160/inch).
 * Convert to print points with × 72/160 = 0.45. We target a ≥ 6.5 pt floor
 * on every live-text field so names, titles, and contact values all stay
 * legible at 300 DPI on a 3.5" × 2" card. */

export const FRONT_FONT_TITLE_BASE: Record<FrontLayout, number> = {
  stack: 15, // ~6.75 pt
  stack_logo_left: 15,
  stack_logo_right: 15,
  centered: 14, // ~6.30 pt
  bold: 14,
  text_left: 14,
  logo_left: 14,
};

export const FRONT_FONT_CONTACT_LABEL_BASE: Record<FrontLayout, number> = {
  stack: 14, // ~6.30 pt
  stack_logo_left: 14,
  stack_logo_right: 14,
  centered: 14,
  bold: 14,
  text_left: 14,
  logo_left: 14,
};

export const FRONT_FONT_CONTACT_VALUE_BASE: Record<FrontLayout, number> = {
  stack: 16, // ~7.20 pt
  stack_logo_left: 16,
  stack_logo_right: 16,
  centered: 15, // ~6.75 pt
  bold: 15,
  text_left: 15,
  logo_left: 15,
};

export function frontFontNamePx(layout: FrontLayout, scale: unknown): number {
  return fontClampPx(
    15, // ≈ 6.75 pt floor — names shouldn't ever print smaller than this
    120,
    Math.round(FRONT_FONT_NAME_BASE[layout] * clampFontScale(scale)),
  );
}

export function frontFontTitlePx(layout: FrontLayout, scale: unknown): number {
  return fontClampPx(
    14, // ≈ 6.30 pt floor — stays above the commercial 6 pt print minimum
    32,
    Math.round(FRONT_FONT_TITLE_BASE[layout] * clampFontScale(scale)),
  );
}

export function frontFontContactLabelPx(layout: FrontLayout, scale: unknown): number {
  return fontClampPx(
    14, // ≈ 6.30 pt floor — stays above the commercial 6 pt print minimum
    22,
    Math.round(FRONT_FONT_CONTACT_LABEL_BASE[layout] * clampFontScale(scale)),
  );
}

export function frontFontContactValuePx(layout: FrontLayout, scale: unknown): number {
  return fontClampPx(
    14, // ≈ 6.30 pt floor — phone/email must stay dial-able
    30,
    Math.round(FRONT_FONT_CONTACT_VALUE_BASE[layout] * clampFontScale(scale)),
  );
}

export const BACK_FONT_CAPTION_DEFAULT = 15; // ~6.75 pt (up from 4.50 pt)
export const BACK_FONT_DISPLAY_DEFAULT = 54; // ~24.3 pt — already great
export const BACK_FONT_MINIMAL_DEFAULT = 18; // ~8.10 pt (up from 7.20 pt)

export function clampFontQrCaption(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : BACK_FONT_CAPTION_DEFAULT;
  return Math.round(Math.min(24, Math.max(14, x))); // 6.30–10.8 pt
}

export function clampFontBackDisplay(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : BACK_FONT_DISPLAY_DEFAULT;
  return Math.round(Math.min(96, Math.max(20, x)));
}

export function clampFontMinimalLink(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : BACK_FONT_MINIMAL_DEFAULT;
  return Math.round(Math.min(34, Math.max(14, x))); // 6.30–15.3 pt
}

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
  { id: "one_qr", name: "One QR" },
  { id: "two_qr", name: "Two QRs" },
  { id: "logo_qr", name: "Logo + QR" },
  { id: "type", name: "Type Led" },
  { id: "minimal", name: "Minimal" },
];

const VALID_BACK_LAYOUT = new Set<BackLayout>(["one_qr", "two_qr", "logo_qr", "type", "minimal"]);

/** Unknown ids fall back to `two_qr` (legacy default). Missing layout uses `whenMissing` (factory default). */
export function normalizeBackLayout(layout: unknown, whenMissing: BackLayout = "one_qr"): BackLayout {
  if (layout === undefined || layout === null) return whenMissing;
  if (VALID_BACK_LAYOUT.has(layout as BackLayout)) return layout as BackLayout;
  return "two_qr";
}

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
  f1: false,
  f2: true,
  f3: false,
  density: 80,
  size: 20,
  rot: 80,
  opacity: 20,
  seed: 4242,
};

/** Ted Royer — stack · logo right, tuned wordmark position, neutral type/position (id 1 + anyone not Andrew/Avi). */
export const DEFAULT_FRONT: FrontState = {
  color: "dark",
  textFill: null,
  subTextFill: "#ffffff",
  phoneFill: null,
  emailFill: null,
  logo: "lg_full",
  logoScale: clampLogoScale(DEFAULT_LOGO_SCALE),
  logoOffsetX: -32,
  logoOffsetY: 3,
  textOffsetX: 0,
  nameTitleBlockOffsetY: 0,
  nameTitleGap: NAME_TITLE_GAP_DEFAULT_STACK,
  contactOffsetY: 0,
  contactTelEmailGap: CONTACT_TEL_EMAIL_GAP_DEFAULT,
  fontScaleName: clampFontScale(1),
  fontScaleTitle: clampFontScale(1),
  fontScaleContactLabel: clampFontScale(0.9),
  fontScaleContactValue: clampFontScale(1.1),
  layout: "stack_logo_right",
  pat: { ...DEFAULT_PATTERN },
};

/** Ted = `DEFAULT_FRONT`. Andrew (2) & Avi (3) = centered layout + the tuned type/logo/text-position you specified. */
export function defaultFrontForPerson(personId: number): FrontState {
  const ted: FrontState = { ...DEFAULT_FRONT, pat: { ...DEFAULT_FRONT.pat } };
  if (personId === 1) return JSON.parse(JSON.stringify(ted)) as FrontState;
  if (personId === 2 || personId === 3) {
    return {
      ...ted,
      pat: { ...ted.pat },
      layout: "centered",
      logoScale: clampLogoScale(2),
      logoOffsetX: 0,
      logoOffsetY: 12,
      textOffsetX: 0,
      nameTitleBlockOffsetY: 30,
      nameTitleGap: clampNameTitleGap(26),
      contactOffsetY: 10,
      contactTelEmailGap: clampContactTelEmailGap(28),
      fontScaleName: clampFontScale(1.05),
      fontScaleTitle: clampFontScale(1.1),
      fontScaleContactLabel: clampFontScale(1),
      fontScaleContactValue: clampFontScale(1.1),
    };
  }
  return JSON.parse(JSON.stringify(ted)) as FrontState;
}

/** Merge a partial saved front (including legacy Y offsets) into a full `FrontState`. */
export function migrateRawFront(
  raw: Partial<FrontState> & { nameOffsetY?: number; titleOffsetY?: number },
): FrontState {
  const layout = normalizeFrontLayout(raw.layout);
  const baseGap = defaultNameTitleGap(layout);
  const legacyFront = raw as Partial<FrontState> & { nameOffsetY?: number; titleOffsetY?: number };
  let nameTitleGap: number;
  if (typeof raw.nameTitleGap === "number" && Number.isFinite(raw.nameTitleGap)) {
    nameTitleGap = clampNameTitleGap(raw.nameTitleGap);
  } else if (
    typeof legacyFront.nameOffsetY === "number" ||
    typeof legacyFront.titleOffsetY === "number"
  ) {
    nameTitleGap = clampNameTitleGap(
      baseGap +
        (Number(legacyFront.titleOffsetY) || 0) -
        (Number(legacyFront.nameOffsetY) || 0),
    );
  } else {
    nameTitleGap = clampNameTitleGap(baseGap);
  }
  const nameTitleBlockOffsetY = clampTextOffsetY(
    raw.nameTitleBlockOffsetY ?? legacyFront.nameOffsetY ?? 0,
  );
  const patMerged: PatternConfig = {
    ...DEFAULT_PATTERN,
    ...(raw.pat && typeof raw.pat === "object" ? raw.pat : {}),
  };
  const m: FrontState = {
    ...DEFAULT_FRONT,
    ...raw,
    layout,
    pat: patMerged,
  };
  return {
    ...m,
    logo: normalizeLogoId(m.logo),
    logoScale: clampLogoScale(m.logoScale),
    logoOffsetX: clampLogoOffsetX(m.logoOffsetX),
    logoOffsetY: clampLogoOffsetY(m.logoOffsetY),
    textOffsetX: clampTextOffsetX(m.textOffsetX),
    nameTitleBlockOffsetY,
    nameTitleGap,
    contactOffsetY: clampTextOffsetY(m.contactOffsetY),
    contactTelEmailGap: clampContactTelEmailGap(m.contactTelEmailGap),
    fontScaleName: clampFontScale(m.fontScaleName),
    fontScaleTitle: clampFontScale(m.fontScaleTitle),
    fontScaleContactLabel: clampFontScale(m.fontScaleContactLabel),
    fontScaleContactValue: clampFontScale(m.fontScaleContactValue),
    color: normalizeColorValue(m.color, "dark"),
    textFill: m.textFill ?? null,
    subTextFill: m.subTextFill ?? null,
    phoneFill: m.phoneFill ?? null,
    emailFill: m.emailFill ?? null,
  };
}

export function buildFrontByPersonIdFromSaved(
  saved: {
    front?: Partial<FrontState> & { nameOffsetY?: number; titleOffsetY?: number };
    frontByPersonId?: Record<string, unknown>;
  } | null,
  people: Person[],
): Record<number, FrontState> {
  const out: Record<number, FrontState> = {};
  const rawMap = saved?.frontByPersonId as Record<string, Partial<FrontState>> | undefined;
  const hasPer = rawMap && typeof rawMap === "object" && Object.keys(rawMap).length > 0;

  for (const p of people) {
    const key = String(p.id);
    const disk = hasPer ? rawMap[key] : undefined;
    if (disk && typeof disk === "object" && Object.keys(disk).length > 0) {
      out[p.id] = migrateRawFront(disk as Partial<FrontState> & { nameOffsetY?: number });
    } else if (saved?.front && !hasPer) {
      const firstId = people[0]?.id;
      out[p.id] = p.id === firstId ? migrateRawFront(saved.front!) : defaultFrontForPerson(p.id);
    } else {
      out[p.id] = defaultFrontForPerson(p.id);
    }
  }
  return out;
}

export const DEFAULT_QR_LINKS: QrLink[] = [
  { id: "main", label: "folkdevils.io", url: "https://www.folkdevils.io/" },
  { id: "lab", label: "devilsplayground", url: "https://devilsplayground.folkdevils.io/" },
];

export const DEFAULT_BACK: BackState = {
  color: "dark",
  textFill: null,
  subTextFill: "yellow",
  logo: "lg_full",
  logoScale: DEFAULT_LOGO_SCALE,
  logoOffsetX: DEFAULT_LOGO_OFFSET_X,
  logoOffsetY: DEFAULT_LOGO_OFFSET_Y,
  layout: "one_qr",
  qrColor: "yellow",
  qrBody: "square",
  qrEyeFrame: "square",
  qrEyeBall: "square",
  qrFrame: null,
  qrFrameRadius: 0.06,
  qrLinks: DEFAULT_QR_LINKS.map((l) => ({ ...l })),
  qrLinkIds: ["main"],
  fontQrCaption: BACK_FONT_CAPTION_DEFAULT,
  fontBackDisplay: BACK_FONT_DISPLAY_DEFAULT,
  fontMinimalLink: BACK_FONT_MINIMAL_DEFAULT,
  pat: { ...DEFAULT_PATTERN },
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
    title: "CCO / FOUNDER",
    phone: "(646) 621-0279",
    email: "ted@folkdevils.io",
  },
  {
    id: 2,
    name: "Andrew Eaton",
    title: "FOUNDER",
    phone: "(201) 881-6941",
    email: "andrew@folkdevils.io",
  },
  {
    id: 3,
    name: "Avi Cohen",
    title: "FOUNDER",
    phone: "(516) 864-1377",
    email: "avi@folkdevils.io",
  },
];

export const STORAGE_KEY = "fd_bcb_v4";

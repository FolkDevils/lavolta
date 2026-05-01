import type { BackLayout, BackState, FrontLayout, FrontState } from "./types";
import { CARD_GEOM_SCALE } from "./print";
import {
  BACK_FONT_CAPTION_DEFAULT,
  BACK_FONT_DISPLAY_DEFAULT,
  BACK_FONT_MINIMAL_DEFAULT,
  NAME_TITLE_GAP_DEFAULT_BOLD,
  NAME_TITLE_GAP_DEFAULT_CENTERED,
  NAME_TITLE_GAP_DEFAULT_STACK,
  CONTACT_TEL_EMAIL_GAP_DEFAULT,
} from "./typography";

const G = CARD_GEOM_SCALE;

// ─── Front layouts ───────────────────────────────────────────────────────────

export const FRONT_LAYOUTS: { id: FrontLayout; name: string }[] = [
  { id: "stack", name: "Stack" },
  { id: "stack_logo_left", name: "Stack · Logo left (centered)" },
  { id: "stack_logo_right", name: "Stack · Logo right (centered)" },
  { id: "centered", name: "Centered" },
  { id: "bold", name: "Bold Name" },
];

const VALID_FRONT_LAYOUT = new Set<FrontLayout>([
  "stack",
  "stack_logo_left",
  "stack_logo_right",
  "centered",
  "bold",
]);

/** Map legacy/removed layout ids → the closest current layout. */
export function normalizeFrontLayout(layout: unknown): FrontLayout {
  if (layout === "editorial" || layout === "text_left") return "stack";
  if (layout === "logo_left") return "stack_logo_left";
  if (VALID_FRONT_LAYOUT.has(layout as FrontLayout)) return layout as FrontLayout;
  return "stack";
}

// ─── Back layouts ────────────────────────────────────────────────────────────

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

// ─── QR style options ────────────────────────────────────────────────────────

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

// ─── Per-layout element defaults ─────────────────────────────────────────────
//
// "Element defaults" are the fields that belong to a specific layout's
// composition — logo position/scale, text offsets, spacing, font scales.
// They RESET when the user switches layouts so each layout is self-centered.
//
// "Background" fields (card color, pattern, text fills, logo identity, QR
// colors/style/links) are user-picked chrome and PERSIST across layout
// switches — see `applyFrontLayoutDefaults` / `applyBackLayoutDefaults`.

export type FrontLayoutDefaults = {
  logoScale: number;
  logoOffsetX: number;
  logoOffsetY: number;
  textOffsetX: number;
  nameTitleBlockOffsetY: number;
  nameTitleGap: number;
  contactOffsetY: number;
  contactTelEmailGap: number;
  fontScaleName: number;
  fontScaleTitle: number;
  fontScaleContactLabel: number;
  fontScaleContactValue: number;
};

/** Neutral baseline: all offsets = 0, scale = 1, font scales = 1. */
const FRONT_NEUTRAL_DEFAULTS: FrontLayoutDefaults = {
  logoScale: 1,
  logoOffsetX: 0,
  logoOffsetY: 0,
  textOffsetX: 0,
  nameTitleBlockOffsetY: 0,
  nameTitleGap: NAME_TITLE_GAP_DEFAULT_STACK,
  contactOffsetY: 0,
  contactTelEmailGap: CONTACT_TEL_EMAIL_GAP_DEFAULT,
  fontScaleName: 1,
  fontScaleTitle: 1,
  fontScaleContactLabel: 0.9,
  fontScaleContactValue: 1.1,
};

/** Global per-layout presets. These apply to every person on the front face.
 *  To tune a layout for a single person, add an entry to
 *  `PERSON_FRONT_LAYOUT_OVERRIDES` below — it merges on top of these. */
export const FRONT_LAYOUT_DEFAULTS: Record<FrontLayout, FrontLayoutDefaults> = {
  /** Tuned La Volta stack preset (logo + text position from design panel). */
  stack: {
    ...FRONT_NEUTRAL_DEFAULTS,
    logoScale: 2.3,
    logoOffsetX: -89,
    logoOffsetY: 66,
    textOffsetX: 0,
    nameTitleBlockOffsetY: 83,
    nameTitleGap: 44,
    contactOffsetY: 0,
    contactTelEmailGap: 68,
  },
  stack_logo_left: {
    ...FRONT_NEUTRAL_DEFAULTS,
    logoScale: 1.15,
    logoOffsetX: 0,
    logoOffsetY: 0,
  },
  stack_logo_right: {
    ...FRONT_NEUTRAL_DEFAULTS,
    logoScale: 1.15,
    logoOffsetX: 0,
    logoOffsetY: 0,
  },
  /** Tuned from exported Suyin Royer centered preset (person settings file). */
  centered: {
    ...FRONT_NEUTRAL_DEFAULTS,
    logoScale: 1.75,
    logoOffsetX: 1,
    logoOffsetY: 76,
    textOffsetX: 0,
    nameTitleBlockOffsetY: 75,
    nameTitleGap: 41,
    contactOffsetY: 99,
    contactTelEmailGap: 73,
    fontScaleName: 1.1,
    fontScaleTitle: 1.1,
    fontScaleContactLabel: 1.05,
    fontScaleContactValue: 1.1,
  },
  bold: {
    ...FRONT_NEUTRAL_DEFAULTS,
    logoScale: 1.2,
    nameTitleGap: NAME_TITLE_GAP_DEFAULT_BOLD,
  },
};

/** Sparse per-person override on top of FRONT_LAYOUT_DEFAULTS. */
export type FrontLayoutOverride = Partial<FrontLayoutDefaults>;

/** Extension point for per-person per-layout tweaks.
 *  Shape: `{ [personId]: { [layout]: { field: value, ... } } }`.
 *  Empty by default — every person uses the global `FRONT_LAYOUT_DEFAULTS`.
 *  Example:
 *    `1: { stack_logo_right: { logoOffsetX: -40 } }` pulls Ted's wordmark further
 *    left in his primary layout without touching the global preset. */
export const PERSON_FRONT_LAYOUT_OVERRIDES: Record<
  number,
  Partial<Record<FrontLayout, FrontLayoutOverride>>
> = {};

/** Merge the global preset for `layout` with any override registered for `personId`. */
export function resolveFrontLayoutDefaults(
  layout: FrontLayout,
  personId?: number,
): FrontLayoutDefaults {
  const base = FRONT_LAYOUT_DEFAULTS[layout];
  if (personId == null) return base;
  const override = PERSON_FRONT_LAYOUT_OVERRIDES[personId]?.[layout];
  return override ? { ...base, ...override } : base;
}

/** Replace element-level fields on `state` with `layout`'s effective defaults.
 *  Background/chrome survives. When `personId` is provided, per-person overrides
 *  (if any) are merged on top of the global preset. */
export function applyFrontLayoutDefaults(
  state: FrontState,
  layout: FrontLayout,
  personId?: number,
): FrontState {
  const d = resolveFrontLayoutDefaults(layout, personId);
  return {
    ...state,
    layout,
    logoScale: d.logoScale,
    logoOffsetX: d.logoOffsetX,
    logoOffsetY: d.logoOffsetY,
    textOffsetX: d.textOffsetX,
    nameTitleBlockOffsetY: d.nameTitleBlockOffsetY,
    nameTitleGap: d.nameTitleGap,
    contactOffsetY: d.contactOffsetY,
    contactTelEmailGap: d.contactTelEmailGap,
    fontScaleName: d.fontScaleName,
    fontScaleTitle: d.fontScaleTitle,
    fontScaleContactLabel: d.fontScaleContactLabel,
    fontScaleContactValue: d.fontScaleContactValue,
  };
}

export type BackLayoutDefaults = {
  logoScale: number;
  logoOffsetX: number;
  logoOffsetY: number;
  fontQrCaption: number;
  fontBackDisplay: number;
  fontMinimalLink: number;
};

const BACK_NEUTRAL_DEFAULTS: BackLayoutDefaults = {
  logoScale: 1,
  logoOffsetX: 0,
  logoOffsetY: 0,
  fontQrCaption: BACK_FONT_CAPTION_DEFAULT,
  fontBackDisplay: BACK_FONT_DISPLAY_DEFAULT,
  fontMinimalLink: BACK_FONT_MINIMAL_DEFAULT,
};

/** Global per-layout presets for the back face. Per-person tweaks live in
 *  `PERSON_BACK_LAYOUT_OVERRIDES` and merge on top of these. */
export const BACK_LAYOUT_DEFAULTS: Record<BackLayout, BackLayoutDefaults> = {
  one_qr: { ...BACK_NEUTRAL_DEFAULTS },
  two_qr: { ...BACK_NEUTRAL_DEFAULTS },
  logo_qr: { ...BACK_NEUTRAL_DEFAULTS, logoScale: 1.1 },
  type: { ...BACK_NEUTRAL_DEFAULTS },
  minimal: { ...BACK_NEUTRAL_DEFAULTS },
};

/** Sparse per-person override on top of BACK_LAYOUT_DEFAULTS. */
export type BackLayoutOverride = Partial<BackLayoutDefaults>;

/** Extension point for per-person back-layout tweaks. See
 *  `PERSON_FRONT_LAYOUT_OVERRIDES` for the shape/intent. */
export const PERSON_BACK_LAYOUT_OVERRIDES: Record<
  number,
  Partial<Record<BackLayout, BackLayoutOverride>>
> = {};

/** Merge the global preset for `layout` with any override registered for `personId`. */
export function resolveBackLayoutDefaults(
  layout: BackLayout,
  personId?: number,
): BackLayoutDefaults {
  const base = BACK_LAYOUT_DEFAULTS[layout];
  if (personId == null) return base;
  const override = PERSON_BACK_LAYOUT_OVERRIDES[personId]?.[layout];
  return override ? { ...base, ...override } : base;
}

/** Replace element-level fields on `state` with `layout`'s effective defaults.
 *  Background/chrome survives. When `personId` is provided, per-person overrides
 *  are merged on top of the global preset. */
export function applyBackLayoutDefaults(
  state: BackState,
  layout: BackLayout,
  personId?: number,
): BackState {
  const d = resolveBackLayoutDefaults(layout, personId);
  return {
    ...state,
    layout,
    logoScale: d.logoScale,
    logoOffsetX: d.logoOffsetX,
    logoOffsetY: d.logoOffsetY,
    fontQrCaption: d.fontQrCaption,
    fontBackDisplay: d.fontBackDisplay,
    fontMinimalLink: d.fontMinimalLink,
  };
}

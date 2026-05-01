import type { BackLayout, BackState, FrontLayout, FrontState, Orientation } from "./types";
import {
  BACK_FONT_CAPTION_DEFAULT,
  BACK_FONT_DISPLAY_DEFAULT,
  BACK_FONT_MINIMAL_DEFAULT,
  NAME_TITLE_GAP_DEFAULT_BOLD,
  NAME_TITLE_GAP_DEFAULT_CENTERED,
  NAME_TITLE_GAP_DEFAULT_STACK,
  CONTACT_TEL_EMAIL_GAP_DEFAULT,
} from "./typography";

// ─── Front layouts ───────────────────────────────────────────────────────────

export type FrontLayoutOption = {
  id: FrontLayout;
  name: string;
  orientation: Orientation;
};

export const FRONT_LAYOUTS: FrontLayoutOption[] = [
  /* Landscape */
  { id: "stack", name: "Stack", orientation: "landscape" },
  { id: "stack_logo_left", name: "Stack · Logo left (centered)", orientation: "landscape" },
  { id: "stack_logo_right", name: "Stack · Logo right (centered)", orientation: "landscape" },
  { id: "centered", name: "Centered", orientation: "landscape" },
  { id: "bold", name: "Bold Name", orientation: "landscape" },
  /* Portrait */
  { id: "p_centered", name: "Centered", orientation: "portrait" },
  { id: "p_stack", name: "Stack", orientation: "portrait" },
  { id: "p_logo_top", name: "Hero Logo", orientation: "portrait" },
];

const FRONT_LAYOUT_ORIENTATION: Record<FrontLayout, Orientation> = FRONT_LAYOUTS.reduce(
  (acc, opt) => {
    acc[opt.id] = opt.orientation;
    return acc;
  },
  {} as Record<FrontLayout, Orientation>,
);

const VALID_FRONT_LAYOUT = new Set<FrontLayout>(Object.keys(FRONT_LAYOUT_ORIENTATION) as FrontLayout[]);

/** Filtered list for the layout-picker UI. */
export function frontLayoutsFor(orientation: Orientation): FrontLayoutOption[] {
  return FRONT_LAYOUTS.filter((l) => l.orientation === orientation);
}

export function frontLayoutOrientation(layout: FrontLayout): Orientation {
  return FRONT_LAYOUT_ORIENTATION[layout] ?? "landscape";
}

/** Map legacy/removed layout ids → the closest current layout. */
export function normalizeFrontLayout(layout: unknown): FrontLayout {
  if (layout === "editorial" || layout === "text_left") return "stack";
  if (layout === "logo_left") return "stack_logo_left";
  if (VALID_FRONT_LAYOUT.has(layout as FrontLayout)) return layout as FrontLayout;
  return "stack";
}

/** Cross-orientation mapping: when the user flips orientation, snap the
 *  current front layout to the closest counterpart in the target orientation. */
const FRONT_LAYOUT_COUNTERPART: Record<FrontLayout, { landscape: FrontLayout; portrait: FrontLayout }> = {
  stack: { landscape: "stack", portrait: "p_stack" },
  stack_logo_left: { landscape: "stack_logo_left", portrait: "p_centered" },
  stack_logo_right: { landscape: "stack_logo_right", portrait: "p_centered" },
  centered: { landscape: "centered", portrait: "p_centered" },
  bold: { landscape: "bold", portrait: "p_logo_top" },
  p_centered: { landscape: "centered", portrait: "p_centered" },
  p_stack: { landscape: "stack", portrait: "p_stack" },
  p_logo_top: { landscape: "bold", portrait: "p_logo_top" },
};

export function frontLayoutForOrientation(layout: FrontLayout, orientation: Orientation): FrontLayout {
  if (frontLayoutOrientation(layout) === orientation) return layout;
  return FRONT_LAYOUT_COUNTERPART[layout][orientation];
}

// ─── Back layouts ────────────────────────────────────────────────────────────

export type BackLayoutOption = {
  id: BackLayout;
  name: string;
  orientation: Orientation;
};

export const BACK_LAYOUTS: BackLayoutOption[] = [
  /* Landscape */
  { id: "one_qr", name: "One QR", orientation: "landscape" },
  { id: "two_qr", name: "Two QRs", orientation: "landscape" },
  { id: "logo_qr", name: "Logo + QR", orientation: "landscape" },
  { id: "type", name: "Type Led", orientation: "landscape" },
  { id: "minimal", name: "Minimal", orientation: "landscape" },
  /* Portrait */
  { id: "p_one_qr", name: "One QR", orientation: "portrait" },
  { id: "p_two_qr", name: "Two QRs (stacked)", orientation: "portrait" },
  { id: "p_logo_qr", name: "Logo + QR", orientation: "portrait" },
];

const BACK_LAYOUT_ORIENTATION: Record<BackLayout, Orientation> = BACK_LAYOUTS.reduce(
  (acc, opt) => {
    acc[opt.id] = opt.orientation;
    return acc;
  },
  {} as Record<BackLayout, Orientation>,
);

const VALID_BACK_LAYOUT = new Set<BackLayout>(Object.keys(BACK_LAYOUT_ORIENTATION) as BackLayout[]);

export function backLayoutsFor(orientation: Orientation): BackLayoutOption[] {
  return BACK_LAYOUTS.filter((l) => l.orientation === orientation);
}

export function backLayoutOrientation(layout: BackLayout): Orientation {
  return BACK_LAYOUT_ORIENTATION[layout] ?? "landscape";
}

/** Unknown ids fall back to `two_qr` (legacy default). Missing layout uses `whenMissing` (factory default). */
export function normalizeBackLayout(layout: unknown, whenMissing: BackLayout = "one_qr"): BackLayout {
  if (layout === undefined || layout === null) return whenMissing;
  if (VALID_BACK_LAYOUT.has(layout as BackLayout)) return layout as BackLayout;
  return "two_qr";
}

const BACK_LAYOUT_COUNTERPART: Record<BackLayout, { landscape: BackLayout; portrait: BackLayout }> = {
  one_qr: { landscape: "one_qr", portrait: "p_one_qr" },
  two_qr: { landscape: "two_qr", portrait: "p_two_qr" },
  logo_qr: { landscape: "logo_qr", portrait: "p_logo_qr" },
  type: { landscape: "type", portrait: "p_one_qr" },
  minimal: { landscape: "minimal", portrait: "p_two_qr" },
  p_one_qr: { landscape: "one_qr", portrait: "p_one_qr" },
  p_two_qr: { landscape: "two_qr", portrait: "p_two_qr" },
  p_logo_qr: { landscape: "logo_qr", portrait: "p_logo_qr" },
};

export function backLayoutForOrientation(layout: BackLayout, orientation: Orientation): BackLayout {
  if (backLayoutOrientation(layout) === orientation) return layout;
  return BACK_LAYOUT_COUNTERPART[layout][orientation];
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
  /* ── Landscape ────────────────────────────────────────────────────────── */
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

  /* ── Portrait ─────────────────────────────────────────────────────────── */
  p_centered: {
    ...FRONT_NEUTRAL_DEFAULTS,
    logoScale: 1.5,
    textOffsetX: 0,
    nameTitleBlockOffsetY: 69,
    nameTitleGap: 54,
    contactOffsetY: 105,
    contactTelEmailGap: 69,
  },
  p_stack: {
    ...FRONT_NEUTRAL_DEFAULTS,
    logoScale: 1.9,
    logoOffsetX: -87,
    logoOffsetY: 244,
    textOffsetX: 0,
    nameTitleBlockOffsetY: 37,
    nameTitleGap: 44,
    contactOffsetY: 147,
    contactTelEmailGap: 56,
    fontScaleContactLabel: 1.05,
    fontScaleContactValue: 1.1,
  },
  p_logo_top: {
    ...FRONT_NEUTRAL_DEFAULTS,
    logoScale: 1.6,
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
  /* Landscape */
  one_qr: { ...BACK_NEUTRAL_DEFAULTS },
  two_qr: { ...BACK_NEUTRAL_DEFAULTS },
  logo_qr: { ...BACK_NEUTRAL_DEFAULTS, logoScale: 1.1 },
  type: { ...BACK_NEUTRAL_DEFAULTS },
  minimal: { ...BACK_NEUTRAL_DEFAULTS },
  /* Portrait */
  p_one_qr: { ...BACK_NEUTRAL_DEFAULTS },
  p_two_qr: { ...BACK_NEUTRAL_DEFAULTS },
  p_logo_qr: { ...BACK_NEUTRAL_DEFAULTS, logoScale: 1.1 },
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

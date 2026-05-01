import type { FrontLayout, FrontState } from "./types";
import { CARD_GEOM_SCALE } from "./print";

// ─── Contact gap ─────────────────────────────────────────────────────────────

/** TEL vs EMAIL row spacing in stack layouts (viewBox units). */
export const CONTACT_TEL_EMAIL_GAP_DEFAULT = Math.round(28 * CARD_GEOM_SCALE);
export const CONTACT_TEL_EMAIL_GAP_RANGE = {
  min: Math.round(14 * CARD_GEOM_SCALE),
  max: Math.round(120 * CARD_GEOM_SCALE),
  step: 1,
} as const;

export function clampContactTelEmailGap(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : CONTACT_TEL_EMAIL_GAP_DEFAULT;
  return Math.min(
    CONTACT_TEL_EMAIL_GAP_RANGE.max,
    Math.max(CONTACT_TEL_EMAIL_GAP_RANGE.min, x),
  );
}

// ─── Name–title gap ──────────────────────────────────────────────────────────

export const NAME_TITLE_GAP_DEFAULT_STACK = Math.round(18 * CARD_GEOM_SCALE);
export const NAME_TITLE_GAP_DEFAULT_CENTERED = Math.round(22 * CARD_GEOM_SCALE);
/** Bold layout: title sits low; gap tuned for tall portrait card. */
export const NAME_TITLE_GAP_DEFAULT_BOLD = Math.round(28 * CARD_GEOM_SCALE);

export function defaultNameTitleGap(layout: FrontLayout): number {
  switch (layout) {
    case "centered":
      return NAME_TITLE_GAP_DEFAULT_CENTERED;
    case "bold":
      return NAME_TITLE_GAP_DEFAULT_BOLD;
    default:
      return NAME_TITLE_GAP_DEFAULT_STACK;
  }
}

export const NAME_TITLE_GAP_RANGE = {
  min: 8,
  max: Math.round(100 * CARD_GEOM_SCALE),
  step: 1,
} as const;

export function clampNameTitleGap(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : NAME_TITLE_GAP_DEFAULT_STACK;
  return Math.min(NAME_TITLE_GAP_RANGE.max, Math.max(NAME_TITLE_GAP_RANGE.min, x));
}

// ─── Front font scales ───────────────────────────────────────────────────────

export const FONT_SCALE_RANGE = { min: 0.55, max: 1.75, step: 0.05 } as const;

export function clampFontScale(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 1;
  return Math.min(FONT_SCALE_RANGE.max, Math.max(FONT_SCALE_RANGE.min, x));
}

function fontClampPx(lo: number, hi: number, n: number): number {
  return Math.min(hi, Math.max(lo, n));
}

const S = CARD_GEOM_SCALE;

export const FRONT_FONT_NAME_BASE: Record<FrontLayout, number> = {
  stack: Math.round(34 * S),
  stack_logo_left: Math.round(34 * S),
  stack_logo_right: Math.round(34 * S),
  centered: Math.round(28 * S),
  bold: Math.round(56 * S),
};

export const FRONT_FONT_TITLE_BASE: Record<FrontLayout, number> = {
  stack: Math.round(15 * S),
  stack_logo_left: Math.round(15 * S),
  stack_logo_right: Math.round(15 * S),
  centered: Math.round(14 * S),
  bold: Math.round(14 * S),
};

export const FRONT_FONT_CONTACT_LABEL_BASE: Record<FrontLayout, number> = {
  stack: Math.round(14 * S),
  stack_logo_left: Math.round(14 * S),
  stack_logo_right: Math.round(14 * S),
  centered: Math.round(14 * S),
  bold: Math.round(14 * S),
};

export const FRONT_FONT_CONTACT_VALUE_BASE: Record<FrontLayout, number> = {
  stack: Math.round(16 * S),
  stack_logo_left: Math.round(16 * S),
  stack_logo_right: Math.round(16 * S),
  centered: Math.round(15 * S),
  bold: Math.round(15 * S),
};

const NAME_PX_MAX = Math.round(200 * S);
const TITLE_PX_MAX = Math.round(48 * S);
const CONTACT_LABEL_PX_MAX = Math.round(36 * S);
const CONTACT_VALUE_PX_MAX = Math.round(44 * S);

export function frontFontNamePx(layout: FrontLayout, scale: unknown): number {
  return fontClampPx(
    Math.round(15 * S),
    NAME_PX_MAX,
    Math.round(FRONT_FONT_NAME_BASE[layout] * clampFontScale(scale)),
  );
}

export function frontFontTitlePx(layout: FrontLayout, scale: unknown): number {
  return fontClampPx(
    Math.round(14 * S),
    TITLE_PX_MAX,
    Math.round(FRONT_FONT_TITLE_BASE[layout] * clampFontScale(scale)),
  );
}

export function frontFontContactLabelPx(layout: FrontLayout, scale: unknown): number {
  return fontClampPx(
    Math.round(14 * S),
    CONTACT_LABEL_PX_MAX,
    Math.round(FRONT_FONT_CONTACT_LABEL_BASE[layout] * clampFontScale(scale)),
  );
}

export function frontFontContactValuePx(layout: FrontLayout, scale: unknown): number {
  return fontClampPx(
    Math.round(14 * S),
    CONTACT_VALUE_PX_MAX,
    Math.round(FRONT_FONT_CONTACT_VALUE_BASE[layout] * clampFontScale(scale)),
  );
}

/** Sub-range of FONT_SCALE_RANGE where each step changes rendered px (layout-specific). */
export function effectiveFontScaleRangeFor(
  layout: FrontLayout,
  pxFn: (layout: FrontLayout, scale: number) => number,
): { min: number; max: number; step: number } {
  const { min, max, step } = FONT_SCALE_RANGE;
  const nSteps = Math.round((max - min) / step);
  const sAt = (i: number) => Math.round((min + i * step) * 100) / 100;

  const bot = pxFn(layout, sAt(0));
  let iLo = 0;
  for (let i = 1; i <= nSteps; i++) {
    if (pxFn(layout, sAt(i)) > bot) {
      iLo = i;
      break;
    }
  }

  const top = pxFn(layout, sAt(nSteps));
  let iHi = nSteps;
  for (let i = nSteps - 1; i >= 0; i--) {
    if (pxFn(layout, sAt(i)) < top) {
      iHi = i + 1;
      break;
    }
  }

  if (sAt(iHi) < sAt(iLo)) {
    return { min, max, step };
  }
  return { min: sAt(iLo), max: sAt(iHi), step };
}

/** Pin stored font scales so every slider tick maps to a different on-card px size. */
export function normalizeFrontFontScalesForLayout(f: FrontState): FrontState {
  const rN = effectiveFontScaleRangeFor(f.layout, frontFontNamePx);
  const rT = effectiveFontScaleRangeFor(f.layout, frontFontTitlePx);
  const rCL = effectiveFontScaleRangeFor(f.layout, frontFontContactLabelPx);
  const rCV = effectiveFontScaleRangeFor(f.layout, frontFontContactValuePx);
  return {
    ...f,
    fontScaleName: Math.min(rN.max, Math.max(rN.min, clampFontScale(f.fontScaleName))),
    fontScaleTitle: Math.min(rT.max, Math.max(rT.min, clampFontScale(f.fontScaleTitle))),
    fontScaleContactLabel: Math.min(rCL.max, Math.max(rCL.min, clampFontScale(f.fontScaleContactLabel))),
    fontScaleContactValue: Math.min(rCV.max, Math.max(rCV.min, clampFontScale(f.fontScaleContactValue))),
  };
}

// ─── Back font sizes ─────────────────────────────────────────────────────────

export const BACK_FONT_CAPTION_DEFAULT = Math.round(15 * S);
export const BACK_FONT_DISPLAY_DEFAULT = Math.round(54 * S);
export const BACK_FONT_MINIMAL_DEFAULT = Math.round(18 * S);

export const BACK_FONT_QR_CAPTION_SLIDER_RANGE = {
  min: Math.round(14 * S),
  max: Math.round(40 * S),
  step: 1,
} as const;
export const BACK_FONT_DISPLAY_SLIDER_RANGE = {
  min: Math.round(28 * S),
  max: Math.round(140 * S),
  step: 1,
} as const;
export const BACK_FONT_MINIMAL_LINK_SLIDER_RANGE = {
  min: Math.round(14 * S),
  max: Math.round(52 * S),
  step: 1,
} as const;

export function clampFontQrCaption(n: unknown): number {
  const { min, max } = BACK_FONT_QR_CAPTION_SLIDER_RANGE;
  const x = typeof n === "number" && Number.isFinite(n) ? n : BACK_FONT_CAPTION_DEFAULT;
  return Math.round(Math.min(max, Math.max(min, x)));
}

export function clampFontBackDisplay(n: unknown): number {
  const { min, max } = BACK_FONT_DISPLAY_SLIDER_RANGE;
  const x = typeof n === "number" && Number.isFinite(n) ? n : BACK_FONT_DISPLAY_DEFAULT;
  return Math.round(Math.min(max, Math.max(min, x)));
}

export function clampFontMinimalLink(n: unknown): number {
  const { min, max } = BACK_FONT_MINIMAL_LINK_SLIDER_RANGE;
  const x = typeof n === "number" && Number.isFinite(n) ? n : BACK_FONT_MINIMAL_DEFAULT;
  return Math.round(Math.min(max, Math.max(min, x)));
}

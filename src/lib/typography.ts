import type { FrontLayout, FrontState } from "./types";
import { SAFE_INSET, VB_H } from "./print";

// ─── Contact gap ─────────────────────────────────────────────────────────────

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

// ─── Name–title gap ──────────────────────────────────────────────────────────

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

// ─── Front font scales ───────────────────────────────────────────────────────

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

/* Base font sizes are in SVG viewBox units (160/inch).
 * Convert to print points with × 72/160 = 0.45. We target ≥ 6.5 pt floor
 * on every live-text field so names, titles, and contact values stay
 * legible at 300 DPI on a 3.5" × 2" card. */

export const FRONT_FONT_TITLE_BASE: Record<FrontLayout, number> = {
  stack: 15,       // ~6.75 pt
  stack_logo_left: 15,
  stack_logo_right: 15,
  centered: 14,    // ~6.30 pt
  bold: 14,
  text_left: 14,
  logo_left: 14,
};

export const FRONT_FONT_CONTACT_LABEL_BASE: Record<FrontLayout, number> = {
  stack: 14,       // ~6.30 pt
  stack_logo_left: 14,
  stack_logo_right: 14,
  centered: 14,
  bold: 14,
  text_left: 14,
  logo_left: 14,
};

export const FRONT_FONT_CONTACT_VALUE_BASE: Record<FrontLayout, number> = {
  stack: 16,       // ~7.20 pt
  stack_logo_left: 16,
  stack_logo_right: 16,
  centered: 15,    // ~6.75 pt
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

export const BACK_FONT_CAPTION_DEFAULT = 15;   // ~6.75 pt
export const BACK_FONT_DISPLAY_DEFAULT = 54;   // ~24.3 pt
export const BACK_FONT_MINIMAL_DEFAULT = 18;   // ~8.10 pt

export const BACK_FONT_QR_CAPTION_SLIDER_RANGE = { min: 14, max: 24, step: 1 } as const;
export const BACK_FONT_DISPLAY_SLIDER_RANGE = { min: 20, max: 96, step: 1 } as const;
export const BACK_FONT_MINIMAL_LINK_SLIDER_RANGE = { min: 14, max: 34, step: 1 } as const;

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

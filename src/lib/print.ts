/* ──────────────────────────────────────────────────────────
 * Print / SVG dimension constants
 *
 * Card: 8.5" × 5.5" finished (landscape)
 * Bleed: 0.125" on all sides → full-bleed doc 8.75" × 5.75"
 * Safe area: 0.125" inside finished edge = 0.25" from bleed edge
 *
 * SVG viewBox uses 160 units/inch (convenient whole numbers):
 *   full-bleed: 1400 × 920
 *   finished:   1360 × 880, offset (20, 20)
 *   safe area:  1320 × 840, offset (40, 40)
 * ────────────────────────────────────────────────────────── */

export const DPI = 300;
export const INCH = 160; // SVG units per inch

export const FINISHED_W_IN = 8.5;
export const FINISHED_H_IN = 5.5;
export const BLEED_IN = 0.125;

export const VB_W = Math.round((FINISHED_W_IN + 2 * BLEED_IN) * INCH);
export const VB_H = Math.round((FINISHED_H_IN + 2 * BLEED_IN) * INCH);
export const BLEED = Math.round(BLEED_IN * INCH);
export const SAFE_INSET = BLEED * 2;

/** Pixel dimensions at 300 DPI for raster export. */
export const PX_W = Math.round((FINISHED_W_IN + 2 * BLEED_IN) * DPI);
export const PX_H = Math.round((FINISHED_H_IN + 2 * BLEED_IN) * DPI);

/** Legacy 3.5×2" card viewBox (pre–La Volta tall format). Used to scale typography & offsets. */
export const CARD_VB_LEGACY_W = 600;
export const CARD_VB_LEGACY_H = 360;

/** Area scale √(new/legacy) — use for font bases, gaps, logo hints. */
export const CARD_GEOM_SCALE = Math.sqrt((VB_W * VB_H) / (CARD_VB_LEGACY_W * CARD_VB_LEGACY_H));

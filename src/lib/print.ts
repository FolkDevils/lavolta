/* ──────────────────────────────────────────────────────────
 * Print / SVG dimension constants
 *
 * Standard US business card: 3.5" × 2.0" finished
 * Bleed: 0.125" on all sides → full-bleed doc 3.75" × 2.25"
 * Safe area: 0.125" inside finished edge = 0.25" from bleed edge
 *
 * SVG viewBox uses 160 units/inch (convenient whole numbers):
 *   full-bleed: 600 × 360
 *   finished:   560 × 320, offset (20, 20)
 *   safe area:  520 × 280, offset (40, 40)
 * ────────────────────────────────────────────────────────── */

export const DPI = 300;
export const INCH = 160; // SVG units per inch

export const FINISHED_W_IN = 3.5;
export const FINISHED_H_IN = 2.0;
export const BLEED_IN = 0.125;

export const VB_W = Math.round((FINISHED_W_IN + 2 * BLEED_IN) * INCH); // 600
export const VB_H = Math.round((FINISHED_H_IN + 2 * BLEED_IN) * INCH); // 360
export const BLEED = Math.round(BLEED_IN * INCH);                        // 20
export const SAFE_INSET = BLEED * 2;                                     // 40 (0.25" from bleed edge)

/** Pixel dimensions at 300 DPI for raster export. */
export const PX_W = Math.round((FINISHED_W_IN + 2 * BLEED_IN) * DPI); // 1125
export const PX_H = Math.round((FINISHED_H_IN + 2 * BLEED_IN) * DPI); // 675

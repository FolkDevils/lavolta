/* ──────────────────────────────────────────────────────────
 * Print / SVG dimension constants
 *
 * Card finished sizes:
 *   landscape — 8.5" × 5.5"
 *   portrait  — 5.5" × 8.5" (long edge vertical)
 * Bleed: 0.125" on all sides → +0.25" each axis
 * Safe area: 0.125" inside finished edge = 0.25" from bleed edge
 *
 * SVG viewBox uses 160 units/inch (convenient whole numbers):
 *   landscape full-bleed: 1400 × 920
 *   portrait  full-bleed:  920 × 1400
 *
 * The exported `VB_W` / `VB_H` / `PX_W` / `PX_H` constants are the
 * **landscape** values for back-compat. Use `getCardDims(orientation)`
 * for orientation-aware geometry inside renderers and exporters.
 * ────────────────────────────────────────────────────────── */

import type { Orientation } from "./types";

export const DPI = 300;
export const INCH = 160; // SVG units per inch

/** Long edge of the card in inches (8.5"). Same for both orientations. */
export const CARD_LONG_IN = 8.5;
/** Short edge of the card in inches (5.5"). */
export const CARD_SHORT_IN = 5.5;
export const BLEED_IN = 0.125;

/** Landscape finished dims (legacy default — kept exported for back-compat). */
export const FINISHED_W_IN = CARD_LONG_IN;
export const FINISHED_H_IN = CARD_SHORT_IN;

export const BLEED = Math.round(BLEED_IN * INCH);
export const SAFE_INSET = BLEED * 2;

/** Landscape viewBox (kept as named constants for the existing call sites). */
export const VB_W = Math.round((FINISHED_W_IN + 2 * BLEED_IN) * INCH);
export const VB_H = Math.round((FINISHED_H_IN + 2 * BLEED_IN) * INCH);

/** Landscape pixel dims at 300 DPI (kept exported for the existing call sites). */
export const PX_W = Math.round((FINISHED_W_IN + 2 * BLEED_IN) * DPI);
export const PX_H = Math.round((FINISHED_H_IN + 2 * BLEED_IN) * DPI);

export type CardDims = {
  orientation: Orientation;
  finishedWIn: number;
  finishedHIn: number;
  vbW: number;
  vbH: number;
  pxW: number;
  pxH: number;
};

/** Geometry for a given orientation. Portrait simply swaps the long/short axes. */
export function getCardDims(orientation: Orientation): CardDims {
  const longSide = CARD_LONG_IN + 2 * BLEED_IN;
  const shortSide = CARD_SHORT_IN + 2 * BLEED_IN;
  if (orientation === "portrait") {
    return {
      orientation,
      finishedWIn: CARD_SHORT_IN,
      finishedHIn: CARD_LONG_IN,
      vbW: Math.round(shortSide * INCH),
      vbH: Math.round(longSide * INCH),
      pxW: Math.round(shortSide * DPI),
      pxH: Math.round(longSide * DPI),
    };
  }
  return {
    orientation,
    finishedWIn: CARD_LONG_IN,
    finishedHIn: CARD_SHORT_IN,
    vbW: Math.round(longSide * INCH),
    vbH: Math.round(shortSide * INCH),
    pxW: Math.round(longSide * DPI),
    pxH: Math.round(shortSide * DPI),
  };
}

/** Legacy 3.5×2" card viewBox (pre–La Volta tall format). Used to scale typography & offsets. */
export const CARD_VB_LEGACY_W = 600;
export const CARD_VB_LEGACY_H = 360;

/** Area scale √(new/legacy) — use for font bases, gaps, logo hints.
 *  Identical for landscape and portrait (same total area). */
export const CARD_GEOM_SCALE = Math.sqrt((VB_W * VB_H) / (CARD_VB_LEGACY_W * CARD_VB_LEGACY_H));

/**
 * Re-export barrel — all public symbols remain importable from "@/lib/constants"
 * so existing call sites don't need to change.
 *
 * Actual implementations live in the focused sub-modules:
 *   lib/print.ts      — SVG viewBox / print dimensions
 *   lib/palette.ts    — color defs, logos, flowers, clamp helpers
 *   lib/layouts.ts    — front/back layout options, QR normalizers
 *   lib/typography.ts — font scale helpers, gap clamps
 *   lib/defaults.ts   — factory defaults, per-person, migration
 *   lib/storage.ts    — localStorage key
 */

export * from "./print";
export * from "./palette";
export * from "./layouts";
export * from "./typography";
export * from "./defaults";
export * from "./storage";

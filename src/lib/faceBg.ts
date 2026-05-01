import type { FaceBgImageConfig } from "./types";
import { CARD_GEOM_SCALE } from "./print";

export const DEFAULT_BRAND_BG_SRC = "/brand/BG.png";

export const DEFAULT_FACE_BG_IMAGE: FaceBgImageConfig = {
  enabled: false,
  src: DEFAULT_BRAND_BG_SRC,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  tintEnabled: false,
  tintColor: "#6B1E2D",
  tintOpacity: 0.35,
};

/** Default background photo for the BACK face — branded BG.png with dark tint. */
export const DEFAULT_BACK_BG_IMAGE: FaceBgImageConfig = {
  enabled: true,
  src: DEFAULT_BRAND_BG_SRC,
  offsetX: 1,
  offsetY: 0,
  scale: 1.5,
  tintEnabled: true,
  tintColor: "#000000",
  tintOpacity: 0.52,
};

export const FACE_BG_SCALE_RANGE = { min: 0.5, max: 2.5, step: 0.02 } as const;
export const FACE_BG_OFFSET_RANGE = { max: Math.round(160 * CARD_GEOM_SCALE), step: 2 } as const;
export const FACE_BG_TINT_OPACITY_RANGE = { min: 0, max: 1, step: 0.02 } as const;

export function clampFaceBgScale(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 1;
  return Math.min(FACE_BG_SCALE_RANGE.max, Math.max(FACE_BG_SCALE_RANGE.min, x));
}

export function clampFaceBgOffset(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.min(FACE_BG_OFFSET_RANGE.max, Math.max(-FACE_BG_OFFSET_RANGE.max, x));
}

export function clampTintOpacity(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 0.35;
  return Math.min(1, Math.max(0, x));
}

export function normalizeFaceBgImage(raw: unknown): FaceBgImageConfig {
  const base = { ...DEFAULT_FACE_BG_IMAGE };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const src = typeof o.src === "string" && o.src.trim() ? o.src.trim() : base.src;
  return {
    enabled: Boolean(o.enabled),
    src,
    offsetX: clampFaceBgOffset(o.offsetX),
    offsetY: clampFaceBgOffset(o.offsetY),
    scale: clampFaceBgScale(o.scale),
    tintEnabled: Boolean(o.tintEnabled),
    tintColor:
      typeof o.tintColor === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(o.tintColor.trim())
        ? o.tintColor.trim()
        : base.tintColor,
    tintOpacity: clampTintOpacity(o.tintOpacity),
  };
}

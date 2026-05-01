import type { LogoImageAdjust } from "./types";

/** CSS filter string for `<image style={{ filter }} />` (SVG + raster export). */
export function buildLogoImageFilter(a: LogoImageAdjust | undefined): string | undefined {
  if (!a) return undefined;
  const { hueRotate, brightness, saturate, contrast } = a;
  if (
    hueRotate === 0 &&
    brightness === 100 &&
    saturate === 100 &&
    contrast === 100
  ) {
    return undefined;
  }
  return `hue-rotate(${hueRotate}deg) brightness(${brightness}%) saturate(${saturate}%) contrast(${contrast}%)`;
}

export const LOGO_ADJUST_DEFAULTS: LogoImageAdjust = {
  hueRotate: 0,
  brightness: 100,
  saturate: 100,
  contrast: 100,
};

export function clampLogoHueRotate(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.min(360, Math.max(0, x));
}

export function clampLogoPercent(n: unknown, fallback: number, lo: number, hi: number): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.min(hi, Math.max(lo, x));
}

export function normalizeLogoImageAdjust(raw: unknown): LogoImageAdjust {
  if (!raw || typeof raw !== "object") return { ...LOGO_ADJUST_DEFAULTS };
  const o = raw as Record<string, unknown>;
  return {
    hueRotate: clampLogoHueRotate(o.hueRotate),
    brightness: clampLogoPercent(o.brightness, 100, 0, 200),
    saturate: clampLogoPercent(o.saturate, 100, 0, 200),
    contrast: clampLogoPercent(o.contrast, 100, 0, 200),
  };
}

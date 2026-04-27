import type { ColorDef } from "./palette";
import { COLORS, FD_SOLID_PALETTE, QR_COLORS } from "./palette";

/* ──────────────────────────────────────────────────────────
 * Color model
 *
 * Every color slot in the editor (card background, QR fg, text
 * primary, text secondary) is stored as a string. Two shapes:
 *
 *   - Palette id  →  e.g. "dark", "yellow", "pink"
 *   - Custom hex  →  e.g. "#ff00aa" (always #rrggbb after normalize)
 *
 * Text slots can also be `null`, meaning "inherit from the
 * background palette's paired text colors".
 * ────────────────────────────────────────────────────────── */

export const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHex(v: unknown): v is string {
  return typeof v === "string" && HEX_RE.test(v.trim());
}

/** Normalize any CSS-ish color to #rrggbb. Falls back to #000000. */
export function toHex6(v: string): string {
  const t = v.trim();
  const m6 = t.match(/^#([0-9a-f]{6})$/i);
  if (m6) return `#${m6[1].toLowerCase()}`;
  const m3 = t.match(/^#([0-9a-f]{3})$/i);
  if (m3) {
    const x = m3[1].toLowerCase();
    return `#${x[0]}${x[0]}${x[1]}${x[1]}${x[2]}${x[2]}`;
  }
  const rgba = t.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgba) {
    const r = clamp255(Number(rgba[1]));
    const g = clamp255(Number(rgba[2]));
    const b = clamp255(Number(rgba[3]));
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  }
  return "#000000";
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(Number.isFinite(n) ? n : 0)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const x = toHex6(hex).slice(1);
  return {
    r: parseInt(x.slice(0, 2), 16),
    g: parseInt(x.slice(2, 4), 16),
    b: parseInt(x.slice(4, 6), 16),
  };
}

/** Relative luminance per WCAG (0 = black, 1 = white) */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

/** Returns #ffffff or a near-black that reads on the given bg. */
export function readableText(bgHex: string): string {
  return luminance(bgHex) > 0.55 ? "#200016" : "#ffffff";
}

/** Return an rgba() derived from a hex by applying alpha. */
export function hexWithAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r},${g},${b},${a})`;
}

/** Look up a palette option by id, or return null for hex/unknown. */
export function findPalette(value: string | null | undefined): ColorDef | null {
  if (!value) return null;
  return COLORS.find((c) => c.id === value) ?? null;
}

export type ResolvedCardPalette = {
  fill: ColorDef["fill"];
  text: string;
  sub: string;
  hair: string;
};

/**
 * Resolve a card-background color value to a complete palette:
 *   - palette id  →  use the hand-designed fill/text/sub/hair
 *   - custom hex  →  solid fill + auto-contrast text + derived sub/hair
 *   - anything else → falls back to the first palette entry
 */
export function resolveCardPalette(value: string | null | undefined): ResolvedCardPalette {
  if (isHex(value)) {
    const hex = toHex6(value);
    const text = readableText(hex);
    return {
      fill: { type: "solid", color: hex },
      text,
      sub: hexWithAlpha(text, 0.6),
      hair: hexWithAlpha(text, 0.2),
    };
  }
  const pal = findPalette(value) ?? COLORS[0];
  return { fill: pal.fill, text: pal.text, sub: pal.sub, hair: pal.hair };
}

/**
 * Resolve any string color value to a concrete hex.
 *
 * Palette ids can come from multiple places (background palette, FD solid
 * palette, QR palette) so we search all of them. If the id points at a
 * gradient entry in the background palette, we use its first stop as the
 * "dominant" hex — that's the color people mean when they say "pink".
 */
export function resolveSolidHex(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return toHex6(fallback);
  if (isHex(value)) return toHex6(value);

  const fd = FD_SOLID_PALETTE.find((c) => c.id === value);
  if (fd) return toHex6(fd.hex);

  const qc = QR_COLORS.find((c) => c.id === value);
  if (qc) return toHex6(qc.hex);

  const bg = findPalette(value);
  if (bg) {
    if (bg.fill.type === "solid") return toHex6(bg.fill.color);
    return toHex6(bg.fill.from);
  }

  return toHex6(fallback);
}

"use client";

import { useId } from "react";
import { BLEED, SAFE_INSET, VB_H, VB_W } from "@/lib/constants";
import { useCardFonts } from "./CardFontContext";
import type { COLORS } from "@/lib/constants";
import type { FaceBgImageConfig } from "@/lib/types";
import { toHex6 } from "@/lib/color";

// ─── Layout geometry helpers ─────────────────────────────────────────────────
//
// Historically these were `export const`s pinned to the landscape viewBox.
// They're kept for back-compat (LANDSCAPE values) and joined by a helper that
// returns the equivalent values for any viewBox — needed because the card now
// supports portrait orientation.

/** Content padding (0.375" inside the bleed edge) in viewBox units. */
export const PAD = SAFE_INSET + 20; // 60
export const CONTENT_X = PAD;
export const CONTENT_Y = PAD;
export const CONTENT_W = VB_W - PAD * 2;
export const CONTENT_H = VB_H - PAD * 2;

/** Per-orientation content box for the given full-bleed viewBox. */
export function contentRectFor(vbW: number, vbH: number) {
  return {
    pad: PAD,
    contentX: PAD,
    contentY: PAD,
    contentW: vbW - PAD * 2,
    contentH: vbH - PAD * 2,
  };
}

// ─── Fill helpers ────────────────────────────────────────────────────────────

type FillDef = (typeof COLORS)[number]["fill"];

function FillDefs({ id, def }: { id: string; def: FillDef }) {
  if (def.type === "solid") return null;
  return (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={def.from} />
      <stop offset="100%" stopColor={def.to} />
    </linearGradient>
  );
}

export function fillFor(def: FillDef, gradId: string) {
  return def.type === "solid" ? def.color : `url(#${gradId})`;
}

function FaceBackgroundImage({
  cfg,
  vbW,
  vbH,
}: {
  cfg: FaceBgImageConfig;
  vbW: number;
  vbH: number;
}) {
  if (!cfg.enabled || !cfg.src) return null;
  const tint =
    cfg.tintEnabled && cfg.tintOpacity > 0
      ? { fill: toHex6(cfg.tintColor), opacity: cfg.tintOpacity }
      : null;
  return (
    <g pointerEvents="none">
      <g
        transform={`translate(${vbW / 2 + cfg.offsetX} ${vbH / 2 + cfg.offsetY}) scale(${cfg.scale}) translate(${-vbW / 2} ${-vbH / 2})`}
      >
        <image
          href={cfg.src}
          x={0}
          y={0}
          width={vbW}
          height={vbH}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
      {tint ? <rect x={0} y={0} width={vbW} height={vbH} fill={tint.fill} fillOpacity={tint.opacity} /> : null}
    </g>
  );
}

// ─── CardShell ───────────────────────────────────────────────────────────────

/** Base SVG shell: background fill, bleed mask, optional guides.
 *  Pass `vbW` / `vbH` to render at any orientation. They default to the
 *  landscape viewBox so existing call sites keep working. */
export function CardShell({
  children,
  fillDef,
  guides,
  bgImage,
  vbW = VB_W,
  vbH = VB_H,
}: {
  children: React.ReactNode;
  fillDef: FillDef;
  guides?: boolean;
  /** Optional photo between solid fill and `children` (pattern + ink). */
  bgImage?: FaceBgImageConfig;
  vbW?: number;
  vbH?: number;
}) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `bg-${uid}`;
  const clipId = `clip-${uid}`;
  return (
    <>
      <defs>
        <FillDefs id={gradId} def={fillDef} />
        <clipPath id={clipId}>
          <rect x={0} y={0} width={vbW} height={vbH} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={vbW} height={vbH} fill={fillFor(fillDef, gradId)} />
      <g clipPath={`url(#${clipId})`}>
        {bgImage ? <FaceBackgroundImage cfg={bgImage} vbW={vbW} vbH={vbH} /> : null}
        {children}
      </g>
      {guides ? (
        <g pointerEvents="none">
          <rect
            x={BLEED}
            y={BLEED}
            width={vbW - BLEED * 2}
            height={vbH - BLEED * 2}
            fill="none"
            stroke="#ff0011"
            strokeDasharray="6 4"
            strokeWidth={1.2}
          />
          <rect
            x={SAFE_INSET}
            y={SAFE_INSET}
            width={vbW - SAFE_INSET * 2}
            height={vbH - SAFE_INSET * 2}
            fill="none"
            stroke="#ff58cd"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        </g>
      ) : null}
    </>
  );
}

// ─── Typography helper ───────────────────────────────────────────────────────

type TxtProps = React.SVGProps<SVGTextElement> & {
  children: React.ReactNode;
  /** Display serif (name, titles) vs sans (contact, captions). */
  variant?: "serif" | "sans";
};
export function Txt({ children, variant = "serif", ...p }: TxtProps) {
  const { serif, sans } = useCardFonts();
  const stack =
    variant === "sans"
      ? `"${sans}", ui-sans-serif, system-ui, sans-serif`
      : `"${serif}", ui-serif, Georgia, serif`;
  return (
    <text fontFamily={stack} {...p}>
      {children}
    </text>
  );
}

// ─── Layout utility ──────────────────────────────────────────────────────────

/** Clamp a 1-D position so a box of `size` stays fully inside [min, max].
 *  If the box is larger than the window, center it instead. */
export function clampBox(pos: number, size: number, min: number, max: number): number {
  const hi = max - size;
  if (hi < min) return (min + hi) / 2;
  return Math.min(hi, Math.max(min, pos));
}

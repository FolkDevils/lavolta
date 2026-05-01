"use client";

import { useId } from "react";
import { BLEED, SAFE_INSET, VB_H, VB_W } from "@/lib/constants";
import type { COLORS } from "@/lib/constants";
import type { FaceBgImageConfig } from "@/lib/types";
import { toHex6 } from "@/lib/color";

// ─── Layout geometry constants ───────────────────────────────────────────────

export const PAD = SAFE_INSET + 20; // 60 — content padding (0.375" from bleed edge)
export const CONTENT_X = PAD;
export const CONTENT_Y = PAD;
export const CONTENT_W = VB_W - PAD * 2;
export const CONTENT_H = VB_H - PAD * 2;

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

function FaceBackgroundImage({ cfg }: { cfg: FaceBgImageConfig }) {
  if (!cfg.enabled || !cfg.src) return null;
  const tint =
    cfg.tintEnabled && cfg.tintOpacity > 0
      ? { fill: toHex6(cfg.tintColor), opacity: cfg.tintOpacity }
      : null;
  return (
    <g pointerEvents="none">
      <g
        transform={`translate(${VB_W / 2 + cfg.offsetX} ${VB_H / 2 + cfg.offsetY}) scale(${cfg.scale}) translate(${-VB_W / 2} ${-VB_H / 2})`}
      >
        <image
          href={cfg.src}
          x={0}
          y={0}
          width={VB_W}
          height={VB_H}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
      {tint ? <rect x={0} y={0} width={VB_W} height={VB_H} fill={tint.fill} fillOpacity={tint.opacity} /> : null}
    </g>
  );
}

// ─── CardShell ───────────────────────────────────────────────────────────────

/** Base SVG shell: background fill, bleed mask, optional guides. */
export function CardShell({
  children,
  fillDef,
  guides,
  bgImage,
}: {
  children: React.ReactNode;
  fillDef: FillDef;
  guides?: boolean;
  /** Optional photo between solid fill and `children` (pattern + ink). */
  bgImage?: FaceBgImageConfig;
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
          <rect x={0} y={0} width={VB_W} height={VB_H} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={VB_W} height={VB_H} fill={fillFor(fillDef, gradId)} />
      <g clipPath={`url(#${clipId})`}>
        {bgImage ? <FaceBackgroundImage cfg={bgImage} /> : null}
        {children}
      </g>
      {guides ? (
        <g pointerEvents="none">
          <rect
            x={BLEED}
            y={BLEED}
            width={VB_W - BLEED * 2}
            height={VB_H - BLEED * 2}
            fill="none"
            stroke="#ff0011"
            strokeDasharray="6 4"
            strokeWidth={1.2}
          />
          <rect
            x={SAFE_INSET}
            y={SAFE_INSET}
            width={VB_W - SAFE_INSET * 2}
            height={VB_H - SAFE_INSET * 2}
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
  const stack =
    variant === "sans"
      ? "var(--font-red-hat), 'Red Hat Text', ui-sans-serif, system-ui, sans-serif"
      : "var(--font-newsreader), Newsreader, ui-serif, Georgia, serif";
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

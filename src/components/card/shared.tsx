"use client";

import { useId } from "react";
import { BLEED, SAFE_INSET, VB_H, VB_W } from "@/lib/constants";
import type { COLORS } from "@/lib/constants";

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

// ─── CardShell ───────────────────────────────────────────────────────────────

/** Base SVG shell: background fill, bleed mask, optional guides. */
export function CardShell({
  children,
  fillDef,
  guides,
}: {
  children: React.ReactNode;
  fillDef: FillDef;
  guides?: boolean;
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
      <g clipPath={`url(#${clipId})`}>{children}</g>
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

type TxtProps = React.SVGProps<SVGTextElement> & { children: React.ReactNode };
export function Txt({ children, ...p }: TxtProps) {
  return (
    <text fontFamily="Rubik, sans-serif" {...p}>
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

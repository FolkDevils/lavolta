"use client";

import type { PatternConfig } from "@/lib/types";
import { FDRange, SectionLabel } from "./Primitives";

type Props = {
  cfg: PatternConfig;
  onChange: (next: PatternConfig) => void;
};

/** Tiny preview of each vector motif (matches PatternLayer shapes). */
function MotifThumb({ variant, dim }: { variant: 0 | 1 | 2; dim: number }) {
  const ink = "rgba(246,244,232,0.85)";
  const sw = Math.max(0.6, dim * 0.07);
  const vb = dim / 2;
  if (variant === 0) {
    return (
      <svg width={dim} height={dim} viewBox={`${-vb} ${-vb} ${dim} ${dim}`}>
        <circle r={dim * 0.32} fill="none" stroke={ink} strokeWidth={sw} />
        <circle r={dim * 0.14} fill="none" stroke={ink} strokeWidth={sw * 0.85} opacity={0.55} />
      </svg>
    );
  }
  if (variant === 1) {
    const s = dim * 0.4;
    return (
      <svg width={dim} height={dim} viewBox={`${-vb} ${-vb} ${dim} ${dim}`}>
        <rect
          x={-s / 2}
          y={-s / 2}
          width={s}
          height={s}
          rx={2}
          fill="none"
          stroke={ink}
          strokeWidth={sw}
          transform="rotate(45)"
        />
      </svg>
    );
  }
  return (
    <svg width={dim} height={dim} viewBox={`${-vb} ${-vb} ${dim} ${dim}`}>
      <ellipse rx={dim * 0.34} ry={dim * 0.18} fill="none" stroke={ink} strokeWidth={sw} />
      <circle r={dim * 0.065} fill={ink} fillOpacity={0.4} />
    </svg>
  );
}

export function PatternPanel({ cfg, onChange }: Props) {
  const up = <K extends keyof PatternConfig>(k: K, v: PatternConfig[K]) =>
    onChange({ ...cfg, [k]: v });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <SectionLabel mb={0}>Background Pattern</SectionLabel>
        <button
          onClick={() => up("on", !cfg.on)}
          className={`text-[8px] font-bold uppercase tracking-[0.1em] rounded px-2 py-0.5 transition border
            ${cfg.on
              ? "bg-[#6B1E2D] text-[#F6F4E8] border-[rgba(246,244,232,0.5)]"
              : "bg-transparent text-[rgba(246,244,232,0.3)] border-[rgba(246,244,232,0.15)]"}`}
        >
          {cfg.on ? "On" : "Off"}
        </button>
      </div>

      {cfg.on && (
        <>
          <div>
            <div className="text-[8px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.32)] mb-1.5">
              Motif shapes
            </div>
            <div className="flex gap-1.5">
              {([1, 2, 3] as const).map((n) => {
                const key = `f${n}` as "f1" | "f2" | "f3";
                const active = cfg[key];
                const variant = (n - 1) as 0 | 1 | 2;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => up(key, !cfg[key])}
                    className={`flex-1 h-10 rounded flex items-center justify-center transition border
                      ${active
                        ? "bg-[rgba(246,244,232,0.1)] border-[rgba(246,244,232,0.45)]"
                        : "bg-transparent border-[rgba(246,244,232,0.1)]"}`}
                  >
                    <span className={active ? "opacity-100" : "opacity-25"}>
                      <MotifThumb variant={variant} dim={28} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <FDRange label="Density" min={6} max={200} value={cfg.density} onChange={(v) => up("density", v)} />
          <FDRange label="Size" min={16} max={160} value={cfg.size} onChange={(v) => up("size", v)} unit="px" />
          <FDRange label="Rotation" min={0} max={360} value={cfg.rot} onChange={(v) => up("rot", v)} unit="°" />
          <FDRange label="Opacity" min={2} max={100} value={cfg.opacity} onChange={(v) => up("opacity", v)} unit="%" />

          <button
            type="button"
            onClick={() => up("seed", Math.floor(Math.random() * 999999))}
            className="w-full py-2 bg-[rgba(246,244,232,0.06)] border border-dashed border-[rgba(246,244,232,0.2)] rounded
              text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(246,244,232,0.6)] hover:bg-[rgba(246,244,232,0.12)] transition"
          >
            ↻ Randomize Layout
          </button>
        </>
      )}
    </div>
  );
}

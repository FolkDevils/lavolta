"use client";

import Image from "next/image";
import { FLOWER_SRCS } from "@/lib/constants";
import type { PatternConfig } from "@/lib/types";
import { FDRange, SectionLabel } from "./Primitives";

type Props = {
  cfg: PatternConfig;
  onChange: (next: PatternConfig) => void;
};

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
              Flower Types
            </div>
            <div className="flex gap-1.5">
              {([1, 2, 3] as const).map((n) => {
                const key = `f${n}` as "f1" | "f2" | "f3";
                const active = cfg[key];
                return (
                  <button
                    key={n}
                    onClick={() => up(key, !cfg[key])}
                    className={`flex-1 h-10 rounded flex items-center justify-center transition border
                      ${active
                        ? "bg-[rgba(246,244,232,0.1)] border-[rgba(246,244,232,0.45)]"
                        : "bg-transparent border-[rgba(246,244,232,0.1)]"}`}
                  >
                    <Image
                      src={FLOWER_SRCS[n - 1]}
                      alt={`flower ${n}`}
                      width={28}
                      height={28}
                      style={{
                        width: 28,
                        height: 28,
                        objectFit: "contain",
                        opacity: active ? 1 : 0.25,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <FDRange label="Density" min={6} max={80} value={cfg.density} onChange={(v) => up("density", v)} />
          <FDRange label="Size" min={16} max={160} value={cfg.size} onChange={(v) => up("size", v)} unit="px" />
          <FDRange label="Rotation" min={0} max={360} value={cfg.rot} onChange={(v) => up("rot", v)} unit="°" />
          <FDRange label="Opacity" min={2} max={80} value={cfg.opacity} onChange={(v) => up("opacity", v)} unit="%" />

          <button
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

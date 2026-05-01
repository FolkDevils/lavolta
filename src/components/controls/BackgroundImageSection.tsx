"use client";

import type { FaceBgImageConfig } from "@/lib/types";
import {
  DEFAULT_BRAND_BG_SRC,
  FACE_BG_OFFSET_RANGE,
  FACE_BG_SCALE_RANGE,
  FACE_BG_TINT_OPACITY_RANGE,
} from "@/lib/constants";
import { FDRange, SectionLabel } from "./Primitives";

type Props = {
  label: string;
  cfg: FaceBgImageConfig;
  onChange: (patch: Partial<FaceBgImageConfig>) => void;
};

export function BackgroundImageSection({ label, cfg, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <SectionLabel>{label}</SectionLabel>
      <label className="flex items-center gap-2 text-[10px] text-[rgba(246,244,232,0.75)]">
        <input
          type="checkbox"
          checked={cfg.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="rounded border-[rgba(246,244,232,0.35)]"
        />
        Use background image
      </label>
      {cfg.enabled ? (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.45)]">
              Image URL (public path)
            </span>
            <input
              type="text"
              value={cfg.src}
              onChange={(e) => onChange({ src: e.target.value || DEFAULT_BRAND_BG_SRC })}
              placeholder={DEFAULT_BRAND_BG_SRC}
              className="w-full bg-[rgba(0,0,0,0.25)] border border-[rgba(246,244,232,0.15)] rounded px-2 py-1.5 text-[11px] text-[#F6F4E8] outline-none focus:border-[rgba(246,244,232,0.4)]"
            />
          </label>
          <FDRange
            label="Pan X"
            min={-FACE_BG_OFFSET_RANGE.max}
            max={FACE_BG_OFFSET_RANGE.max}
            step={FACE_BG_OFFSET_RANGE.step}
            value={cfg.offsetX}
            onChange={(v) => onChange({ offsetX: v })}
            formatLabel={(v) => `${v > 0 ? "+" : ""}${Math.round(v)}`}
          />
          <FDRange
            label="Pan Y"
            min={-FACE_BG_OFFSET_RANGE.max}
            max={FACE_BG_OFFSET_RANGE.max}
            step={FACE_BG_OFFSET_RANGE.step}
            value={cfg.offsetY}
            onChange={(v) => onChange({ offsetY: v })}
            formatLabel={(v) => `${v > 0 ? "+" : ""}${Math.round(v)}`}
          />
          <FDRange
            label="Zoom"
            min={FACE_BG_SCALE_RANGE.min}
            max={FACE_BG_SCALE_RANGE.max}
            step={FACE_BG_SCALE_RANGE.step}
            value={cfg.scale}
            onChange={(v) => onChange({ scale: v })}
            formatLabel={(v) => `×${v.toFixed(2)}`}
          />
          <label className="flex items-center gap-2 text-[10px] text-[rgba(246,244,232,0.75)]">
            <input
              type="checkbox"
              checked={cfg.tintEnabled}
              onChange={(e) => onChange({ tintEnabled: e.target.checked })}
              className="rounded border-[rgba(246,244,232,0.35)]"
            />
            Tint overlay (readability)
          </label>
          {cfg.tintEnabled ? (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.45)]">
                  Tint color
                </span>
                <input
                  type="color"
                  value={cfg.tintColor.length === 7 ? cfg.tintColor : "#6B1E2D"}
                  onChange={(e) => onChange({ tintColor: e.target.value })}
                  className="h-8 w-full rounded border border-[rgba(246,244,232,0.2)] cursor-pointer bg-transparent"
                />
              </label>
              <FDRange
                label="Tint strength"
                min={FACE_BG_TINT_OPACITY_RANGE.min}
                max={FACE_BG_TINT_OPACITY_RANGE.max}
                step={FACE_BG_TINT_OPACITY_RANGE.step}
                value={cfg.tintOpacity}
                onChange={(v) => onChange({ tintOpacity: v })}
                formatLabel={(v) => `${Math.round(v * 100)}%`}
              />
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

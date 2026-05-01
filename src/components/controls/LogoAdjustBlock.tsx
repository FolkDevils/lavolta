"use client";

import type { LogoImageAdjust } from "@/lib/types";
import { FDRange, SectionLabel } from "./Primitives";

type Props = {
  value: LogoImageAdjust;
  onChange: (patch: Partial<LogoImageAdjust>) => void;
};

export function LogoAdjustBlock({ value, onChange }: Props) {
  const dirty =
    value.hueRotate !== 0 ||
    value.brightness !== 100 ||
    value.saturate !== 100 ||
    value.contrast !== 100;

  return (
    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-[rgba(246,244,232,0.08)]">
      <SectionLabel>Logo tone (CSS filter)</SectionLabel>
      <p className="text-[9px] text-[rgba(246,244,232,0.38)] leading-snug">
        Nudge hue and contrast to tint the raster logo toward burgundy, white, or black without replacing the
        asset.
      </p>
      <FDRange
        label="Hue rotate"
        min={0}
        max={360}
        step={1}
        value={value.hueRotate}
        onChange={(v) => onChange({ hueRotate: v })}
        formatLabel={(v) => `${Math.round(v)}°`}
      />
      <FDRange
        label="Brightness"
        min={0}
        max={200}
        step={1}
        value={value.brightness}
        onChange={(v) => onChange({ brightness: v })}
        formatLabel={(v) => `${Math.round(v)}%`}
      />
      <FDRange
        label="Saturation"
        min={0}
        max={200}
        step={1}
        value={value.saturate}
        onChange={(v) => onChange({ saturate: v })}
        formatLabel={(v) => `${Math.round(v)}%`}
      />
      <FDRange
        label="Contrast"
        min={0}
        max={200}
        step={1}
        value={value.contrast}
        onChange={(v) => onChange({ contrast: v })}
        formatLabel={(v) => `${Math.round(v)}%`}
      />
      {dirty && (
        <button
          type="button"
          onClick={() =>
            onChange({ hueRotate: 0, brightness: 100, saturate: 100, contrast: 100 })
          }
          className="self-start text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.45)] hover:text-[#F6F4E8]"
        >
          Reset logo tone
        </button>
      )}
    </div>
  );
}

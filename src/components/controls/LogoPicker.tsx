"use client";

import Image from "next/image";
import { LOGO_OFFSET_RANGE, LOGO_SCALE_RANGE, LOGOS } from "@/lib/constants";
import type { LogoId } from "@/lib/types";
import { FDRange, SectionLabel } from "./Primitives";

type Props = {
  logo: LogoId;
  logoScale: number;
  logoOffsetX: number;
  logoOffsetY: number;
  onLogo: (id: LogoId) => void;
  onScale: (n: number) => void;
  onOffsetX: (n: number) => void;
  onOffsetY: (n: number) => void;
  onResetPosition: () => void;
  /** Factory defaults used to decide when to show the Reset button. */
  baselineOffsetX?: number;
  baselineOffsetY?: number;
};

/** Compact "+20 / −15" label for offset sliders. */
export function formatSigned(v: number): string {
  const n = Math.round(v);
  if (n === 0) return "0";
  return n > 0 ? `+${n}` : `${n}`;
}

export function LogoPicker({
  logo,
  logoScale,
  logoOffsetX,
  logoOffsetY,
  onLogo,
  onScale,
  onOffsetX,
  onOffsetY,
  onResetPosition,
  baselineOffsetX = 0,
  baselineOffsetY = 0,
}: Props) {
  const hasOffset = logoOffsetX !== baselineOffsetX || logoOffsetY !== baselineOffsetY;

  return (
    <div>
      <SectionLabel>Logo</SectionLabel>
      <div className="grid grid-cols-3 gap-1.5">
        {LOGOS.map((lg) => {
          const sel = logo === lg.id;
          return (
            <button
              key={lg.id}
              type="button"
              onClick={() => onLogo(lg.id)}
              title={lg.label}
              className={`p-2 rounded flex flex-col items-center gap-1 transition border
                ${sel
                  ? "bg-[rgba(255,208,0,0.1)] border-[#ffd000]"
                  : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,208,0,0.1)] hover:border-[rgba(255,208,0,0.3)]"}`}
            >
              <div className="h-6 flex items-center justify-center">
                {lg.src ? (
                  <Image
                    src={lg.src}
                    alt=""
                    width={64}
                    height={24}
                    style={{ height: 20, width: "auto", maxWidth: 60, objectFit: "contain" }}
                    unoptimized
                  />
                ) : (
                  <div className="text-[10px] text-[rgba(255,208,0,0.3)]">—</div>
                )}
              </div>
              <div
                className={`text-[7.5px] uppercase tracking-[0.06em] leading-tight text-center ${
                  sel ? "text-[#ffd000]" : "text-[rgba(255,208,0,0.4)]"
                }`}
              >
                {lg.label}
              </div>
            </button>
          );
        })}
      </div>

      {logo !== "none" && (
        <div className="mt-3 flex flex-col gap-2">
          <FDRange
            label="Scale"
            min={LOGO_SCALE_RANGE.min}
            max={LOGO_SCALE_RANGE.max}
            step={LOGO_SCALE_RANGE.step}
            value={logoScale}
            onChange={onScale}
            formatLabel={(v) => `×${v.toFixed(2)}`}
          />
          <FDRange
            label="Offset X"
            min={-LOGO_OFFSET_RANGE.x}
            max={LOGO_OFFSET_RANGE.x}
            step={LOGO_OFFSET_RANGE.step}
            value={logoOffsetX}
            onChange={onOffsetX}
            formatLabel={formatSigned}
          />
          <FDRange
            label="Offset Y"
            min={-LOGO_OFFSET_RANGE.y}
            max={LOGO_OFFSET_RANGE.y}
            step={LOGO_OFFSET_RANGE.step}
            value={logoOffsetY}
            onChange={onOffsetY}
            formatLabel={formatSigned}
          />
          {hasOffset && (
            <button
              type="button"
              onClick={onResetPosition}
              className="self-start text-[9px] uppercase tracking-[0.1em] text-[rgba(255,208,0,0.45)] hover:text-[#ffd000]"
            >
              Reset position
            </button>
          )}
        </div>
      )}
    </div>
  );
}

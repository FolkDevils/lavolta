"use client";

import type { ReactNode } from "react";

export function SectionLabel({ children, mb = 8 }: { children: ReactNode; mb?: number }) {
  return (
    <div
      style={{ marginBottom: mb }}
      className="text-[9px] font-bold uppercase tracking-[0.14em] text-[rgba(255,208,0,0.42)]"
    >
      {children}
    </div>
  );
}

export function Divider() {
  return <div className="h-px bg-[rgba(255,208,0,0.08)] my-1" />;
}

type ChipRowProps<T extends string> = {
  options: { id: T; name: string }[];
  value: T;
  onChange: (v: T) => void;
};

export function ChipRow<T extends string>({ options, value, onChange }: ChipRowProps<T>) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((o) => {
        const sel = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`px-2.5 py-1.5 rounded text-[10px] uppercase tracking-[0.06em] transition
              ${sel
                ? "bg-[#ffd000] text-[#440031] font-bold"
                : "bg-[rgba(255,208,0,0.07)] text-[rgba(255,208,0,0.55)] hover:text-[rgba(255,208,0,0.85)]"}`}
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}

type FDRangeProps = {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  /** When set, replaces the numeric `value` + `unit` display (e.g. ×1.05). */
  formatLabel?: (v: number) => string;
  disabled?: boolean;
};

export function FDRange({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  unit = "",
  formatLabel,
  disabled = false,
}: FDRangeProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${disabled ? "opacity-45" : ""}`}>
      <div className="flex justify-between">
        <span className="text-[9px] uppercase tracking-[0.09em] text-[rgba(255,208,0,0.5)]">{label}</span>
        <span className="text-[9px] font-bold text-[#ffd000]">
          {formatLabel ? formatLabel(value) : `${value}${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={disabled ? "cursor-not-allowed" : undefined}
      />
    </div>
  );
}

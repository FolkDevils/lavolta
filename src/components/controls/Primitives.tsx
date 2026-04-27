"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";

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
    <div className="flex gap-1.5 flex-wrap">
      {options.map((o) => {
        const sel = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`px-3 py-2 rounded-md text-[10px] uppercase tracking-[0.06em] min-h-[34px] transition
              ${sel
                ? "bg-[#ffd000] text-[#440031] font-bold shadow-[0_0_0_1px_rgba(255,208,0,0.8)]"
                : "bg-[rgba(255,208,0,0.05)] border border-[rgba(255,208,0,0.1)] text-[rgba(255,208,0,0.65)] hover:text-[#ffd000] hover:border-[rgba(255,208,0,0.35)]"}`}
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * FDRange — a range slider paired with a small editable
 * numeric input that always reflects the current value.
 *
 * The input can be typed into directly and accepts both raw
 * numbers (e.g. "1.05") and formatted values (e.g. "×1.05",
 * "+20", "30%"). Non-numeric characters are stripped on commit.
 * Values are clamped to [min, max] and snapped to `step` so the
 * slider can never be driven out of range via text input.
 *
 * Commits on Enter or blur. Esc cancels the current edit.
 * ────────────────────────────────────────────────────────── */
type FDRangeProps = {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  /** When set, replaces the numeric `value` + `unit` display
   *  (e.g. ×1.05). Only used for read-only rendering — the
   *  editable input always shows the raw number. */
  formatLabel?: (v: number) => string;
  disabled?: boolean;
  /** Hide the text input (useful when the control should be slider-only). */
  readOnlyNumber?: boolean;
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
  readOnlyNumber = false,
}: FDRangeProps) {
  /* Keep the native range input inside [min,max] so the thumb never
   * sits in a dead zone when stored state is briefly out of sync
   * with clamped render bounds. */
  const clamped = Math.min(max, Math.max(min, value));
  const emit = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    /* Snap to the nearest step grid from `min`. */
    const snapped = step > 0 ? Math.round((raw - min) / step) * step + min : raw;
    const next = Math.min(max, Math.max(min, snapped));
    /* Preserve decimal precision matching `step`. */
    const decimals = step.toString().split(".")[1]?.length ?? 0;
    const rounded = decimals > 0 ? Number(next.toFixed(decimals)) : Math.round(next);
    if (rounded !== value) onChange(rounded);
  };

  return (
    <div className={`flex flex-col gap-1 ${disabled ? "opacity-45" : ""}`}>
      <div className="flex justify-between items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[rgba(255,208,0,0.55)] truncate">
          {label}
        </span>
        {readOnlyNumber ? (
          <span className="text-[10px] font-bold text-[#ffd000] tabular-nums whitespace-nowrap">
            {formatLabel ? formatLabel(clamped) : `${clamped}${unit}`}
          </span>
        ) : (
          <NumberEditor
            value={clamped}
            step={step}
            min={min}
            max={max}
            onCommit={emit}
            disabled={disabled}
            display={formatLabel ? formatLabel(clamped) : `${clamped}${unit}`}
          />
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        disabled={disabled}
        onChange={(e) => emit(Number(e.target.value))}
        className={`fd-range ${disabled ? "cursor-not-allowed" : ""}`}
      />
    </div>
  );
}

/** Compact editable numeric field. Shows `display` when idle, the
 *  raw number when focused. Commits on Enter/blur, cancels on Esc. */
function NumberEditor({
  value,
  step,
  min,
  max,
  onCommit,
  disabled,
  display,
}: {
  value: number;
  step: number;
  min: number;
  max: number;
  onCommit: (n: number) => void;
  disabled?: boolean;
  display: string;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /* When the outer value changes (e.g. via slider drag) while not focused,
   * sync the draft. Focused edits are preserved. */
  useEffect(() => {
    if (!focused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(formatRaw(value, step));
    }
  }, [value, step, focused]);

  const commit = () => {
    const parsed = parseNumericDraft(draft);
    if (parsed == null) {
      /* Invalid — revert. */
      setDraft(formatRaw(value, step));
      return;
    }
    onCommit(parsed);
    /* Reformat after commit so the text matches the stored value. */
    setDraft(formatRaw(Math.min(max, Math.max(min, parsed)), step));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDraft(formatRaw(value, step));
      inputRef.current?.blur();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onCommit(Math.min(max, value + step));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onCommit(Math.max(min, value - step));
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      aria-label="Numeric value"
      disabled={disabled}
      value={focused ? draft : display}
      onFocus={(e) => {
        setFocused(true);
        setDraft(formatRaw(value, step));
        /* Select so typing replaces immediately. */
        requestAnimationFrame(() => e.target.select());
      }}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={onKeyDown}
      className={`w-[58px] text-right bg-[rgba(255,208,0,0.04)] border border-[rgba(255,208,0,0.12)]
                  rounded px-1.5 py-0.5 text-[11px] font-bold text-[#ffd000] tabular-nums leading-tight
                  hover:border-[rgba(255,208,0,0.35)] focus:border-[#ffd000] focus:bg-[rgba(255,208,0,0.08)]
                  outline-none transition disabled:opacity-50 disabled:cursor-not-allowed`}
    />
  );
}

/** Render a raw number with a step-appropriate number of decimal places. */
function formatRaw(n: number, step: number): string {
  const decimals = step.toString().split(".")[1]?.length ?? 0;
  return decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
}

/** Accept "1.05", "×1.05", "+20", "-15", "30%", etc. Return null when
 *  the draft has no numeric content at all. */
function parseNumericDraft(s: string): number | null {
  if (s == null) return null;
  const t = s.trim();
  if (!t) return null;
  /* Keep digits, sign, and decimal point. */
  const m = t.match(/-?\d*\.?\d+/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

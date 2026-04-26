"use client";

import { isHex, toHex6 } from "@/lib/color";

/** Heroicons 24×24 solid cog-6-tooth (single path, evenodd — center reads as a hole). */
const COG_24_PATH =
  "M11.0779 2.25C10.1613 2.25 9.37909 2.91265 9.22841 3.81675L9.04974 4.88873C9.02959 5.00964 8.93542 5.1498 8.75311 5.23747C8.40905 5.40292 8.07967 5.5938 7.7674 5.8076C7.60091 5.92159 7.43259 5.9332 7.31769 5.89015L6.29851 5.50833C5.44019 5.18678 4.4752 5.53289 4.01692 6.32666L3.09493 7.92358C2.63665 8.71736 2.8194 9.72611 3.52704 10.3087L4.36756 11.0006C4.46219 11.0785 4.53629 11.2298 4.52119 11.4307C4.50706 11.6188 4.49988 11.8086 4.49988 12C4.49988 12.1915 4.50707 12.3814 4.52121 12.5695C4.53632 12.7704 4.46221 12.9217 4.36758 12.9996L3.52704 13.6916C2.8194 14.2741 2.63665 15.2829 3.09493 16.0767L4.01692 17.6736C4.4752 18.4674 5.44019 18.8135 6.29851 18.4919L7.31791 18.11C7.43281 18.067 7.60113 18.0786 7.76761 18.1925C8.07982 18.4063 8.40913 18.5971 8.75311 18.7625C8.93542 18.8502 9.02959 18.9904 9.04974 19.1113L9.22841 20.1832C9.37909 21.0874 10.1613 21.75 11.0779 21.75H12.9219C13.8384 21.75 14.6207 21.0874 14.7713 20.1832L14.95 19.1113C14.9702 18.9904 15.0643 18.8502 15.2466 18.7625C15.5907 18.5971 15.9201 18.4062 16.2324 18.1924C16.3988 18.0784 16.5672 18.0668 16.6821 18.1098L17.7012 18.4917C18.5596 18.8132 19.5246 18.4671 19.9828 17.6733L20.9048 16.0764C21.3631 15.2826 21.1804 14.2739 20.4727 13.6913L19.6322 12.9994C19.5376 12.9215 19.4635 12.7702 19.4786 12.5693C19.4927 12.3812 19.4999 12.1914 19.4999 12C19.4999 11.8085 19.4927 11.6186 19.4785 11.4305C19.4634 11.2296 19.5375 11.0783 19.6322 11.0004L20.4727 10.3084C21.1804 9.72587 21.3631 8.71711 20.9048 7.92334L19.9828 6.32642C19.5246 5.53264 18.5596 5.18654 17.7012 5.50809L16.6818 5.89C16.5669 5.93304 16.3986 5.92144 16.2321 5.80746C15.9199 5.59371 15.5906 5.40289 15.2466 5.23747C15.0643 5.1498 14.9702 5.00964 14.95 4.88873L14.7713 3.81675C14.6207 2.91265 13.8384 2.25 12.9219 2.25H11.0779ZM12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z";


/* ──────────────────────────────────────────────────────────
 * ColorSelect
 *
 * Standardized, reusable swatch picker used for every color slot
 * in the editor (card bg, QR fg, text primary, text secondary, …).
 *
 * Each slot gets:
 *   - a row of palette "chips" (matching the Folk Devils swatch look)
 *   - a Custom chip with an inline native color picker
 *   - an optional Default chip that clears to null (palette inherit)
 *
 * Value shape (all slots unified):
 *   - string matching one of options[].id → palette selected
 *   - string like "#rrggbb"                → custom selected
 *   - null                                 → "default" / inherit
 * ────────────────────────────────────────────────────────── */

export type PaletteOption = {
  id: string;
  name: string;
  /** CSS background for the swatch (can be a gradient). */
  swatch: string;
};

type ColorSelectProps = {
  value: string | null;
  onChange: (next: string | null) => void;
  options: PaletteOption[];
  /** Hex used as the starting value when the user opens the Custom picker.
   *  Usually the *currently resolved* color. */
  resolvedHex: string;
  /** Include a "Default" chip that sets value to null. */
  nullable?: { label?: string };
  /** Pass false to hide the Custom chip entirely. */
  allowCustom?: boolean;
};

export function ColorSelect({
  value,
  onChange,
  options,
  resolvedHex,
  nullable,
  allowCustom = true,
}: ColorSelectProps) {
  const isCustom = value != null && isHex(value);
  const isNull = value === null;
  const selectedPaletteId = !isCustom && !isNull ? value : undefined;

  const pickerStart = toHex6(isCustom ? (value as string) : resolvedHex);

  return (
    <div className="flex flex-wrap gap-1.5">
      {nullable ? (
        <Chip
          selected={isNull}
          label={nullable.label ?? "Default"}
          onClick={() => onChange(null)}
          swatch={
            <div className="w-6 h-6 rounded-sm border border-dashed border-[rgba(255,208,0,0.35)] flex items-center justify-center text-[10px] text-[rgba(255,208,0,0.45)]">
              ×
            </div>
          }
        />
      ) : null}

      {options.map((o) => (
        <Chip
          key={o.id}
          selected={selectedPaletteId === o.id}
          label={o.name}
          onClick={() => onChange(o.id)}
          swatch={
            <div
              className="w-6 h-6 rounded-sm"
              style={{
                background: o.swatch,
                border: "1px solid rgba(255,208,0,0.18)",
              }}
            />
          }
        />
      ))}

      {allowCustom ? (
        <CustomChip
          selected={isCustom}
          swatchHex={isCustom ? (value as string) : pickerStart}
          pickerValue={pickerStart}
          onPick={(hex) => onChange(hex)}
        />
      ) : null}
    </div>
  );
}

function Chip({
  selected,
  label,
  onClick,
  swatch,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
  swatch: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded transition border
        ${selected
          ? "bg-[rgba(255,208,0,0.12)] border-[#ffd000]"
          : "bg-transparent border-[rgba(255,208,0,0.1)] hover:border-[rgba(255,208,0,0.3)]"}`}
    >
      {swatch}
      <span
        className={`text-[8px] uppercase tracking-[0.06em] leading-none ${
          selected ? "text-[#ffd000] font-bold" : "text-[rgba(255,208,0,0.45)]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * Custom chip — its swatch *is* a native <input type="color">, so clicking
 * anywhere on the chip opens the system color picker. Selected state shows
 * the current hex under the swatch.
 */
function CustomChip({
  selected,
  swatchHex,
  pickerValue,
  onPick,
}: {
  selected: boolean;
  swatchHex: string;
  pickerValue: string;
  onPick: (hex: string) => void;
}) {
  return (
    <label
      title="Custom color"
      className={`relative flex flex-col items-center gap-1 px-2 py-1.5 rounded transition border cursor-pointer
        ${selected
          ? "bg-[rgba(255,208,0,0.12)] border-[#ffd000]"
          : "bg-transparent border-[rgba(255,208,0,0.1)] hover:border-[rgba(255,208,0,0.3)]"}`}
    >
      <div
        className="w-6 h-6 rounded-sm relative flex items-center justify-center"
        style={{
          border: "1px solid rgba(255,208,0,0.18)",
          background: "rgba(0,0,0,0.22)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-[22px] h-[22px] shrink-0 pointer-events-none"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d={COG_24_PATH}
            fill={selected ? swatchHex : "rgba(255,208,0,0.12)"}
            stroke={selected ? "none" : "rgba(255,208,0,0.78)"}
            strokeWidth={selected ? 0 : 0.4}
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span
        className={`text-[8px] uppercase tracking-[0.06em] leading-none ${
          selected ? "text-[#ffd000] font-bold" : "text-[rgba(255,208,0,0.45)]"
        }`}
      >
        {selected ? swatchHex.toUpperCase() : "Custom"}
      </span>
      <input
        type="color"
        value={pickerValue}
        onChange={(e) => onPick(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </label>
  );
}

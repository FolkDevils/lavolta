"use client";

import {
  applyFrontLayoutDefaults,
  CONTACT_TEL_EMAIL_GAP_RANGE,
  defaultFrontForPerson,
  NAME_TITLE_GAP_RANGE,
  TEXT_OFFSET_RANGE,
} from "@/lib/constants";
import type { FrontState } from "@/lib/types";
import { FDRange, SectionLabel } from "./Primitives";
import { formatSigned } from "./LogoPicker";

type Props = {
  front: FrontState;
  personId: number;
  onChange: (patch: Partial<FrontState>) => void;
};

/** Layouts where name → title uses a vertical stack with an explicit gap. */
const STACKED_LAYOUTS = new Set<FrontState["layout"]>([
  "stack",
  "stack_logo_left",
  "stack_logo_right",
  "centered",
  "bold",
]);

export function PositioningPanel({ front, personId, onChange }: Props) {
  // Layout-aware + person-aware baseline so "Reset all positions" restores the
  // current layout's effective defaults (global preset + any PERSON override).
  const fb = applyFrontLayoutDefaults(defaultFrontForPerson(personId), front.layout, personId);
  const usesNameTitleGap = STACKED_LAYOUTS.has(front.layout);

  const dirty =
    front.textOffsetX !== fb.textOffsetX ||
    front.nameTitleBlockOffsetY !== fb.nameTitleBlockOffsetY ||
    front.contactOffsetY !== fb.contactOffsetY ||
    front.contactTelEmailGap !== fb.contactTelEmailGap ||
    (usesNameTitleGap && front.nameTitleGap !== fb.nameTitleGap);

  const reset = () =>
    onChange({
      textOffsetX: fb.textOffsetX,
      nameTitleBlockOffsetY: fb.nameTitleBlockOffsetY,
      nameTitleGap: fb.nameTitleGap,
      contactOffsetY: fb.contactOffsetY,
      contactTelEmailGap: fb.contactTelEmailGap,
    });

  return (
    <div>
      <SectionLabel>
        Text position{dirty ? <span className="text-[#ffd000]"> · edited</span> : null}
      </SectionLabel>

      <div className="mt-2 flex flex-col gap-3">
        <FDRange
          label="Column · X"
          min={-TEXT_OFFSET_RANGE.x}
          max={TEXT_OFFSET_RANGE.x}
          step={TEXT_OFFSET_RANGE.step}
          value={front.textOffsetX}
          onChange={(v) => onChange({ textOffsetX: v })}
          formatLabel={formatSigned}
        />

        <div className="h-px bg-[rgba(255,208,0,0.08)]" />

        <FDRange
          label="Name + title · Y"
          min={-TEXT_OFFSET_RANGE.y}
          max={TEXT_OFFSET_RANGE.y}
          step={TEXT_OFFSET_RANGE.step}
          value={front.nameTitleBlockOffsetY}
          onChange={(v) => onChange({ nameTitleBlockOffsetY: v })}
          formatLabel={formatSigned}
        />
        <FDRange
          label="Name / title gap"
          min={NAME_TITLE_GAP_RANGE.min}
          max={NAME_TITLE_GAP_RANGE.max}
          step={NAME_TITLE_GAP_RANGE.step}
          value={front.nameTitleGap}
          onChange={(v) => onChange({ nameTitleGap: v })}
          disabled={!usesNameTitleGap}
        />
        {!usesNameTitleGap && (
          <p className="text-[8px] text-[rgba(255,208,0,0.35)] leading-snug -mt-1">
            Gap applies to Stack, Centered, and Bold layouts only.
          </p>
        )}

        <div className="h-px bg-[rgba(255,208,0,0.08)]" />

        <FDRange
          label="Phone + Email · Y"
          min={-TEXT_OFFSET_RANGE.y}
          max={TEXT_OFFSET_RANGE.y}
          step={TEXT_OFFSET_RANGE.step}
          value={front.contactOffsetY}
          onChange={(v) => onChange({ contactOffsetY: v })}
          formatLabel={formatSigned}
        />
        <FDRange
          label="TEL / Email row gap"
          min={CONTACT_TEL_EMAIL_GAP_RANGE.min}
          max={CONTACT_TEL_EMAIL_GAP_RANGE.max}
          step={CONTACT_TEL_EMAIL_GAP_RANGE.step}
          value={front.contactTelEmailGap}
          onChange={(v) => onChange({ contactTelEmailGap: v })}
        />

        {dirty && (
          <button
            type="button"
            onClick={reset}
            className="self-start text-[9px] uppercase tracking-[0.1em] text-[rgba(255,208,0,0.45)] hover:text-[#ffd000]"
          >
            Reset all positions
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import {
  COLORS,
  defaultFrontForPerson,
  effectiveFontScaleRangeFor,
  FRONT_LAYOUTS,
  defaultNameTitleGap,
  clampNameTitleGap,
  normalizeFrontFontScalesForLayout,
  frontFontNamePx,
  frontFontTitlePx,
  frontFontContactLabelPx,
  frontFontContactValuePx,
} from "@/lib/constants";
import { resolveSolidHex } from "@/lib/color";
import type { FrontState } from "@/lib/types";
import { ColorSelect, type PaletteOption } from "./ColorSelect";
import { ChipRow, FDRange } from "./Primitives";
import { Section } from "../controls/Section";
import { TextColorBlock } from "./TextColorBlock";
import { LogoPicker } from "./LogoPicker";
import { PositioningPanel } from "./PositioningPanel";
import { PatternPanel } from "./PatternPanel";

const BG_OPTIONS: PaletteOption[] = COLORS.map((c) => ({
  id: c.id,
  name: c.name,
  swatch: c.sw,
}));

type Props = {
  front: FrontState;
  personId: number;
  onChange: (patch: Partial<FrontState>) => void;
  onPatch: (fn: (f: FrontState) => FrontState) => void;
};

export function FrontPanel({ front, personId, onChange, onPatch }: Props) {
  const factory = defaultFrontForPerson(personId);

  const fontRanges = {
    name: effectiveFontScaleRangeFor(front.layout, frontFontNamePx),
    title: effectiveFontScaleRangeFor(front.layout, frontFontTitlePx),
    contactLabel: effectiveFontScaleRangeFor(front.layout, frontFontContactLabelPx),
    contactValue: effectiveFontScaleRangeFor(front.layout, frontFontContactValuePx),
  };

  const typeDirty =
    front.fontScaleName !== factory.fontScaleName ||
    front.fontScaleTitle !== factory.fontScaleTitle ||
    front.fontScaleContactLabel !== factory.fontScaleContactLabel ||
    front.fontScaleContactValue !== factory.fontScaleContactValue;

  const colorDirty =
    front.textFill !== factory.textFill ||
    front.subTextFill !== factory.subTextFill ||
    front.phoneFill !== factory.phoneFill ||
    front.emailFill !== factory.emailFill;

  const currentLayout = FRONT_LAYOUTS.find((l) => l.id === front.layout)?.name ?? front.layout;

  return (
    <div className="flex flex-col gap-2">

      {/* ── Layout ────────────────────────────────────────── */}
      <Section id="front-layout" title="Layout" summary={currentLayout} defaultOpen>
        <ChipRow
          options={FRONT_LAYOUTS}
          value={front.layout}
          onChange={(v) =>
            onPatch((f) => {
              const prevDef = defaultNameTitleGap(f.layout);
              const nextDef = defaultNameTitleGap(v);
              const preserveGap = f.nameTitleGap !== prevDef;
              return normalizeFrontFontScalesForLayout({
                ...f,
                layout: v,
                nameTitleGap: preserveGap ? f.nameTitleGap : clampNameTitleGap(nextDef),
              });
            })
          }
        />
      </Section>

      {/* ── Colors ────────────────────────────────────────── */}
      <Section id="front-colors" title="Colors" edited={colorDirty}>
        <div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-[rgba(255,208,0,0.4)] mb-1.5">Background</div>
          <ColorSelect
            value={front.color}
            onChange={(v) => v != null && onChange({ color: v })}
            options={BG_OPTIONS}
            resolvedHex={resolveSolidHex(front.color, "#29001d")}
          />
        </div>
        <TextColorBlock
          bgValue={front.color}
          textFill={front.textFill}
          subTextFill={front.subTextFill}
          onTextFill={(v) => onChange({ textFill: v })}
          onSubTextFill={(v) => onChange({ subTextFill: v })}
          onResetBoth={() => onPatch((f) => ({ ...f, textFill: null, subTextFill: null }))}
          phoneFill={front.phoneFill}
          emailFill={front.emailFill}
          onPhoneFill={(v) => onChange({ phoneFill: v })}
          onEmailFill={(v) => onChange({ emailFill: v })}
          onResetContact={() => onPatch((f) => ({ ...f, phoneFill: null, emailFill: null }))}
        />
      </Section>

      {/* ── Typography ────────────────────────────────────── */}
      <Section id="front-type" title="Typography" edited={typeDirty}>
        <p className="text-[9px] text-[rgba(255,208,0,0.38)] leading-snug">
          Scale multipliers against the layout&apos;s base size.
        </p>
        <FDRange
          label="Name"
          min={fontRanges.name.min}
          max={fontRanges.name.max}
          step={fontRanges.name.step}
          value={front.fontScaleName}
          onChange={(v) => onChange({ fontScaleName: v })}
          formatLabel={(v) => `×${v.toFixed(2)}`}
        />
        <FDRange
          label="Title / role"
          min={fontRanges.title.min}
          max={fontRanges.title.max}
          step={fontRanges.title.step}
          value={front.fontScaleTitle}
          onChange={(v) => onChange({ fontScaleTitle: v })}
          formatLabel={(v) => `×${v.toFixed(2)}`}
        />
        <FDRange
          label="Contact labels"
          min={fontRanges.contactLabel.min}
          max={fontRanges.contactLabel.max}
          step={fontRanges.contactLabel.step}
          value={front.fontScaleContactLabel}
          onChange={(v) => onChange({ fontScaleContactLabel: v })}
          formatLabel={(v) => `×${v.toFixed(2)}`}
        />
        <FDRange
          label="Phone & email"
          min={fontRanges.contactValue.min}
          max={fontRanges.contactValue.max}
          step={fontRanges.contactValue.step}
          value={front.fontScaleContactValue}
          onChange={(v) => onChange({ fontScaleContactValue: v })}
          formatLabel={(v) => `×${v.toFixed(2)}`}
        />
        {typeDirty && (
          <button
            type="button"
            onClick={() =>
              onPatch((f) => ({
                ...f,
                fontScaleName: factory.fontScaleName,
                fontScaleTitle: factory.fontScaleTitle,
                fontScaleContactLabel: factory.fontScaleContactLabel,
                fontScaleContactValue: factory.fontScaleContactValue,
              }))
            }
            className="self-start text-[9px] uppercase tracking-[0.1em] text-[rgba(255,208,0,0.45)] hover:text-[#ffd000]"
          >
            Reset type scales
          </button>
        )}
      </Section>

      {/* ── Logo ──────────────────────────────────────────── */}
      <Section id="front-logo" title="Logo" summary={front.logo === "none" ? "None" : front.logo === "lg_full" ? "Wordmark" : "Icon"}>
        <LogoPicker
          logo={front.logo}
          logoScale={front.logoScale}
          logoOffsetX={front.logoOffsetX}
          logoOffsetY={front.logoOffsetY}
          onLogo={(id) => onChange({ logo: id })}
          onScale={(v) => onChange({ logoScale: v })}
          onOffsetX={(v) => onChange({ logoOffsetX: v })}
          onOffsetY={(v) => onChange({ logoOffsetY: v })}
          onResetPosition={() =>
            onPatch((f) => ({ ...f, logoOffsetX: factory.logoOffsetX, logoOffsetY: factory.logoOffsetY }))
          }
          baselineOffsetX={factory.logoOffsetX}
          baselineOffsetY={factory.logoOffsetY}
        />
      </Section>

      {/* ── Position ──────────────────────────────────────── */}
      <Section id="front-position" title="Text Position">
        <PositioningPanel
          front={front}
          personId={personId}
          onChange={onChange}
        />
      </Section>

      {/* ── Pattern ───────────────────────────────────────── */}
      <Section id="front-pattern" title="Pattern" summary={front.pat.on ? "On" : "Off"}>
        <PatternPanel cfg={front.pat} onChange={(v) => onChange({ pat: v })} />
      </Section>

    </div>
  );
}


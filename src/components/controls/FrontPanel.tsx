"use client";

import {
  applyFrontLayoutDefaults,
  COLORS,
  defaultFrontForPerson,
  effectiveFontScaleRangeFor,
  frontLayoutOrientation,
  frontLayoutsFor,
  GOOGLE_FONT_OPTIONS,
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
import { BackgroundImageSection } from "./BackgroundImageSection";
import { LogoAdjustBlock } from "./LogoAdjustBlock";

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
  // Layout-aware, person-aware factory: reflects what the element-level fields
  // would look like if the user reset this layout for this person (merging any
  // PERSON_FRONT_LAYOUT_OVERRIDES on top of the global layout preset).
  // Chrome (bg, colors, logo id, pattern) stays from the person's seed.
  const factory = applyFrontLayoutDefaults(
    defaultFrontForPerson(personId),
    front.layout,
    personId,
  );

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

  const fontDirty =
    front.fontFamilySerif !== factory.fontFamilySerif ||
    front.fontFamilySans !== factory.fontFamilySans;

  const colorDirty =
    front.textFill !== factory.textFill ||
    front.subTextFill !== factory.subTextFill ||
    front.phoneFill !== factory.phoneFill ||
    front.emailFill !== factory.emailFill;

  const layoutsForOrientation = frontLayoutsFor(frontLayoutOrientation(front.layout));
  const currentLayout =
    layoutsForOrientation.find((l) => l.id === front.layout)?.name ?? front.layout;

  return (
    <div className="flex flex-col gap-2">

      {/* ── Layout ────────────────────────────────────────── */}
      <Section id="front-layout" title="Layout" summary={currentLayout} defaultOpen>
        <ChipRow
          options={layoutsForOrientation}
          value={front.layout}
          onChange={(v) =>
            onPatch((f) =>
              normalizeFrontFontScalesForLayout(applyFrontLayoutDefaults(f, v, personId)),
            )
          }
        />
      </Section>

      {/* ── Colors ────────────────────────────────────────── */}
      <Section id="front-colors" title="Colors" edited={colorDirty}>
        <div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.4)] mb-1.5">Background</div>
          <ColorSelect
            value={front.color}
            onChange={(v) => v != null && onChange({ color: v })}
            options={BG_OPTIONS}
            resolvedHex={resolveSolidHex(front.color, "#6B1E2D")}
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
      <Section id="front-type" title="Typography" edited={typeDirty || fontDirty}>
        <div className="grid gap-2 mb-1">
          <div>
            <div className="text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.4)] mb-1">
              Heading font
            </div>
            <select
              value={front.fontFamilySerif}
              onChange={(e) => onChange({ fontFamilySerif: e.target.value })}
              className="w-full rounded border border-[rgba(246,244,232,0.18)] bg-[#1f1c1a] text-[11px] text-[#F6F4E8] px-2 py-1.5"
            >
              {!GOOGLE_FONT_OPTIONS.some((o) => o.id === front.fontFamilySerif) ? (
                <option value={front.fontFamilySerif}>{front.fontFamilySerif}</option>
              ) : null}
              {GOOGLE_FONT_OPTIONS.map((o) => (
                <option key={`s-${o.id}`} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.4)] mb-1">
              Body / contact font
            </div>
            <select
              value={front.fontFamilySans}
              onChange={(e) => onChange({ fontFamilySans: e.target.value })}
              className="w-full rounded border border-[rgba(246,244,232,0.18)] bg-[#1f1c1a] text-[11px] text-[#F6F4E8] px-2 py-1.5"
            >
              {!GOOGLE_FONT_OPTIONS.some((o) => o.id === front.fontFamilySans) ? (
                <option value={front.fontFamilySans}>{front.fontFamilySans}</option>
              ) : null}
              {GOOGLE_FONT_OPTIONS.map((o) => (
                <option key={`n-${o.id}`} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {fontDirty && (
          <button
            type="button"
            onClick={() =>
              onPatch((f) => ({
                ...f,
                fontFamilySerif: factory.fontFamilySerif,
                fontFamilySans: factory.fontFamilySans,
              }))
            }
            className="self-start text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.45)] hover:text-[#F6F4E8] mb-2"
          >
            Reset fonts
          </button>
        )}
        <p className="text-[9px] text-[rgba(246,244,232,0.38)] leading-snug">
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
            className="self-start text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.45)] hover:text-[#F6F4E8]"
          >
            Reset type scales
          </button>
        )}

        <div className="h-px bg-[rgba(246,244,232,0.08)] my-2" />

        <PositioningPanel
          front={front}
          personId={personId}
          onChange={onChange}
        />
      </Section>

      {/* ── Logo ──────────────────────────────────────────── */}
      <Section id="front-logo" title="Logo" summary={front.logo === "none" ? "None" : "La Volta"}>
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
        {front.logo !== "none" ? (
          <LogoAdjustBlock value={front.logoAdjust} onChange={(patch) => onChange({ logoAdjust: { ...front.logoAdjust, ...patch } })} />
        ) : null}
      </Section>

      {/* ── Background image ─────────────────────────────── */}
      <Section id="front-bg-image" title="Background photo" summary={front.bgImage.enabled ? "On" : "Off"}>
        <BackgroundImageSection
          label="Front"
          cfg={front.bgImage}
          onChange={(patch) => onChange({ bgImage: { ...front.bgImage, ...patch } })}
        />
      </Section>

      {/* ── Pattern ───────────────────────────────────────── */}
      <Section id="front-pattern" title="Pattern" summary={front.pat.on ? "On" : "Off"}>
        <PatternPanel cfg={front.pat} onChange={(v) => onChange({ pat: v })} />
      </Section>

    </div>
  );
}


"use client";

import {
  applyBackLayoutDefaults,
  backLayoutOrientation,
  backLayoutsFor,
  BACK_FONT_DISPLAY_SLIDER_RANGE,
  BACK_FONT_MINIMAL_LINK_SLIDER_RANGE,
  BACK_FONT_QR_CAPTION_SLIDER_RANGE,
  clampFontBackDisplay,
  clampFontMinimalLink,
  clampFontQrCaption,
  COLORS,
  defaultBackForPerson,
  FD_SOLID_PALETTE,
  QR_BODY_OPTIONS,
  QR_COLORS,
  QR_EYE_OPTIONS,
} from "@/lib/constants";
import { resolveCardPalette, resolveSolidHex } from "@/lib/color";
import type { BackState } from "@/lib/types";
import { ColorSelect, type PaletteOption } from "./ColorSelect";
import { ChipRow, FDRange } from "./Primitives";
import { Section } from "../controls/Section";
import { TextColorBlock } from "./TextColorBlock";
import { LogoPicker } from "./LogoPicker";
import { QrLinksManager } from "./QrLinksManager";
import { PatternPanel } from "./PatternPanel";
import { BackgroundImageSection } from "./BackgroundImageSection";
import { LogoAdjustBlock } from "./LogoAdjustBlock";

const BG_OPTIONS: PaletteOption[] = COLORS.map((c) => ({ id: c.id, name: c.name, swatch: c.sw }));
const SOLID_OPTIONS: PaletteOption[] = FD_SOLID_PALETTE.map((c) => ({ id: c.id, name: c.name, swatch: c.hex }));
const QR_OPTIONS: PaletteOption[] = QR_COLORS.map((c) => ({ id: c.id, name: c.name, swatch: c.hex }));

type Props = {
  back: BackState;
  personId: number;
  onChange: (patch: Partial<BackState>) => void;
  onPatch: (fn: (b: BackState) => BackState) => void;
};

export function BackPanel({ back, personId, onChange, onPatch }: Props) {
  // Layout-aware + person-aware factory — see FrontPanel for rationale.
  const factory = applyBackLayoutDefaults(defaultBackForPerson(personId), back.layout, personId);

  const layoutsForOrientation = backLayoutsFor(backLayoutOrientation(back.layout));
  const currentLayout =
    layoutsForOrientation.find((l) => l.id === back.layout)?.name ?? back.layout;

  const typeDirty =
    back.fontQrCaption !== factory.fontQrCaption ||
    back.fontBackDisplay !== factory.fontBackDisplay ||
    back.fontMinimalLink !== factory.fontMinimalLink;

  const colorDirty = back.textFill !== factory.textFill || back.subTextFill !== factory.subTextFill;

  const qrStyleDirty =
    back.qrBody !== factory.qrBody ||
    back.qrEyeFrame !== factory.qrEyeFrame ||
    back.qrEyeBall !== factory.qrEyeBall;

  return (
    <div className="flex flex-col gap-2">

      {/* ── Layout ────────────────────────────────────────── */}
      <Section id="back-layout" title="Layout" summary={currentLayout} defaultOpen>
        <ChipRow
          options={layoutsForOrientation}
          value={back.layout}
          onChange={(v) =>
            onPatch((b) => {
              const next = applyBackLayoutDefaults(b, v, personId);
              if (v === "one_qr" || v === "p_one_qr") {
                next.qrLinkIds = b.qrLinkIds.length ? [b.qrLinkIds[0]] : ["main"];
              }
              return next;
            })
          }
        />
      </Section>

      {/* ── Colors ────────────────────────────────────────── */}
      <Section id="back-colors" title="Colors" edited={colorDirty}>
        <div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.4)] mb-1.5">Background</div>
          <ColorSelect
            value={back.color}
            onChange={(v) => v != null && onChange({ color: v })}
            options={BG_OPTIONS}
            resolvedHex={resolveSolidHex(back.color, "#6B1E2D")}
          />
        </div>
        <TextColorBlock
          bgValue={back.color}
          textFill={back.textFill}
          subTextFill={back.subTextFill}
          onTextFill={(v) => onChange({ textFill: v })}
          onSubTextFill={(v) => onChange({ subTextFill: v })}
          onResetBoth={() => onPatch((b) => ({ ...b, textFill: null, subTextFill: null }))}
        />
      </Section>

      {/* ── Typography ────────────────────────────────────── */}
      <Section id="back-type" title="Typography" edited={typeDirty}>
        <p className="text-[9px] text-[rgba(246,244,232,0.38)] leading-snug">
          SVG units. QR caption shows under codes. Display is the large &ldquo;LA VOLTA&rdquo; headline. Minimal link is beside small QRs.
        </p>
        <FDRange
          label="QR caption"
          min={BACK_FONT_QR_CAPTION_SLIDER_RANGE.min}
          max={BACK_FONT_QR_CAPTION_SLIDER_RANGE.max}
          step={BACK_FONT_QR_CAPTION_SLIDER_RANGE.step}
          value={back.fontQrCaption}
          onChange={(v) => onChange({ fontQrCaption: clampFontQrCaption(v) })}
        />
        <FDRange
          label="Type display"
          min={BACK_FONT_DISPLAY_SLIDER_RANGE.min}
          max={BACK_FONT_DISPLAY_SLIDER_RANGE.max}
          step={BACK_FONT_DISPLAY_SLIDER_RANGE.step}
          value={back.fontBackDisplay}
          onChange={(v) => onChange({ fontBackDisplay: clampFontBackDisplay(v) })}
        />
        <FDRange
          label="Minimal link"
          min={BACK_FONT_MINIMAL_LINK_SLIDER_RANGE.min}
          max={BACK_FONT_MINIMAL_LINK_SLIDER_RANGE.max}
          step={BACK_FONT_MINIMAL_LINK_SLIDER_RANGE.step}
          value={back.fontMinimalLink}
          onChange={(v) => onChange({ fontMinimalLink: clampFontMinimalLink(v) })}
        />
        {typeDirty && (
          <button
            type="button"
            onClick={() =>
              onPatch((b) => ({
                ...b,
                fontQrCaption: factory.fontQrCaption,
                fontBackDisplay: factory.fontBackDisplay,
                fontMinimalLink: factory.fontMinimalLink,
              }))
            }
            className="self-start text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.45)] hover:text-[#F6F4E8]"
          >
            Reset type sizes
          </button>
        )}
      </Section>

      {/* ── Logo ──────────────────────────────────────────── */}
      <Section id="back-logo" title="Logo" summary={back.logo === "none" ? "None" : "La Volta"}>
        <LogoPicker
          logo={back.logo}
          logoScale={back.logoScale}
          logoOffsetX={back.logoOffsetX}
          logoOffsetY={back.logoOffsetY}
          onLogo={(id) => onChange({ logo: id })}
          onScale={(v) => onChange({ logoScale: v })}
          onOffsetX={(v) => onChange({ logoOffsetX: v })}
          onOffsetY={(v) => onChange({ logoOffsetY: v })}
          onResetPosition={() =>
            onPatch((b) => ({ ...b, logoOffsetX: factory.logoOffsetX, logoOffsetY: factory.logoOffsetY }))
          }
          baselineOffsetX={factory.logoOffsetX}
          baselineOffsetY={factory.logoOffsetY}
        />
        {back.logo !== "none" ? (
          <LogoAdjustBlock value={back.logoAdjust} onChange={(patch) => onChange({ logoAdjust: { ...back.logoAdjust, ...patch } })} />
        ) : null}
      </Section>

      <Section id="back-bg-image" title="Background photo" summary={back.bgImage.enabled ? "On" : "Off"}>
        <BackgroundImageSection
          label="Back"
          cfg={back.bgImage}
          onChange={(patch) => onChange({ bgImage: { ...back.bgImage, ...patch } })}
        />
      </Section>

      {/* ── QR Style ──────────────────────────────────────── */}
      <Section id="back-qr-style" title="QR Style" edited={qrStyleDirty}>
        <div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.4)] mb-1.5">Color</div>
          <ColorSelect
            value={back.qrColor}
            onChange={(v) => onChange({ qrColor: v })}
            options={QR_OPTIONS}
            resolvedHex={resolveSolidHex(
              back.qrColor,
              resolveSolidHex(back.textFill, resolveCardPalette(back.color).text),
            )}
            nullable={{ label: "Auto" }}
          />
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.4)] mb-1.5">Body shape</div>
          <ChipRow options={QR_BODY_OPTIONS} value={back.qrBody} onChange={(v) => onChange({ qrBody: v })} />
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.4)] mb-1.5">Eye frame</div>
          <ChipRow options={QR_EYE_OPTIONS} value={back.qrEyeFrame} onChange={(v) => onChange({ qrEyeFrame: v })} />
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.4)] mb-1.5">Eye ball</div>
          <ChipRow options={QR_EYE_OPTIONS} value={back.qrEyeBall} onChange={(v) => onChange({ qrEyeBall: v })} />
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.4)] mb-1.5">Frame background</div>
          <ColorSelect
            value={back.qrFrame}
            onChange={(v) => onChange({ qrFrame: v })}
            options={SOLID_OPTIONS}
            resolvedHex={resolveSolidHex(back.qrFrame, "#ffffff")}
            nullable={{ label: "None" }}
          />
        </div>
      </Section>

      {/* ── QR Links ──────────────────────────────────────── */}
      <Section id="back-qr-links" title="QR Links" summary={`${back.qrLinkIds.length} active`} defaultOpen>
        <QrLinksManager
          links={back.qrLinks}
          selectedIds={back.qrLinkIds}
          singleSelect={back.layout === "one_qr"}
          onChange={(links, selectedIds) =>
            onPatch((b) => ({ ...b, qrLinks: links, qrLinkIds: selectedIds }))
          }
        />
      </Section>

      {/* ── Pattern ───────────────────────────────────────── */}
      <Section id="back-pattern" title="Pattern" summary={back.pat.on ? "On" : "Off"}>
        <PatternPanel cfg={back.pat} onChange={(v) => onChange({ pat: v })} />
      </Section>

    </div>
  );
}

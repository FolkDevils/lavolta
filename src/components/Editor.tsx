"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BACK_LAYOUTS,
  clampLogoScale,
  COLORS,
  DEFAULT_BACK,
  DEFAULT_FRONT,
  DEFAULT_PEOPLE,
  DEFAULT_QR_LINKS,
  FD_SOLID_PALETTE,
  FRONT_LAYOUTS,
  LOGO_SCALE_RANGE,
  LOGOS,
  normalizeColorValue,
  normalizeLogoId,
  normalizeQrBody,
  normalizeQrEye,
  QR_BODY_OPTIONS,
  QR_COLORS,
  QR_EYE_OPTIONS,
  qrStyleToDesignFields,
  STORAGE_KEY,
} from "@/lib/constants";
import { resolveCardPalette, resolveSolidHex } from "@/lib/color";
import { exportPdf, exportPng, exportSvg, EXPORT_SPEC } from "@/lib/export";
import type { BackState, FrontState, LogoId, Person, QrLink } from "@/lib/types";
import { CardBack, CardFront } from "./Card";
import { ColorSelect, type PaletteOption } from "./controls/ColorSelect";
import { ChipRow, Divider, FDRange, SectionLabel } from "./controls/Primitives";
import { PatternPanel } from "./controls/PatternPanel";
import { PeopleList } from "./controls/PeopleList";

/* Palette option lists for the ColorSelect component */
const BG_PALETTE_OPTIONS: PaletteOption[] = COLORS.map((c) => ({
  id: c.id,
  name: c.name,
  swatch: c.sw,
}));

const SOLID_PALETTE_OPTIONS: PaletteOption[] = FD_SOLID_PALETTE.map((c) => ({
  id: c.id,
  name: c.name,
  swatch: c.hex,
}));

const QR_PALETTE_OPTIONS: PaletteOption[] = QR_COLORS.map((c) => ({
  id: c.id,
  name: c.name,
  swatch: c.hex,
}));

type Saved = {
  people: Person[];
  front: FrontState;
  back: BackState;
  selectedId: number | undefined;
};

/* ──────────────────────────────────────────────────────────
 * Main application. Split into three panels, mirroring the
 * original Figma-style tool but all rendering is SVG-native so
 * exports are trivial.
 * ────────────────────────────────────────────────────────── */
export default function Editor() {
  /* ── State ──────────────────────────────────────────────── */
  const [people, setPeople] = useState<Person[]>(DEFAULT_PEOPLE);
  const [front, setFront] = useState<FrontState>(DEFAULT_FRONT);
  const [back, setBack] = useState<BackState>(DEFAULT_BACK);
  const [selectedId, setSelectedId] = useState<number | undefined>(DEFAULT_PEOPLE[0]?.id);
  const [tab, setTab] = useState<"front" | "back">("front");
  const [face, setFace] = useState<"front" | "back">("front");
  const [flipPhase, setFlipPhase] = useState<"idle" | "out" | "in">("idle");
  const [showGuides, setShowGuides] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [exporting, setExporting] = useState<null | "svg" | "png" | "pdf">(null);
  const [exportError, setExportError] = useState<string | null>(null);

  /* ── Persistence ────────────────────────────────────────── */
  // Load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Saved>;
        if (saved.people?.length) setPeople(saved.people);
        if (saved.front) {
          setFront({
            ...DEFAULT_FRONT,
            ...saved.front,
            logo: normalizeLogoId(saved.front.logo),
            logoScale: clampLogoScale(saved.front.logoScale),
            color: normalizeColorValue(saved.front.color, "dark"),
            textFill: saved.front.textFill ?? null,
            subTextFill: saved.front.subTextFill ?? null,
          });
        }
        if (saved.back) {
          const savedLinks = Array.isArray(saved.back.qrLinks) && saved.back.qrLinks.length
            ? saved.back.qrLinks
            : DEFAULT_QR_LINKS.map((l) => ({ ...l }));
          const savedIds = Array.isArray(saved.back.qrLinkIds)
            ? saved.back.qrLinkIds.filter((id) => savedLinks.some((l) => l.id === id))
            : DEFAULT_BACK.qrLinkIds;
          /* Migration: older saves had a single `qrStyle` field; map it to
           * the new Body / Eye Frame / Eye Ball triplet, then let explicit
           * new-style values (if present) override. */
          const legacy = (saved.back as unknown as { qrStyle?: unknown }).qrStyle;
          const legacyDesign = qrStyleToDesignFields(legacy);
          const migratedBackLogo =
            saved.back.logo != null
              ? normalizeLogoId(saved.back.logo)
              : saved.front?.logo != null
                ? normalizeLogoId(saved.front.logo)
                : DEFAULT_BACK.logo;
          setBack({
            ...DEFAULT_BACK,
            ...saved.back,
            logo: migratedBackLogo,
            logoScale: clampLogoScale(saved.back.logoScale),
            color: normalizeColorValue(saved.back.color, "dark"),
            qrColor:
              saved.back.qrColor === null
                ? null
                : normalizeColorValue(saved.back.qrColor, "yellow"),
            qrBody: normalizeQrBody(saved.back.qrBody ?? legacyDesign.qrBody),
            qrEyeFrame: normalizeQrEye(saved.back.qrEyeFrame ?? legacyDesign.qrEyeFrame),
            qrEyeBall: normalizeQrEye(saved.back.qrEyeBall ?? legacyDesign.qrEyeBall),
            qrFrame: saved.back.qrFrame ?? null,
            qrFrameRadius: saved.back.qrFrameRadius ?? DEFAULT_BACK.qrFrameRadius,
            qrLinks: savedLinks,
            qrLinkIds: savedIds.length ? savedIds : savedLinks.slice(0, 2).map((l) => l.id),
            textFill: saved.back.textFill ?? null,
            subTextFill: saved.back.subTextFill ?? null,
          });
        }
        if (saved.selectedId != null) setSelectedId(saved.selectedId);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Save on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      const data: Saved = { people, front, back, selectedId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [hydrated, people, front, back, selectedId]);

  const person = useMemo(
    () => people.find((p) => p.id === selectedId) ?? people[0],
    [people, selectedId],
  );

  /* ── Card flip animation ────────────────────────────────── */
  const doFlip = (to: "front" | "back") => {
    if (to === face && flipPhase === "idle") return;
    setFlipPhase("out");
    setTimeout(() => {
      setFace(to);
      setFlipPhase("in");
      setTimeout(() => setFlipPhase("idle"), 350);
    }, 350);
  };
  const switchTab = (t: "front" | "back") => {
    setTab(t);
    doFlip(t);
  };

  /* ── Refs for export ────────────────────────────────────── */
  const frontSvgRef = useRef<SVGSVGElement>(null);
  const backSvgRef = useRef<SVGSVGElement>(null);

  const nameForFile = (ext: string) =>
    `folkdevils_${(person?.name || "card").toLowerCase().replace(/[^a-z0-9]+/g, "_")}.${ext}`;

  const handleExport = async (kind: "svg" | "png" | "pdf", which: "front" | "back" | "both") => {
    const f = frontSvgRef.current;
    const b = backSvgRef.current;
    if (!f || !b) {
      setExportError("Could not read the card SVG. Refresh the page and try again.");
      return;
    }
    setExportError(null);
    setExporting(kind);
    try {
      if (kind === "svg") {
        if (which === "front" || which === "both") await exportSvg(f, nameForFile("front.svg"));
        if (which === "back" || which === "both") await exportSvg(b, nameForFile("back.svg"));
      } else if (kind === "png") {
        if (which === "front" || which === "both") await exportPng(f, nameForFile("front.png"));
        if (which === "back" || which === "both") await exportPng(b, nameForFile("back.png"));
      } else if (kind === "pdf") {
        await exportPdf(f, b, nameForFile("pdf"));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setExportError(msg);
      console.error("Export failed:", err);
    } finally {
      setExporting(null);
    }
  };

  /* ── Helpers ────────────────────────────────────────────── */
  const upF = <K extends keyof FrontState>(k: K, v: FrontState[K]) =>
    setFront((f) => ({ ...f, [k]: v }));
  const upB = <K extends keyof BackState>(k: K, v: BackState[K]) =>
    setBack((b) => ({ ...b, [k]: v }));

  if (!person) {
    return (
      <div className="h-screen flex items-center justify-center text-[#ffd000]/60">
        Add a person to begin.
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0d0007] text-white overflow-hidden">
      {/* ── Header ───────────────────────────────────────── */}
      {exportError ? (
        <div
          role="alert"
          className="bg-[#440031] border-b border-[#ff0011]/40 px-4 py-2 text-[12px] text-[#ffd000] flex justify-between items-center gap-3 flex-shrink-0"
        >
          <span className="min-w-0">Export failed: {exportError}</span>
          <button
            type="button"
            onClick={() => setExportError(null)}
            className="shrink-0 text-[11px] uppercase tracking-wide text-white/80 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <header className="bg-[#200016] border-b border-[rgba(255,208,0,0.1)] h-12 px-4 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="text-[11px] font-bold text-[#ffd000] uppercase tracking-[0.1em] leading-none">
            Folk Devils
          </div>
          <div className="text-[8px] text-[rgba(255,208,0,0.45)] uppercase tracking-[0.14em] leading-none mt-1">
            Business Card Builder
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuides((v) => !v)}
            title="Toggle safe area & bleed guides"
            className={`text-[10px] uppercase tracking-[0.1em] px-3 py-1.5 rounded border transition
              ${showGuides
                ? "border-[#ffd000] text-[#ffd000]"
                : "border-[rgba(255,208,0,0.2)] text-[rgba(255,208,0,0.6)]"}`}
          >
            {showGuides ? "Guides On" : "Guides Off"}
          </button>

          <ExportMenu onExport={handleExport} exporting={exporting} />
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: people */}
        <aside className="w-[220px] bg-[#130009] border-r border-[rgba(255,208,0,0.08)] p-3 overflow-y-auto flex-shrink-0">
          <SectionLabel>People</SectionLabel>
          <PeopleList
            people={people}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={(p) => {
              const id = Date.now();
              setPeople((v) => [...v, { ...p, id }]);
              setSelectedId(id);
            }}
            onUpdate={(id, patch) =>
              setPeople((v) => v.map((p) => (p.id === id ? { ...p, ...patch } : p)))
            }
            onDelete={(id) =>
              setPeople((v) => {
                const next = v.filter((p) => p.id !== id);
                if (selectedId === id) setSelectedId(next[0]?.id);
                return next;
              })
            }
          />

          <div className="mt-6 pt-4 border-t border-[rgba(255,208,0,0.08)]">
            <SectionLabel>Print Spec</SectionLabel>
            <div className="text-[10px] text-[rgba(255,208,0,0.55)] leading-relaxed space-y-1">
              <div>
                Finished&nbsp;·&nbsp;
                <span className="text-[#ffd000]/90">
                  {EXPORT_SPEC.finishedIn[0]}″ × {EXPORT_SPEC.finishedIn[1]}″
                </span>
              </div>
              <div>
                Bleed&nbsp;·&nbsp;
                <span className="text-[#ffd000]/90">{EXPORT_SPEC.bleedIn}″</span>
              </div>
              <div>
                Export&nbsp;·&nbsp;
                <span className="text-[#ffd000]/90">
                  {EXPORT_SPEC.pxAt300[0]}×{EXPORT_SPEC.pxAt300[1]} @ {EXPORT_SPEC.dpi} DPI
                </span>
              </div>
              <div className="pt-1 text-[rgba(255,208,0,0.35)]">
                MOO-compatible full-bleed PDF
              </div>
            </div>
          </div>
        </aside>

        {/* Center: preview */}
        <section className="flex-1 flex flex-col items-center justify-center gap-5 p-6 bg-[#0d0007]">
          <div
            className={`flip-card shadow-[0_20px_60px_rgba(0,0,0,0.65),0_4px_18px_rgba(0,0,0,0.45)] rounded-xl overflow-hidden ${
              flipPhase === "out" ? "flip-out" : "flip-in"
            }`}
            style={{
              width: "min(720px, 85%)",
              aspectRatio: `${EXPORT_SPEC.vb[0]} / ${EXPORT_SPEC.vb[1]}`,
            }}
          >
            {/* Front SVG — always mounted (hidden for back) so the ref is live for export */}
            <div style={{ display: face === "front" ? "block" : "none" }} className="w-full h-full">
              <CardFront ref={frontSvgRef} fs={front} person={person} guides={showGuides} />
            </div>
            <div style={{ display: face === "back" ? "block" : "none" }} className="w-full h-full">
              <CardBack ref={backSvgRef} bs={back} guides={showGuides} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex border border-[rgba(255,208,0,0.2)] rounded-md overflow-hidden">
              {(["front", "back"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => switchTab(f)}
                  className={`px-7 py-1.5 text-[10px] uppercase tracking-[0.12em] transition
                    ${tab === f
                      ? "bg-[#440031] text-[#ffd000] font-bold"
                      : "bg-transparent text-[rgba(255,208,0,0.45)] hover:text-[rgba(255,208,0,0.8)]"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[9px] uppercase tracking-[0.14em] text-[rgba(255,208,0,0.25)]">
            Standard {EXPORT_SPEC.finishedIn[0]}″ × {EXPORT_SPEC.finishedIn[1]}″&nbsp;·&nbsp;
            {EXPORT_SPEC.bleedIn}″ bleed&nbsp;·&nbsp;
            {EXPORT_SPEC.pxAt300[0]}×{EXPORT_SPEC.pxAt300[1]} @ {EXPORT_SPEC.dpi} DPI
          </div>

          {/* Hidden persistent back SVG node when not visible on preview — still
              mounted for export. (the hidden div above already does this; this
              block is a redundant-safety no-op) */}
        </section>

        {/* Right: controls */}
        <aside className="w-[304px] bg-[#130009] border-l border-[rgba(255,208,0,0.08)] flex-shrink-0 flex flex-col">
          <div className="flex border-b border-[rgba(255,208,0,0.09)]">
            {([
              ["front", "Front Face"],
              ["back", "Back Face"],
            ] as const).map(([id, lbl]) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={`flex-1 py-3 text-[9px] uppercase tracking-[0.12em] border-b-2 transition
                  ${tab === id
                    ? "bg-[#1a000f] text-[#ffd000] border-[#ffd000] font-bold"
                    : "bg-transparent text-[rgba(255,208,0,0.4)] border-transparent hover:text-[rgba(255,208,0,0.75)]"}`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
            {tab === "front" && (
              <>
                <div>
                  <SectionLabel>Background</SectionLabel>
                  <ColorSelect
                    value={front.color}
                    onChange={(v) => v != null && upF("color", v)}
                    options={BG_PALETTE_OPTIONS}
                    resolvedHex={resolveSolidHex(front.color, "#29001d")}
                  />
                </div>

                <Divider />

                <TextColorBlock
                  bgValue={front.color}
                  textFill={front.textFill}
                  subTextFill={front.subTextFill}
                  onTextFill={(v) => upF("textFill", v)}
                  onSubTextFill={(v) => upF("subTextFill", v)}
                  onResetBoth={() =>
                    setFront((f) => ({ ...f, textFill: null, subTextFill: null }))
                  }
                />

                <Divider />

                <LogoPickerBlock
                  logo={front.logo}
                  logoScale={front.logoScale}
                  onLogo={(id) => upF("logo", id)}
                  onScale={(v) => upF("logoScale", v)}
                />

                <Divider />

                <div>
                  <SectionLabel>Layout</SectionLabel>
                  <ChipRow options={FRONT_LAYOUTS} value={front.layout} onChange={(v) => upF("layout", v)} />
                </div>

                <Divider />

                <PatternPanel cfg={front.pat} onChange={(v) => upF("pat", v)} />
              </>
            )}

            {tab === "back" && (
              <>
                <div>
                  <SectionLabel>Background</SectionLabel>
                  <ColorSelect
                    value={back.color}
                    onChange={(v) => v != null && upB("color", v)}
                    options={BG_PALETTE_OPTIONS}
                    resolvedHex={resolveSolidHex(back.color, "#29001d")}
                  />
                </div>

                <Divider />

                <TextColorBlock
                  bgValue={back.color}
                  textFill={back.textFill}
                  subTextFill={back.subTextFill}
                  onTextFill={(v) => upB("textFill", v)}
                  onSubTextFill={(v) => upB("subTextFill", v)}
                  onResetBoth={() =>
                    setBack((b) => ({ ...b, textFill: null, subTextFill: null }))
                  }
                />

                <Divider />

                <div>
                  <SectionLabel>Layout</SectionLabel>
                  <ChipRow options={BACK_LAYOUTS} value={back.layout} onChange={(v) => upB("layout", v)} />
                </div>

                <Divider />

                <LogoPickerBlock
                  logo={back.logo}
                  logoScale={back.logoScale}
                  onLogo={(id) => upB("logo", id)}
                  onScale={(v) => upB("logoScale", v)}
                />

                <Divider />

                <div>
                  <SectionLabel>QR Color</SectionLabel>
                  <ColorSelect
                    value={back.qrColor}
                    onChange={(v) => upB("qrColor", v)}
                    options={QR_PALETTE_OPTIONS}
                    resolvedHex={resolveSolidHex(
                      back.qrColor,
                      resolveSolidHex(back.textFill, resolveCardPalette(back.color).text),
                    )}
                    nullable={{ label: "Auto" }}
                  />
                </div>

                <Divider />

                <div className="flex flex-col gap-3">
                  <div>
                    <SectionLabel>QR Body</SectionLabel>
                    <ChipRow
                      options={QR_BODY_OPTIONS}
                      value={back.qrBody}
                      onChange={(v) => upB("qrBody", v)}
                    />
                  </div>
                  <div>
                    <SectionLabel>QR Eye Frame</SectionLabel>
                    <ChipRow
                      options={QR_EYE_OPTIONS}
                      value={back.qrEyeFrame}
                      onChange={(v) => upB("qrEyeFrame", v)}
                    />
                  </div>
                  <div>
                    <SectionLabel>QR Eye Ball</SectionLabel>
                    <ChipRow
                      options={QR_EYE_OPTIONS}
                      value={back.qrEyeBall}
                      onChange={(v) => upB("qrEyeBall", v)}
                    />
                  </div>
                </div>

                <Divider />

                <div>
                  <SectionLabel>QR Frame</SectionLabel>
                  <ColorSelect
                    value={back.qrFrame}
                    onChange={(v) => upB("qrFrame", v)}
                    options={SOLID_PALETTE_OPTIONS}
                    resolvedHex={resolveSolidHex(back.qrFrame, "#ffffff")}
                    nullable={{ label: "None" }}
                  />
                </div>

                <Divider />

                <QrLinksManager
                  links={back.qrLinks}
                  selectedIds={back.qrLinkIds}
                  onChange={(links, selectedIds) =>
                    setBack((b) => ({ ...b, qrLinks: links, qrLinkIds: selectedIds }))
                  }
                />

                <Divider />

                <PatternPanel cfg={back.pat} onChange={(v) => upB("pat", v)} />
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function LogoPickerBlock({
  logo,
  logoScale,
  onLogo,
  onScale,
}: {
  logo: LogoId;
  logoScale: number;
  onLogo: (id: LogoId) => void;
  onScale: (n: number) => void;
}) {
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
                    style={{
                      height: 20,
                      width: "auto",
                      maxWidth: 60,
                      objectFit: "contain",
                    }}
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
      <div className="mt-2">
        <FDRange
          label="Logo scale"
          min={LOGO_SCALE_RANGE.min}
          max={LOGO_SCALE_RANGE.max}
          step={LOGO_SCALE_RANGE.step}
          value={logoScale}
          onChange={onScale}
          formatLabel={(v) => `×${v.toFixed(2)}`}
        />
      </div>
    </div>
  );
}

/**
 * Two standardized text-color pickers (primary + secondary). Each uses the
 * shared `ColorSelect` with the FD palette, a Custom chip, and a "Default"
 * chip that means "inherit from the background palette's paired text color".
 */
function TextColorBlock({
  bgValue,
  textFill,
  subTextFill,
  onTextFill,
  onSubTextFill,
  onResetBoth,
}: {
  bgValue: string;
  textFill: string | null;
  subTextFill: string | null;
  onTextFill: (v: string | null) => void;
  onSubTextFill: (v: string | null) => void;
  onResetBoth: () => void;
}) {
  const bgPal = resolveCardPalette(bgValue);
  const primaryResolved = resolveSolidHex(textFill, bgPal.text);
  const subResolved = resolveSolidHex(subTextFill, bgPal.text);
  const hasCustom = textFill != null || subTextFill != null;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <SectionLabel>Primary text</SectionLabel>
        <ColorSelect
          value={textFill}
          onChange={onTextFill}
          options={SOLID_PALETTE_OPTIONS}
          resolvedHex={primaryResolved}
          nullable={{ label: "Auto" }}
        />
      </div>
      <div>
        <SectionLabel>Secondary text</SectionLabel>
        <ColorSelect
          value={subTextFill}
          onChange={onSubTextFill}
          options={SOLID_PALETTE_OPTIONS}
          resolvedHex={subResolved}
          nullable={{ label: "Auto" }}
        />
      </div>
      {hasCustom ? (
        <button
          type="button"
          onClick={onResetBoth}
          className="text-[9px] uppercase tracking-[0.1em] text-left text-[rgba(255,208,0,0.4)] hover:text-[#ffd000]"
        >
          Reset both to background palette
        </button>
      ) : null}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * QR Links manager — editable list of `{ label, url }` entries.
 * Click the label/url to edit inline, toggle the checkbox to
 * decide whether the link actually renders on the card.
 * ────────────────────────────────────────────────────────── */
function QrLinksManager({
  links,
  selectedIds,
  onChange,
}: {
  links: QrLink[];
  selectedIds: string[];
  onChange: (links: QrLink[], selectedIds: string[]) => void;
}) {
  const updateLink = (id: string, patch: Partial<QrLink>) => {
    onChange(
      links.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      selectedIds,
    );
  };

  const toggle = (id: string) => {
    const has = selectedIds.includes(id);
    const next = has ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    if (next.length === 0) return; /* always keep at least one selected */
    onChange(links, next);
  };

  const addLink = () => {
    const id = `link_${Date.now().toString(36)}`;
    const next: QrLink = { id, label: "New link", url: "https://" };
    onChange([...links, next], [...selectedIds, id]);
  };

  const deleteLink = (id: string) => {
    if (links.length <= 1) return; /* always keep at least one link */
    const remaining = links.filter((l) => l.id !== id);
    const remainingIds = selectedIds.filter((x) => x !== id);
    onChange(
      remaining,
      remainingIds.length ? remainingIds : [remaining[0].id],
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <SectionLabel mb={0}>QR Links</SectionLabel>
        <button
          type="button"
          onClick={addLink}
          className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#ffd000] hover:text-[#fff720] px-2 py-0.5 rounded border border-[rgba(255,208,0,0.25)] hover:border-[#ffd000]"
        >
          + Add
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {links.map((link) => {
          const sel = selectedIds.includes(link.id);
          return (
            <div
              key={link.id}
              className={`rounded border transition ${
                sel
                  ? "bg-[rgba(255,208,0,0.06)] border-[rgba(255,208,0,0.35)]"
                  : "bg-transparent border-[rgba(255,208,0,0.1)]"
              }`}
            >
              <div className="flex items-center gap-2 px-2 pt-2">
                <button
                  type="button"
                  onClick={() => toggle(link.id)}
                  title={sel ? "Hide this QR" : "Show this QR"}
                  className={`w-3.5 h-3.5 rounded-sm shrink-0 transition ${
                    sel
                      ? "bg-[#ffd000] border border-[#ffd000]"
                      : "bg-transparent border border-[rgba(255,208,0,0.35)] hover:border-[#ffd000]"
                  }`}
                />
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink(link.id, { label: e.target.value })}
                  placeholder="Label"
                  className="flex-1 min-w-0 bg-transparent text-[11px] font-bold text-[#ffd000] placeholder:text-[rgba(255,208,0,0.25)] outline-none focus:text-[#fff720]"
                />
                {links.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => deleteLink(link.id)}
                    title="Delete link"
                    className="shrink-0 text-[10px] text-[rgba(255,208,0,0.35)] hover:text-[#ff0011] px-1"
                  >
                    ×
                  </button>
                ) : null}
              </div>
              <div className="px-2 pb-2 pt-0.5">
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(link.id, { url: e.target.value })}
                  placeholder="https://…"
                  spellCheck={false}
                  className="w-full bg-transparent text-[10px] text-[rgba(255,208,0,0.55)] placeholder:text-[rgba(255,208,0,0.2)] outline-none focus:text-[rgba(255,208,0,0.9)]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * Export menu — little dropdown that fires SVG/PNG/PDF jobs.
 * ────────────────────────────────────────────────────────── */
function ExportMenu({
  onExport,
  exporting,
}: {
  onExport: (kind: "svg" | "png" | "pdf", which: "front" | "back" | "both") => Promise<void>;
  exporting: null | "svg" | "png" | "pdf";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  /* Outside-close: defer attaching so the same click that opens the menu
   * does not immediately close it. Use capture on document for reliability. */
  useEffect(() => {
    if (!open) return;
    let remove: (() => void) | undefined;
    const tid = window.setTimeout(() => {
      const onDoc = (e: PointerEvent) => {
        const root = rootRef.current;
        if (root && !root.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener("pointerdown", onDoc, true);
      remove = () => document.removeEventListener("pointerdown", onDoc, true);
    }, 0);
    return () => {
      window.clearTimeout(tid);
      remove?.();
    };
  }, [open]);

  const runExport = (kind: "svg" | "png" | "pdf", which: "front" | "back" | "both") => {
    setOpen(false);
    void onExport(kind, which);
  };

  return (
    <div ref={rootRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!!exporting}
        className="bg-[#ffd000] text-[#440031] text-[11px] font-bold uppercase tracking-[0.1em] px-4 py-1.5 rounded-sm hover:bg-[#fff720] transition disabled:opacity-60"
      >
        {exporting ? `Exporting ${exporting.toUpperCase()}…` : "Download ▾"}
      </button>
      {open && !exporting && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-[100] w-[230px] bg-[#200016] border border-[rgba(255,208,0,0.2)] rounded-md shadow-xl overflow-hidden"
        >
          <Group title="Print-ready (with bleed)">
            <MenuItem label="PDF — front + back" onClick={() => runExport("pdf", "both")} hint="For MOO upload" />
            <MenuItem label="PNG — front (300 DPI)" onClick={() => runExport("png", "front")} />
            <MenuItem label="PNG — back (300 DPI)" onClick={() => runExport("png", "back")} />
          </Group>
          <Group title="Vector">
            <MenuItem label="SVG — front" onClick={() => runExport("svg", "front")} hint="Editable vector" />
            <MenuItem label="SVG — back" onClick={() => runExport("svg", "back")} />
          </Group>
        </div>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[rgba(255,208,0,0.08)] last:border-b-0">
      <div className="px-3 pt-2.5 pb-1 text-[8px] uppercase tracking-[0.14em] text-[rgba(255,208,0,0.4)]">
        {title}
      </div>
      <div className="pb-1">{children}</div>
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  hint,
}: {
  label: string;
  onClick: () => void;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-[11px] text-[rgba(255,208,0,0.85)] hover:bg-[rgba(255,208,0,0.08)] hover:text-[#ffd000] flex justify-between items-center gap-2"
    >
      <span>{label}</span>
      {hint ? <span className="text-[8px] uppercase tracking-[0.1em] text-[rgba(255,208,0,0.4)]">{hint}</span> : null}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { buildGoogleFontsStylesheetHref } from "@/lib/cardFonts";
import { EXPORT_SPEC } from "@/lib/export";
import { useEditorState } from "@/hooks/useEditorState";
import { CardBack, CardFront } from "./card";
import { CardFontProvider } from "./card/CardFontContext";
import { ExportMenu } from "./controls/ExportMenu";
import { PersonSettingsTransfer } from "./controls/PersonSettingsTransfer";
import { FrontPanel } from "./controls/FrontPanel";
import { BackPanel } from "./controls/BackPanel";
import { PeopleList } from "./controls/PeopleList";
import { SectionLabel } from "./controls/Primitives";

export default function Editor() {
  const {
    people, front, back, person,
    orientation, cardDims,
    selectedId, selectedPersonId,
    hydrated,
    exporting, exportError, setExportError,
    peopleListKey,
    frontSvgRef, backSvgRef,
    setSelectedId,
    updateFront, patchSelectedFront,
    updateBack, patchSelectedBack,
    setOrientation,
    addPerson, updatePerson, deletePerson,
    handleExport, clearSavedData,
    exportSelectedPersonSettings,
    importPersonSettingsFromJson,
  } = useEditorState();

  /* ── UI-only state ──────────────────────────────────────── */
  const [tab, setTab] = useState<"front" | "back">("front");
  const [face, setFace] = useState<"front" | "back">("front");
  const [flipPhase, setFlipPhase] = useState<"idle" | "out" | "in">("idle");
  const [showGuides, setShowGuides] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);

  useEffect(() => {
    const id = "lavolta-card-google-fonts";
    document.getElementById(id)?.remove();
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = buildGoogleFontsStylesheetHref(front.fontFamilySerif, front.fontFamilySans);
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [front.fontFamilySerif, front.fontFamilySans]);

  /* ── Card flip ──────────────────────────────────────────── */
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

  if (!person) {
    return (
      <div className="h-dvh flex items-center justify-center text-[#F6F4E8]/55">
        Add a person to begin.
      </div>
    );
  }

  return (
    <div className="h-dvh min-h-0 flex flex-col bg-[#1f1c1a] text-[#F6F4E8] overflow-x-hidden overflow-y-hidden lg:overflow-hidden">

      {/* ── Error banner ──────────────────────────────────── */}
      {exportError && (
        <div
          role="alert"
          className="bg-[#6B1E2D] border-b border-[rgba(0,0,0,0.2)] px-4 py-2 text-[12px] text-[#F6F4E8] flex justify-between items-center gap-3 flex-shrink-0 z-50"
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
      )}

      {/* ── Header ────────────────────────────────────────── */}
      <header className="bg-[#2c2826] border-b border-[rgba(246,244,232,0.1)] h-12 px-3 flex items-center justify-between gap-3 flex-shrink-0 z-40">
        <div className="flex items-center gap-2.5">
          {/* Mobile hamburger — opens People drawer */}
          <button
            type="button"
            onClick={() => setPeopleOpen((v) => !v)}
            aria-label="Toggle people panel"
            className="lg:hidden flex flex-col gap-[4px] p-1.5 rounded hover:bg-[rgba(246,244,232,0.08)] transition"
          >
            <span className="block w-4 h-[2px] bg-[rgba(246,244,232,0.7)] rounded" />
            <span className="block w-4 h-[2px] bg-[rgba(246,244,232,0.7)] rounded" />
            <span className="block w-4 h-[2px] bg-[rgba(246,244,232,0.7)] rounded" />
          </button>
          <div>
            <div className="text-[11px] font-bold text-[#F6F4E8] uppercase tracking-[0.1em] leading-none">
              La Volta
            </div>
            <div className="text-[8px] text-[rgba(246,244,232,0.45)] uppercase tracking-[0.14em] leading-none mt-[3px]">
              Business Card Builder
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuides((v) => !v)}
            title="Toggle safe area & bleed guides"
            className={`hidden sm:block text-[10px] uppercase tracking-[0.1em] px-3 py-1.5 rounded border transition
              ${showGuides
                ? "border-[#F6F4E8] text-[#F6F4E8]"
                : "border-[rgba(246,244,232,0.2)] text-[rgba(246,244,232,0.55)]"}`}
          >
            {showGuides ? "Guides On" : "Guides Off"}
          </button>
          <ExportMenu onExport={handleExport} exporting={exporting} />
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto overflow-x-hidden lg:overflow-hidden relative">

        {/* Mobile backdrop for People drawer */}
        {peopleOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setPeopleOpen(false)}
          />
        )}

        {/* ── People rail ───────────────────────────────── */}
        {/* lg+: static left aside · <lg: slide-in drawer */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 pt-16
            lg:relative lg:inset-auto lg:z-auto lg:pt-0
            w-[260px] bg-[#2c2826] border-r border-[rgba(246,244,232,0.08)]
            p-3 flex-shrink-0 flex flex-col gap-4 overflow-y-auto
            transition-transform duration-[250ms]
            lg:translate-x-0
            ${peopleOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div>
            <SectionLabel>People</SectionLabel>
            <PeopleList
              key={peopleListKey}
              people={people}
              selectedId={selectedId}
              onSelect={(id) => { setSelectedId(id); setPeopleOpen(false); }}
              onAdd={addPerson}
              onUpdate={updatePerson}
              onDelete={deletePerson}
            />
          </div>

          <div className="pt-3 border-t border-[rgba(246,244,232,0.08)]">
            <PersonSettingsTransfer
              personName={person.name}
              onDownload={exportSelectedPersonSettings}
              onImportJson={importPersonSettingsFromJson}
            />
          </div>

          <div className="pt-3 border-t border-[rgba(246,244,232,0.08)]">
            <SectionLabel>Print Spec</SectionLabel>
            <div className="text-[10px] text-[rgba(246,244,232,0.55)] leading-relaxed space-y-1">
              <div>
                Orientation&nbsp;·&nbsp;
                <span className="text-[#F6F4E8]/90 capitalize">{orientation}</span>
              </div>
              <div>
                Finished&nbsp;·&nbsp;
                <span className="text-[#F6F4E8]/90">{cardDims.finishedWIn}″ × {cardDims.finishedHIn}″</span>
              </div>
              <div>
                Bleed&nbsp;·&nbsp;
                <span className="text-[#F6F4E8]/90">{EXPORT_SPEC.bleedIn}″</span>
              </div>
              <div>
                Export&nbsp;·&nbsp;
                <span className="text-[#F6F4E8]/90">{cardDims.pxW}×{cardDims.pxH} @ {EXPORT_SPEC.dpi} DPI</span>
              </div>
              <div className="text-[rgba(246,244,232,0.35)]">MOO-compatible full-bleed PDF</div>
            </div>
          </div>

          <div className="pt-3 border-t border-[rgba(246,244,232,0.08)]">
            <SectionLabel>Saved Data</SectionLabel>
            <p className="text-[9px] text-[rgba(246,244,232,0.4)] leading-snug mb-2">
              Remove everything stored in this browser and restore factory defaults.
            </p>
            <button
              type="button"
              onClick={clearSavedData}
              className="w-full py-2 px-3 rounded-md border border-[rgba(246,244,232,0.25)] text-[10px] font-bold uppercase tracking-[0.1em] text-[#F6F4E8] hover:bg-[rgba(246,244,232,0.08)] hover:border-[rgba(246,244,232,0.45)] transition"
            >
              Clear saved data
            </button>
          </div>
        </aside>

        {/* ── Card preview ──────────────────────────────── */}
        {/* mobile: shrink-0 so the aspect-ratio card drives its own height;
            lg+: flex-1 so the card fills the space between the two rails */}
        <section className="shrink-0 lg:flex-1 flex flex-col items-center justify-center gap-3 p-3 sm:p-4 lg:p-6 bg-[#1f1c1a] min-w-0 lg:overflow-hidden">
          <div
            className={`order-2 lg:order-1 flip-card shadow-[0_20px_60px_rgba(0,0,0,0.65),0_4px_18px_rgba(0,0,0,0.45)] rounded-xl overflow-hidden ${
              flipPhase === "out" ? "flip-out" : "flip-in"
            }`}
            style={
              orientation === "portrait"
                ? {
                    /* Short viewports: leave room for header + toggles (mobile orders toggles above). */
                    height: "min(min(56dvh, 520px), 760px)",
                    maxWidth: "92vw",
                    aspectRatio: `${cardDims.vbW} / ${cardDims.vbH}`,
                  }
                : {
                    width: "min(92vw, 820px)",
                    maxHeight: "min(82vh, 760px)",
                    aspectRatio: `${cardDims.vbW} / ${cardDims.vbH}`,
                  }
            }
          >
            <CardFontProvider serif={front.fontFamilySerif} sans={front.fontFamilySans}>
              <div style={{ display: face === "front" ? "block" : "none" }} className="w-full h-full">
                <CardFront ref={frontSvgRef} fs={front} person={person} guides={showGuides} />
              </div>
              <div style={{ display: face === "back" ? "block" : "none" }} className="w-full h-full">
                <CardBack ref={backSvgRef} bs={back} guides={showGuides} />
              </div>
            </CardFontProvider>
          </div>

          {/* Face + orientation toggles — order-1 on <lg so they sit above the tall preview */}
          <div className="order-1 lg:order-2 flex flex-nowrap items-center justify-center gap-1.5 sm:gap-3 shrink-0 w-full max-w-full min-w-0 px-0.5">
            <div
              role="group"
              aria-label="Card face"
              className="flex shrink-0 border border-[rgba(246,244,232,0.2)] rounded-md overflow-hidden"
            >
              {(
                [
                  ["front", "Front"],
                  ["back", "Back"],
                ] as const
              ).map(([f, label]) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => switchTab(f)}
                  className={`px-2.5 sm:px-5 lg:px-7 py-2 text-[9px] sm:text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.12em] min-h-[34px] sm:min-h-[36px] whitespace-nowrap transition
                    ${tab === f
                      ? "bg-[#6B1E2D] text-[#F6F4E8] font-bold"
                      : "bg-transparent text-[rgba(246,244,232,0.45)] hover:text-[rgba(246,244,232,0.85)]"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              role="group"
              aria-label="Card orientation"
              className="flex shrink-0 border border-[rgba(246,244,232,0.2)] rounded-md overflow-hidden"
            >
              {(
                [
                  ["landscape", "Wide", "Landscape"],
                  ["portrait", "Tall", "Portrait"],
                ] as const
              ).map(([o, short, long]) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrientation(o)}
                  title={o === "landscape" ? "Landscape · 8.5″ × 5.5″" : "Portrait · 5.5″ × 8.5″"}
                  className={`px-2.5 sm:px-5 lg:px-7 py-2 text-[9px] sm:text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.12em] min-h-[34px] sm:min-h-[36px] whitespace-nowrap transition
                    ${orientation === o
                      ? "bg-[#6B1E2D] text-[#F6F4E8] font-bold"
                      : "bg-transparent text-[rgba(246,244,232,0.45)] hover:text-[rgba(246,244,232,0.85)]"}`}
                >
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{long}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="order-3 text-[9px] uppercase tracking-[0.14em] text-[rgba(246,244,232,0.22)] shrink-0">
            {cardDims.finishedWIn}″ × {cardDims.finishedHIn}″&nbsp;·&nbsp;
            {EXPORT_SPEC.bleedIn}″ bleed&nbsp;·&nbsp;
            {cardDims.pxW}×{cardDims.pxH} @ {EXPORT_SPEC.dpi} DPI
          </div>
        </section>

        {/* ── Design rail ───────────────────────────────── */}
        {/* mobile: flex-1 → expands to fill the scroll area below the card
            lg+: fixed 340px right aside, card section takes remaining space */}
        <aside className="flex-1 min-h-0 lg:flex-none lg:w-[340px] bg-[#2c2826] border-t lg:border-t-0 lg:border-l border-[rgba(246,244,232,0.08)] flex-shrink-0 flex flex-col overflow-hidden">

          {/* Face tabs — sticky at top of rail */}
          <div className="flex border-b border-[rgba(246,244,232,0.09)] flex-shrink-0">
            {([["front", "Front Face"], ["back", "Back Face"]] as const).map(([id, lbl]) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={`flex-1 py-3 text-[9px] uppercase tracking-[0.12em] border-b-2 min-h-[42px] transition
                  ${tab === id
                    ? "bg-[#3d2a2e] text-[#F6F4E8] border-[#F6F4E8] font-bold"
                    : "bg-transparent text-[rgba(246,244,232,0.4)] border-transparent hover:text-[rgba(246,244,232,0.78)]"}`}
              >
                {lbl}
              </button>
            ))}
          </div>

          {/* Scrollable panel content */}
          <div className="flex-1 overflow-y-auto p-3">
            {!hydrated ? (
              <div className="text-[10px] text-[rgba(246,244,232,0.3)] text-center pt-10">Loading…</div>
            ) : tab === "front" ? (
              <FrontPanel
                front={front}
                personId={selectedPersonId}
                onChange={updateFront}
                onPatch={patchSelectedFront}
              />
            ) : (
              <BackPanel
                back={back}
                personId={selectedPersonId}
                onChange={updateBack}
                onPatch={patchSelectedBack}
              />
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}

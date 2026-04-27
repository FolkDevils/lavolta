"use client";

import { useState } from "react";
import { EXPORT_SPEC } from "@/lib/export";
import { useEditorState } from "@/hooks/useEditorState";
import { CardBack, CardFront } from "./card";
import { ExportMenu } from "./controls/ExportMenu";
import { FrontPanel } from "./controls/FrontPanel";
import { BackPanel } from "./controls/BackPanel";
import { PeopleList } from "./controls/PeopleList";
import { SectionLabel } from "./controls/Primitives";

export default function Editor() {
  const {
    people, front, back, person,
    selectedId, selectedPersonId,
    hydrated,
    exporting, exportError, setExportError,
    peopleListKey,
    frontSvgRef, backSvgRef,
    setSelectedId,
    updateFront, patchSelectedFront,
    updateBack, patchSelectedBack,
    addPerson, updatePerson, deletePerson,
    handleExport, clearSavedData,
  } = useEditorState();

  /* ── UI-only state ──────────────────────────────────────── */
  const [tab, setTab] = useState<"front" | "back">("front");
  const [face, setFace] = useState<"front" | "back">("front");
  const [flipPhase, setFlipPhase] = useState<"idle" | "out" | "in">("idle");
  const [showGuides, setShowGuides] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);

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
      <div className="h-dvh flex items-center justify-center text-[#ffd000]/60">
        Add a person to begin.
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-[#0d0007] text-white overflow-hidden">

      {/* ── Error banner ──────────────────────────────────── */}
      {exportError && (
        <div
          role="alert"
          className="bg-[#440031] border-b border-[#ff0011]/40 px-4 py-2 text-[12px] text-[#ffd000] flex justify-between items-center gap-3 flex-shrink-0 z-50"
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
      <header className="bg-[#200016] border-b border-[rgba(255,208,0,0.1)] h-12 px-3 flex items-center justify-between gap-3 flex-shrink-0 z-40">
        <div className="flex items-center gap-2.5">
          {/* Mobile hamburger — opens People drawer */}
          <button
            type="button"
            onClick={() => setPeopleOpen((v) => !v)}
            aria-label="Toggle people panel"
            className="lg:hidden flex flex-col gap-[4px] p-1.5 rounded hover:bg-[rgba(255,208,0,0.08)] transition"
          >
            <span className="block w-4 h-[2px] bg-[rgba(255,208,0,0.7)] rounded" />
            <span className="block w-4 h-[2px] bg-[rgba(255,208,0,0.7)] rounded" />
            <span className="block w-4 h-[2px] bg-[rgba(255,208,0,0.7)] rounded" />
          </button>
          <div>
            <div className="text-[11px] font-bold text-[#ffd000] uppercase tracking-[0.1em] leading-none">
              Folk Devils
            </div>
            <div className="text-[8px] text-[rgba(255,208,0,0.45)] uppercase tracking-[0.14em] leading-none mt-[3px]">
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
                ? "border-[#ffd000] text-[#ffd000]"
                : "border-[rgba(255,208,0,0.2)] text-[rgba(255,208,0,0.6)]"}`}
          >
            {showGuides ? "Guides On" : "Guides Off"}
          </button>
          <ExportMenu onExport={handleExport} exporting={exporting} />
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

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
            w-[260px] bg-[#130009] border-r border-[rgba(255,208,0,0.08)]
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

          <div className="pt-3 border-t border-[rgba(255,208,0,0.08)]">
            <SectionLabel>Print Spec</SectionLabel>
            <div className="text-[10px] text-[rgba(255,208,0,0.55)] leading-relaxed space-y-1">
              <div>
                Finished&nbsp;·&nbsp;
                <span className="text-[#ffd000]/90">{EXPORT_SPEC.finishedIn[0]}″ × {EXPORT_SPEC.finishedIn[1]}″</span>
              </div>
              <div>
                Bleed&nbsp;·&nbsp;
                <span className="text-[#ffd000]/90">{EXPORT_SPEC.bleedIn}″</span>
              </div>
              <div>
                Export&nbsp;·&nbsp;
                <span className="text-[#ffd000]/90">{EXPORT_SPEC.pxAt300[0]}×{EXPORT_SPEC.pxAt300[1]} @ {EXPORT_SPEC.dpi} DPI</span>
              </div>
              <div className="text-[rgba(255,208,0,0.35)]">MOO-compatible full-bleed PDF</div>
            </div>
          </div>

          <div className="pt-3 border-t border-[rgba(255,208,0,0.08)]">
            <SectionLabel>Saved Data</SectionLabel>
            <p className="text-[9px] text-[rgba(255,208,0,0.4)] leading-snug mb-2">
              Remove everything stored in this browser and restore factory defaults.
            </p>
            <button
              type="button"
              onClick={clearSavedData}
              className="w-full py-2 px-3 rounded-md border border-[rgba(255,208,0,0.25)] text-[10px] font-bold uppercase tracking-[0.1em] text-[#ffd000] hover:bg-[rgba(255,208,0,0.08)] hover:border-[rgba(255,208,0,0.45)] transition"
            >
              Clear saved data
            </button>
          </div>
        </aside>

        {/* ── Card preview ──────────────────────────────── */}
        {/* mobile: shrink-0 so the aspect-ratio card drives its own height;
            lg+: flex-1 so the card fills the space between the two rails */}
        <section className="shrink-0 lg:flex-1 flex flex-col items-center justify-center gap-3 p-3 sm:p-4 lg:p-6 bg-[#0d0007] min-w-0 lg:overflow-hidden">
          <div
            className={`flip-card w-full shadow-[0_20px_60px_rgba(0,0,0,0.65),0_4px_18px_rgba(0,0,0,0.45)] rounded-xl overflow-hidden ${
              flipPhase === "out" ? "flip-out" : "flip-in"
            }`}
            style={{
              maxWidth: 680,
              aspectRatio: `${EXPORT_SPEC.vb[0]} / ${EXPORT_SPEC.vb[1]}`,
            }}
          >
            <div style={{ display: face === "front" ? "block" : "none" }} className="w-full h-full">
              <CardFront ref={frontSvgRef} fs={front} person={person} guides={showGuides} />
            </div>
            <div style={{ display: face === "back" ? "block" : "none" }} className="w-full h-full">
              <CardBack ref={backSvgRef} bs={back} guides={showGuides} />
            </div>
          </div>

          {/* Face toggle */}
          <div className="flex border border-[rgba(255,208,0,0.2)] rounded-md overflow-hidden">
            {(["front", "back"] as const).map((f) => (
              <button
                key={f}
                onClick={() => switchTab(f)}
                className={`px-7 py-2 text-[10px] uppercase tracking-[0.12em] min-h-[36px] transition
                  ${tab === f
                    ? "bg-[#440031] text-[#ffd000] font-bold"
                    : "bg-transparent text-[rgba(255,208,0,0.45)] hover:text-[rgba(255,208,0,0.8)]"}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="text-[9px] uppercase tracking-[0.14em] text-[rgba(255,208,0,0.22)]">
            {EXPORT_SPEC.finishedIn[0]}″ × {EXPORT_SPEC.finishedIn[1]}″&nbsp;·&nbsp;
            {EXPORT_SPEC.bleedIn}″ bleed&nbsp;·&nbsp;
            {EXPORT_SPEC.pxAt300[0]}×{EXPORT_SPEC.pxAt300[1]} @ {EXPORT_SPEC.dpi} DPI
          </div>
        </section>

        {/* ── Design rail ───────────────────────────────── */}
        {/* mobile: flex-1 → expands to fill the scroll area below the card
            lg+: fixed 340px right aside, card section takes remaining space */}
        <aside className="flex-1 lg:flex-none lg:w-[340px] bg-[#130009] border-t lg:border-t-0 lg:border-l border-[rgba(255,208,0,0.08)] flex-shrink-0 flex flex-col overflow-hidden">

          {/* Face tabs — sticky at top of rail */}
          <div className="flex border-b border-[rgba(255,208,0,0.09)] flex-shrink-0">
            {([["front", "Front Face"], ["back", "Back Face"]] as const).map(([id, lbl]) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={`flex-1 py-3 text-[9px] uppercase tracking-[0.12em] border-b-2 min-h-[42px] transition
                  ${tab === id
                    ? "bg-[#1a000f] text-[#ffd000] border-[#ffd000] font-bold"
                    : "bg-transparent text-[rgba(255,208,0,0.4)] border-transparent hover:text-[rgba(255,208,0,0.75)]"}`}
              >
                {lbl}
              </button>
            ))}
          </div>

          {/* Scrollable panel content */}
          <div className="flex-1 overflow-y-auto p-3">
            {!hydrated ? (
              <div className="text-[10px] text-[rgba(255,208,0,0.3)] text-center pt-10">Loading…</div>
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

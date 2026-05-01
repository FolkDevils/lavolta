"use client";

import { useEffect, useRef, useState } from "react";

type ExportKind = "svg" | "png" | "pdf";
type ExportWhich = "front" | "back" | "both";

type Props = {
  onExport: (kind: ExportKind, which: ExportWhich) => Promise<void>;
  exporting: null | ExportKind;
};

export function ExportMenu({ onExport, exporting }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  /* Outside-close: defer attaching so the same click that opens the menu
   * does not immediately close it. */
  useEffect(() => {
    if (!open) return;
    let remove: (() => void) | undefined;
    const tid = window.setTimeout(() => {
      const onDoc = (e: PointerEvent) => {
        if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("pointerdown", onDoc, true);
      remove = () => document.removeEventListener("pointerdown", onDoc, true);
    }, 0);
    return () => {
      window.clearTimeout(tid);
      remove?.();
    };
  }, [open]);

  const run = (kind: ExportKind, which: ExportWhich) => {
    setOpen(false);
    void onExport(kind, which);
  };

  return (
    <div ref={rootRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!!exporting}
        className="bg-[#F6F4E8] text-[#6B1E2D] text-[11px] font-bold uppercase tracking-[0.1em] px-4 py-1.5 rounded-sm hover:bg-[#ffffff] transition disabled:opacity-60"
      >
        {exporting ? `Exporting ${exporting.toUpperCase()}…` : "Download ▾"}
      </button>

      {open && !exporting && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-[100] w-[230px] bg-[#200016] border border-[rgba(246,244,232,0.2)] rounded-md shadow-xl overflow-hidden"
        >
          <MenuGroup title="Print-ready (with bleed)">
            <MenuItem label="PDF — front + back" onClick={() => run("pdf", "both")} hint="For MOO upload" />
            <MenuItem label="PNG — front (300 DPI)" onClick={() => run("png", "front")} />
            <MenuItem label="PNG — back (300 DPI)"  onClick={() => run("png", "back")} />
          </MenuGroup>
          <MenuGroup title="Vector">
            <MenuItem label="SVG — front" onClick={() => run("svg", "front")} hint="Editable vector" />
            <MenuItem label="SVG — back"  onClick={() => run("svg", "back")} />
          </MenuGroup>
        </div>
      )}
    </div>
  );
}

function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[rgba(246,244,232,0.08)] last:border-b-0">
      <div className="px-3 pt-2.5 pb-1 text-[8px] uppercase tracking-[0.14em] text-[rgba(246,244,232,0.4)]">
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
      className="w-full text-left px-3 py-2 text-[11px] text-[rgba(246,244,232,0.85)] hover:bg-[rgba(246,244,232,0.08)] hover:text-[#F6F4E8] flex justify-between items-center gap-2"
    >
      <span>{label}</span>
      {hint ? (
        <span className="text-[8px] uppercase tracking-[0.1em] text-[rgba(246,244,232,0.4)]">
          {hint}
        </span>
      ) : null}
    </button>
  );
}

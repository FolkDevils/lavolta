"use client";

import { type ReactNode, useEffect, useState } from "react";

type Props = {
  /** Stable id used to persist open/closed state in localStorage. */
  id: string;
  title: string;
  /** Small right-aligned hint shown in the header that summarizes
   *  the section's current value (e.g. "Stack · Logo right"). */
  summary?: ReactNode;
  /** When true, a small amber dot appears next to the title to signal
   *  that this section has user-customized values. */
  edited?: boolean;
  /** Initial open state (only used before localStorage value is read). */
  defaultOpen?: boolean;
  children: ReactNode;
};

const KEY = (id: string) => `fd_sec:${id}`;

/**
 * Collapsible disclosure used throughout the Design panel.
 *
 * Keeps the right rail visually calm by collapsing sections down to one
 * row that still communicates the current state via the `summary` prop.
 * State is persisted per-`id` across reloads.
 */
export function Section({
  id,
  title,
  summary,
  edited,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY(id));
      if (saved === "1") setOpen(true);
      else if (saved === "0") setOpen(false);
    } catch {
      /* ignore */
    }
    /* Only read on mount / id change. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY(id), open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [id, open]);

  return (
    <section
      className={`rounded-lg border transition-colors ${
        open
          ? "border-[rgba(255,208,0,0.18)] bg-[rgba(255,208,0,0.02)]"
          : "border-[rgba(255,208,0,0.08)] bg-transparent"
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`sec-${id}`}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left rounded-lg hover:bg-[rgba(255,208,0,0.04)] transition"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[rgba(255,208,0,0.9)]">
            {title}
          </span>
          {edited ? (
            <span
              aria-label="Edited"
              title="This section has custom values"
              className="h-1.5 w-1.5 rounded-full bg-[#ffd000] shrink-0"
            />
          ) : null}
        </span>
        <span className="flex items-center gap-2 min-w-0 shrink-0">
          {summary ? (
            <span className="text-[9px] uppercase tracking-[0.08em] text-[rgba(255,208,0,0.45)] truncate max-w-[160px]">
              {summary}
            </span>
          ) : null}
          <svg
            className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
          >
            <path
              d="M2 4.5l4 4 4-4"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[rgba(255,208,0,0.55)]"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div
          id={`sec-${id}`}
          className="px-3 pb-3 pt-1 border-t border-[rgba(255,208,0,0.06)] flex flex-col gap-3"
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}

/** A smaller, less-bolded row label used inside Sections to separate
 *  sub-groups (e.g. "Primary text" vs "Secondary text" under Colors).
 *  Replaces the old `SectionLabel` when used inside a Section. */
export function SubLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,208,0,0.52)]">
      {children}
    </div>
  );
}

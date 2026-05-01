"use client";

import type { QrLink } from "@/lib/types";
import { SectionLabel } from "./Primitives";

type Props = {
  links: QrLink[];
  selectedIds: string[];
  /** When true (One QR layout), only one link can be active at a time. */
  singleSelect?: boolean;
  onChange: (links: QrLink[], selectedIds: string[]) => void;
};

export function QrLinksManager({ links, selectedIds, singleSelect, onChange }: Props) {
  const updateLink = (id: string, patch: Partial<QrLink>) =>
    onChange(
      links.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      selectedIds,
    );

  const toggle = (id: string) => {
    if (singleSelect) {
      if (selectedIds.includes(id) && selectedIds.length === 1) return;
      onChange(links, [id]);
      return;
    }
    const has = selectedIds.includes(id);
    const next = has ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    if (next.length === 0) return;
    onChange(links, next);
  };

  const addLink = () => {
    const id = `link_${Date.now().toString(36)}`;
    const next: QrLink = { id, label: "New link", url: "https://" };
    onChange(
      [...links, next],
      singleSelect ? [id] : [...selectedIds, id],
    );
  };

  const deleteLink = (id: string) => {
    if (links.length <= 1) return;
    const remaining = links.filter((l) => l.id !== id);
    const remainingIds = selectedIds.filter((x) => x !== id);
    onChange(remaining, remainingIds.length ? remainingIds : [remaining[0].id]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <SectionLabel mb={0}>QR Links</SectionLabel>
        <button
          type="button"
          onClick={addLink}
          className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#F6F4E8] hover:text-[#ffffff] px-2 py-0.5 rounded border border-[rgba(246,244,232,0.25)] hover:border-[#F6F4E8]"
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
                  ? "bg-[rgba(246,244,232,0.06)] border-[rgba(246,244,232,0.35)]"
                  : "bg-transparent border-[rgba(246,244,232,0.1)]"
              }`}
            >
              <div className="flex items-center gap-2 px-2 pt-2">
                <button
                  type="button"
                  onClick={() => toggle(link.id)}
                  title={sel ? "Hide this QR" : "Show this QR"}
                  className={`w-4 h-4 rounded-sm shrink-0 transition ${
                    sel
                      ? "bg-[#F6F4E8] border border-[#F6F4E8]"
                      : "bg-transparent border border-[rgba(246,244,232,0.35)] hover:border-[#F6F4E8]"
                  }`}
                />
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink(link.id, { label: e.target.value })}
                  placeholder="Label"
                  className="flex-1 min-w-0 bg-transparent text-[11px] font-bold text-[#F6F4E8] placeholder:text-[rgba(246,244,232,0.25)] outline-none focus:text-[#ffffff]"
                />
                {links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteLink(link.id)}
                    title="Delete link"
                    className="shrink-0 text-[11px] text-[rgba(246,244,232,0.35)] hover:text-[#ff0011] px-1 leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="px-2 pb-2 pt-1">
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(link.id, { url: e.target.value })}
                  placeholder="https://…"
                  spellCheck={false}
                  className="w-full bg-transparent text-[10px] text-[rgba(246,244,232,0.55)] placeholder:text-[rgba(246,244,232,0.2)] outline-none focus:text-[rgba(246,244,232,0.9)]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

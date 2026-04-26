"use client";

import { useState } from "react";
import type { Person } from "@/lib/types";

type Props = {
  people: Person[];
  selectedId: number | undefined;
  onSelect: (id: number) => void;
  onAdd: (p: Omit<Person, "id">) => void;
  onUpdate: (id: number, patch: Partial<Omit<Person, "id">>) => void;
  onDelete: (id: number) => void;
};

const emptyForm = { name: "", title: "", phone: "", email: "" };

export function PeopleList({ people, selectedId, onSelect, onAdd, onUpdate, onDelete }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const submit = () => {
    if (!form.name.trim()) return;
    onAdd(form);
    setForm(emptyForm);
    setAdding(false);
  };

  const startEdit = (p: Person) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, title: p.title, phone: p.phone, email: p.email });
  };

  const saveEdit = () => {
    if (editingId === null) return;
    onUpdate(editingId, editForm);
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-1">
      {people.map((p) => {
        const sel = p.id === selectedId;
        const editing = p.id === editingId;

        if (editing) {
          return (
            <div
              key={p.id}
              className="bg-[#200016] border border-[#440031] rounded-md p-2.5 flex flex-col gap-1.5"
            >
              {(
                [
                  ["name", "Name *"],
                  ["title", "Title"],
                  ["phone", "Phone"],
                  ["email", "Email"],
                ] as const
              ).map(([k, ph]) => (
                <input
                  key={k}
                  placeholder={ph}
                  value={editForm[k]}
                  onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })}
                  className="bg-[#350028] border border-[rgba(255,208,0,0.15)] rounded px-2.5 py-1.5 text-[12px] text-[#ffd000] outline-none w-full"
                />
              ))}
              <div className="flex gap-1.5">
                <button
                  onClick={saveEdit}
                  className="flex-1 bg-[#ffd000] text-[#440031] rounded px-2 py-2 text-[11px] font-bold uppercase"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 bg-transparent text-[rgba(255,208,0,0.5)] border border-[rgba(255,208,0,0.15)] rounded px-2 py-2 text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`rounded-md cursor-pointer px-3 py-2.5 transition flex justify-between items-center border
              ${sel
                ? "bg-[#440031] border-[rgba(255,208,0,0.6)]"
                : "bg-transparent border-[rgba(255,208,0,0.1)] hover:border-[rgba(255,208,0,0.25)]"}`}
          >
            <div className="min-w-0">
              <div className={`text-[13px] font-bold truncate ${sel ? "text-[#ffd000]" : "text-white"}`}>{p.name}</div>
              <div className="text-[8px] uppercase tracking-[0.1em] text-[rgba(255,208,0,0.42)] mt-0.5 truncate">
                {p.title || "—"}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(p);
                }}
                className="text-[rgba(255,255,255,0.4)] hover:text-[#ffd000] text-[11px] px-1"
                title="Edit"
              >
                ✎
              </button>
              {people.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(p.id);
                  }}
                  className="text-[rgba(255,255,255,0.3)] hover:text-[#ff0011] text-[15px] leading-none"
                  title="Delete"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        );
      })}

      {adding ? (
        <div className="bg-[#200016] border border-[#440031] rounded-md p-2.5 flex flex-col gap-1.5 mt-1">
          {(
            [
              ["name", "Name *"],
              ["title", "Title"],
              ["phone", "Phone"],
              ["email", "Email"],
            ] as const
          ).map(([k, ph]) => (
            <input
              key={k}
              placeholder={ph}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="bg-[#350028] border border-[rgba(255,208,0,0.15)] rounded px-2.5 py-1.5 text-[12px] text-[#ffd000] outline-none w-full"
            />
          ))}
          <div className="flex gap-1.5">
            <button
              onClick={submit}
              className="flex-1 bg-[#ffd000] text-[#440031] rounded px-2 py-2 text-[11px] font-bold uppercase"
            >
              Add
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setForm(emptyForm);
              }}
              className="flex-1 bg-transparent text-[rgba(255,208,0,0.5)] border border-[rgba(255,208,0,0.15)] rounded px-2 py-2 text-[11px]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-1 py-2 px-3 bg-transparent border border-dashed border-[rgba(255,208,0,0.2)] rounded-md text-[rgba(255,208,0,0.45)] hover:text-[rgba(255,208,0,0.75)] hover:border-[rgba(255,208,0,0.4)] text-[11px] text-left transition"
        >
          + Add person
        </button>
      )}
    </div>
  );
}

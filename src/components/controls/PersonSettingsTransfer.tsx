"use client";

import { useCallback, useRef, useState } from "react";
import { SectionLabel } from "./Primitives";

type Props = {
  personName: string;
  onDownload: () => void;
  onImportJson: (json: string) => { ok: true } | { ok: false; error: string };
};

export function PersonSettingsTransfer({ personName, onDownload, onImportJson }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  const pickFile = () => {
    setStatus("idle");
    setMessage("");
    inputRef.current?.click();
  };

  const onFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        if (!text.trim()) {
          setStatus("err");
          setMessage("File is empty.");
          return;
        }
        const r = onImportJson(text);
        if (r.ok) {
          setStatus("ok");
          setMessage("Settings applied to this person.");
        } else {
          setStatus("err");
          setMessage(r.error);
        }
      };
      reader.onerror = () => {
        setStatus("err");
        setMessage("Could not read file.");
      };
      reader.readAsText(file, "utf-8");
    },
    [onImportJson],
  );

  return (
    <div>
      <SectionLabel>Person settings file</SectionLabel>
      <p className="text-[9px] text-[rgba(246,244,232,0.4)] leading-snug mb-2 mt-1">
        Download this person&apos;s contact info, front card, and back card as JSON. Import
        replaces the <span className="text-[rgba(246,244,232,0.55)]">selected</span> person only.
      </p>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setMessage("");
            onDownload();
          }}
          className="w-full py-2 px-3 rounded-md border border-[rgba(246,244,232,0.25)] text-[10px] font-bold uppercase tracking-[0.1em] text-[#F6F4E8] hover:bg-[rgba(246,244,232,0.08)] hover:border-[rgba(246,244,232,0.45)] transition"
        >
          Download settings…
        </button>
        <button
          type="button"
          onClick={pickFile}
          className="w-full py-2 px-3 rounded-md border border-[rgba(246,244,232,0.25)] text-[10px] font-bold uppercase tracking-[0.1em] text-[rgba(246,244,232,0.85)] hover:bg-[rgba(246,244,232,0.06)] hover:border-[rgba(246,244,232,0.35)] transition"
        >
          Import settings…
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label={`Import JSON settings for ${personName}`}
        onChange={onFile}
      />
      {status !== "idle" && (
        <p
          className={`mt-2 text-[9px] leading-snug ${
            status === "ok" ? "text-[rgba(246,244,232,0.75)]" : "text-[#ff6b6b]"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

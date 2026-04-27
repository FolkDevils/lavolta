"use client";

import { useRef, useState } from "react";
import { exportPdf, exportPng, exportSvg } from "@/lib/export";
import type { Person } from "@/lib/types";

export function useExport(person: Person | undefined) {
  const [exporting, setExporting] = useState<null | "svg" | "png" | "pdf">(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const frontSvgRef = useRef<SVGSVGElement>(null);
  const backSvgRef = useRef<SVGSVGElement>(null);

  const nameForFile = (ext: string) =>
    `folkdevils_${(person?.name || "card").toLowerCase().replace(/[^a-z0-9]+/g, "_")}.${ext}`;

  const handleExport = async (
    kind: "svg" | "png" | "pdf",
    which: "front" | "back" | "both",
  ) => {
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

  return {
    exporting,
    exportError,
    setExportError,
    frontSvgRef,
    backSvgRef,
    handleExport,
  };
}

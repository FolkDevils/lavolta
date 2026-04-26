"use client";

import { BLEED_IN, DPI, FINISHED_H_IN, FINISHED_W_IN, PX_H, PX_W, VB_H, VB_W } from "./constants";

/* ──────────────────────────────────────────────────────────
 * Export helpers
 *
 * The editor renders each card face as a real SVG DOM node at the
 * print viewBox (600×360, = 3.75"×2.25" including 0.125" bleed).
 * Because the source is vector, every exporter here just consumes
 * that same SVG element:
 *
 *  - exportSvg  → serialize + embed font → download .svg
 *  - exportPng  → rasterize via <canvas> at 300 DPI → download .png
 *  - exportPdf  → embed 300 DPI rasters inside a PDF whose pages
 *                 are exactly 3.75"×2.25" (MOO full-bleed size)
 *
 * MOO's uploader accepts PDF/PNG at the bleed size, CMYK-preferred
 * but sRGB/RGB works too. 300 DPI is plenty for crisp print.
 * ────────────────────────────────────────────────────────── */

/* ── Module-level caches ────────────────────────────────── */
const assetCache = new Map<string, Promise<string | null>>(); // href → data URL | null

/** Timeout wrapper so a stalled fetch can't hang the entire export. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Fetch one URL once, return a data URL. Cached module-wide. */
function fetchAsDataUrl(href: string): Promise<string | null> {
  const cached = assetCache.get(href);
  if (cached) return cached;
  const work = (async () => {
    try {
      const res = await withTimeout(fetch(href), 8000, `fetch ${href}`);
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("[export] asset fetch failed for", href, err);
      return null;
    }
  })();
  assetCache.set(href, work);
  return work;
}

async function getFontDataUrl(): Promise<string | null> {
  return fetchAsDataUrl("/fonts/Rubik-VariableFont_wght.ttf");
}

/** Inline all referenced <image> elements as data URIs. Dedupes hrefs so
 *  a pattern with 30 copies of flower_01.png only fetches that file once. */
async function inlineImages(svg: SVGSVGElement): Promise<SVGSVGElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const imgs = Array.from(clone.querySelectorAll("image"));

  // Group by href
  const byHref = new Map<string, SVGImageElement[]>();
  for (const img of imgs) {
    const href = img.getAttribute("href") || img.getAttribute("xlink:href");
    if (!href || href.startsWith("data:")) continue;
    const list = byHref.get(href) ?? [];
    list.push(img);
    byHref.set(href, list);
  }

  await Promise.all(
    Array.from(byHref.entries()).map(async ([href, nodes]) => {
      const dataUrl = await fetchAsDataUrl(href);
      if (!dataUrl) return;
      for (const img of nodes) {
        img.setAttribute("href", dataUrl);
        img.removeAttribute("xlink:href");
      }
    }),
  );

  return clone;
}

type BuildSvgOpts = {
  /** Use pixel width/height so HTMLImageElement + canvas get a real intrinsic size. */
  forRaster?: boolean;
  /** Skip font embedding (faster; use when export must be resilient). */
  skipFont?: boolean;
};

/** Build a standalone, self-contained SVG string with images inlined. */
async function buildStandaloneSvg(svg: SVGSVGElement, opts: BuildSvgOpts = {}): Promise<string> {
  const clone = await inlineImages(svg);

  clone.querySelectorAll("[data-guide]").forEach((n) => n.remove());

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  if (opts.forRaster) {
    /* Many browsers only decode raster-from-SVG when root size is numeric px. */
    clone.setAttribute("width", String(PX_W));
    clone.setAttribute("height", String(PX_H));
  } else {
    clone.setAttribute("width", `${FINISHED_W_IN + 2 * BLEED_IN}in`);
    clone.setAttribute("height", `${FINISHED_H_IN + 2 * BLEED_IN}in`);
  }

  if (!opts.skipFont) {
    const fontDataUrl = await getFontDataUrl().catch(() => null);
    if (fontDataUrl) {
      const fontCss = `@font-face{font-family:"Rubik";src:url(${fontDataUrl}) format("truetype");font-weight:300 900;font-style:normal;}`;
      const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
      styleEl.setAttribute("type", "text/css");
      styleEl.textContent = fontCss;
      let defs = clone.querySelector("defs");
      if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        clone.insertBefore(defs, clone.firstChild);
      }
      defs.insertBefore(styleEl, defs.firstChild);
    }
  }

  const xml = new XMLSerializer().serializeToString(clone);
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${xml}`;
}

const REVOKE_MS = 120_000;

/** Trigger a download for the given blob. Uses a temporary anchor with `download=`.
 *  Falls back to `window.open` if the anchor click is blocked/ignored. */
function download(blob: Blob, filename: string) {
  console.log("[export] download()", filename, "size=", blob.size, "type=", blob.type);
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.target = "_self";
    a.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none;";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.warn("[export] anchor.click failed, opening in new tab", err);
    window.open(url, "_blank", "noopener");
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_MS);
  }
}

export async function exportSvg(svg: SVGSVGElement, filename: string) {
  console.log("[export] exportSvg start", filename);
  const xml = await buildStandaloneSvg(svg);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  download(blob, filename);
  console.log("[export] exportSvg done");
}

function loadSvgAsImage(xml: string): Promise<HTMLImageElement> {
  const tryLoad = (src: string) =>
    withTimeout(
      new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.decoding = "async";
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("SVG image decode failed"));
        i.src = src;
      }),
      15000,
      "SVG→Image",
    );

  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  return tryLoad(blobUrl)
    .finally(() => URL.revokeObjectURL(blobUrl))
    .catch((err) => {
      console.warn("[export] blob SVG load failed, falling back to data URL", err);
      const encoded = encodeURIComponent(xml);
      return tryLoad(`data:image/svg+xml;charset=utf-8,${encoded}`);
    });
}

/** Rasterize an SVG element to a PNG blob at the given physical DPI. */
export async function rasterizeToPng(
  svg: SVGSVGElement,
  opts: { widthPx?: number; heightPx?: number } = {},
): Promise<Blob> {
  const widthPx = opts.widthPx ?? PX_W;
  const heightPx = opts.heightPx ?? PX_H;

  console.log("[export] rasterizeToPng", widthPx, "x", heightPx);
  const xml = await buildStandaloneSvg(svg, { forRaster: true });
  const img = await loadSvgAsImage(xml);
  await (img.decode?.() ?? Promise.resolve()).catch(() => {});

  if (!img.naturalWidth || !img.naturalHeight) {
    throw new Error("SVG raster decode produced zero-sized image");
  }

  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, widthPx, heightPx);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
}

export async function exportPng(svg: SVGSVGElement, filename: string) {
  console.log("[export] exportPng start", filename);
  const blob = await rasterizeToPng(svg);
  download(blob, filename);
  console.log("[export] exportPng done");
}

/**
 * Build a 2-page PDF at the MOO bleed size (3.75"×2.25"), page 1 =
 * front, page 2 = back. Cards are rasterized at 300 DPI and drawn
 * to fill the whole page (bleed included). MOO accepts this.
 */
export async function exportPdf(
  frontSvg: SVGSVGElement,
  backSvg: SVGSVGElement,
  filename: string,
) {
  console.log("[export] exportPdf start", filename);
  const mod = (await import("jspdf")) as { jsPDF?: unknown; default?: unknown };
  const JsPDF = (mod.jsPDF ?? mod.default) as new (o?: object) => {
    addImage: (...a: unknown[]) => void;
    addPage: (...a: unknown[]) => void;
    save: (filename: string) => void;
    output: (kind: string) => Blob;
    setProperties: (p: object) => void;
  };
  if (typeof JsPDF !== "function") throw new Error("jsPDF module did not export a constructor");

  const [frontPng, backPng] = await Promise.all([
    rasterizeToPng(frontSvg),
    rasterizeToPng(backSvg),
  ]);

  const [frontDataUrl, backDataUrl] = await Promise.all([
    blobToDataUrl(frontPng),
    blobToDataUrl(backPng),
  ]);

  const pdf = new JsPDF({
    orientation: "landscape",
    unit: "in",
    format: [FINISHED_W_IN + 2 * BLEED_IN, FINISHED_H_IN + 2 * BLEED_IN],
    compress: true,
  });

  const pageW = FINISHED_W_IN + 2 * BLEED_IN;
  const pageH = FINISHED_H_IN + 2 * BLEED_IN;

  pdf.addImage(frontDataUrl, "PNG", 0, 0, pageW, pageH, undefined, "FAST");
  pdf.addPage([pageW, pageH], "landscape");
  pdf.addImage(backDataUrl, "PNG", 0, 0, pageW, pageH, undefined, "FAST");

  pdf.setProperties({
    title: filename.replace(/\.pdf$/i, ""),
    subject: `Business Card — ${FINISHED_W_IN}" × ${FINISHED_H_IN}" finished, ${BLEED_IN}" bleed`,
    creator: "Folk Devils Business Card Builder",
    author: "Folk Devils",
  });

  /* Use output('blob') + our own download() so we can reliably fire the
   * save and see errors — pdf.save() has been known to no-op silently. */
  const pdfBlob = pdf.output("blob");
  download(pdfBlob, filename);
  console.log("[export] exportPdf done");
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/** Expose key numbers for the UI so the "what will I get" copy stays in sync */
export const EXPORT_SPEC = {
  finishedIn: [FINISHED_W_IN, FINISHED_H_IN] as const,
  bleedIn: BLEED_IN,
  pxAt300: [PX_W, PX_H] as const,
  dpi: DPI,
  vb: [VB_W, VB_H] as const,
};

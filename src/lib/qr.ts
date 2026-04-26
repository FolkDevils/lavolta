import QRCode from "qrcode";

export type QrMatrix = {
  size: number;
  /** length = size*size. 1 = dark module, 0 = light. */
  data: Uint8Array;
};

/* ──────────────────────────────────────────────────────────
 * Granular QR design, QR-Monkey-style.
 *
 *   - body   : shape of each regular data module in the grid
 *   - frame  : outer ring of the three finder patterns
 *   - ball   : inner filled center of the three finder patterns
 *
 * All three can be mixed and matched freely.
 * ────────────────────────────────────────────────────────── */

export type QrBodyStyle = "square" | "rounded" | "dots";
export type QrEyeFrameStyle = "square" | "rounded" | "circle" | "tear";
export type QrEyeBallStyle = "square" | "rounded" | "circle" | "tear";

export type QrDesign = {
  body: QrBodyStyle;
  frame: QrEyeFrameStyle;
  ball: QrEyeBallStyle;
};

export const DEFAULT_QR_DESIGN: QrDesign = {
  body: "square",
  frame: "square",
  ball: "square",
};

/* Legacy single-style type, mapped to the new design object. */
export type QrStyle = "square" | "rounded" | "dots" | "circle" | "tear";

export function qrStyleToDesign(style: QrStyle): QrDesign {
  switch (style) {
    case "rounded":
      return { body: "rounded", frame: "rounded", ball: "rounded" };
    case "dots":
      return { body: "dots", frame: "square", ball: "square" };
    case "circle":
      return { body: "dots", frame: "circle", ball: "circle" };
    case "tear":
      return { body: "dots", frame: "tear", ball: "tear" };
    case "square":
    default:
      return { body: "square", frame: "square", ball: "square" };
  }
}

/**
 * Build a QR module matrix from a string URL. We render the modules
 * ourselves as SVG <path>s so we can colour them in any brand hue
 * without resorting to CSS filter hacks.
 */
export function buildQrMatrix(
  data: string,
  errorCorrectionLevel: "L" | "M" | "Q" | "H" = "M",
): QrMatrix {
  const qr = QRCode.create(data, { errorCorrectionLevel });
  const size = qr.modules.size;
  const src = qr.modules.data;
  const out = new Uint8Array(size * size);
  for (let i = 0; i < out.length; i++) out[i] = src[i] ? 1 : 0;
  return { size, data: out };
}

/* ── Finder geometry ──────────────────────────────────────── */

function isFinderModule(x: number, y: number, size: number): boolean {
  return (
    (x < 7 && y < 7) ||
    (x >= size - 7 && y < 7) ||
    (x < 7 && y >= size - 7)
  );
}

/**
 * "corner" says which corner of the 7×7 finder box should be sharp
 * when using the tear style — we always pick the corner pointing
 * *outward* from the card center so tears point away from the grid.
 */
type FinderCorner = "tl" | "tr" | "bl";

function finderOrigins(size: number): { ox: number; oy: number; corner: FinderCorner }[] {
  return [
    { ox: 0, oy: 0, corner: "tl" },
    { ox: size - 7, oy: 0, corner: "tr" },
    { ox: 0, oy: size - 7, corner: "bl" },
  ];
}

/* ── Primitive path builders ──────────────────────────────── */

function squarePath(x: number, y: number, w: number, h: number): string {
  return `M${x} ${y}h${w}v${h}h${-w}z`;
}

function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  return (
    `M${x + rr} ${y}` +
    `h${w - 2 * rr}` +
    `a${rr} ${rr} 0 0 1 ${rr} ${rr}` +
    `v${h - 2 * rr}` +
    `a${rr} ${rr} 0 0 1 ${-rr} ${rr}` +
    `h${-(w - 2 * rr)}` +
    `a${rr} ${rr} 0 0 1 ${-rr} ${-rr}` +
    `v${-(h - 2 * rr)}` +
    `a${rr} ${rr} 0 0 1 ${rr} ${-rr}z`
  );
}

function circlePath(cx: number, cy: number, r: number): string {
  return (
    `M${cx - r} ${cy}` +
    `a${r} ${r} 0 1 0 ${2 * r} 0` +
    `a${r} ${r} 0 1 0 ${-2 * r} 0z`
  );
}

/**
 * Rounded rect with exactly one sharp corner — the QR tear-drop finder.
 * `corner` picks which corner stays sharp; the other three are rounded
 * with radius `r`. We always call this with the corner pointing away
 * from the card center so every finder points outward.
 */
function tearPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  corner: FinderCorner,
): string {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  const sharp = {
    tl: corner === "tl",
    tr: corner === "tr",
    br: false,
    bl: corner === "bl",
  };
  let p = sharp.tl ? `M${x} ${y}` : `M${x + rr} ${y}`;
  p += sharp.tr ? `L${x + w} ${y}` : `L${x + w - rr} ${y}a${rr} ${rr} 0 0 1 ${rr} ${rr}`;
  p += sharp.br
    ? `L${x + w} ${y + h}`
    : `L${x + w} ${y + h - rr}a${rr} ${rr} 0 0 1 ${-rr} ${rr}`;
  p += sharp.bl ? `L${x} ${y + h}` : `L${x + rr} ${y + h}a${rr} ${rr} 0 0 1 ${-rr} ${-rr}`;
  p += sharp.tl ? `L${x} ${y}` : `L${x} ${y + rr}a${rr} ${rr} 0 0 1 ${rr} ${-rr}`;
  p += "z";
  return p;
}

/* ── Eye frame & ball shape builders ──────────────────────── */

function eyeFrame(ox: number, oy: number, style: QrEyeFrameStyle, corner: FinderCorner): string {
  /* Emits two sub-paths (outer + inner). Painted with fill-rule:evenodd
   * in the QrModule so the inner shape becomes a hole, leaving a ring. */
  switch (style) {
    case "rounded": {
      return roundedRectPath(ox, oy, 7, 7, 2) + roundedRectPath(ox + 1, oy + 1, 5, 5, 1.4);
    }
    case "circle": {
      const cx = ox + 3.5;
      const cy = oy + 3.5;
      return circlePath(cx, cy, 3.5) + circlePath(cx, cy, 2.5);
    }
    case "tear": {
      return (
        tearPath(ox, oy, 7, 7, 3.5, corner) +
        tearPath(ox + 1, oy + 1, 5, 5, 2.5, corner)
      );
    }
    case "square":
    default:
      return squarePath(ox, oy, 7, 7) + squarePath(ox + 1, oy + 1, 5, 5);
  }
}

function eyeBall(ox: number, oy: number, style: QrEyeBallStyle, corner: FinderCorner): string {
  const bx = ox + 2;
  const by = oy + 2;
  switch (style) {
    case "rounded":
      return roundedRectPath(bx, by, 3, 3, 1);
    case "circle":
      return circlePath(bx + 1.5, by + 1.5, 1.5);
    case "tear":
      return tearPath(bx, by, 3, 3, 1.5, corner);
    case "square":
    default:
      return squarePath(bx, by, 3, 3);
  }
}

/* ── Module shape builder ─────────────────────────────────── */

function drawModule(x: number, y: number, style: QrBodyStyle): string {
  switch (style) {
    case "dots": {
      const cx = x + 0.5;
      const cy = y + 0.5;
      const r = 0.46;
      return circlePath(cx, cy, r);
    }
    case "rounded": {
      const r = 0.35;
      const side = 1 - 2 * r;
      return (
        `M${x + r} ${y}` +
        `h${side}a${r} ${r} 0 0 1 ${r} ${r}` +
        `v${side}a${r} ${r} 0 0 1 ${-r} ${r}` +
        `h${-side}a${r} ${r} 0 0 1 ${-r} ${-r}` +
        `v${-side}a${r} ${r} 0 0 1 ${r} ${-r}z`
      );
    }
    case "square":
    default:
      return `M${x} ${y}h1v1h-1z`;
  }
}

/* ── Public API ───────────────────────────────────────────── */

/**
 * Render the matrix as three SVG path strings so we can paint each
 * layer with the right fill rule:
 *
 *   - modules   → nonzero  (avoids adjacent-square cancellation)
 *   - eyeFrames → evenodd  (outer − inner = ring)
 *   - eyeBalls  → nonzero  (single filled shape)
 */
export function qrMatrixToDesignPaths(
  m: QrMatrix,
  design: QrDesign = DEFAULT_QR_DESIGN,
): { modules: string; eyeFrames: string; eyeBalls: string } {
  const modParts: string[] = [];
  for (let y = 0; y < m.size; y++) {
    for (let x = 0; x < m.size; x++) {
      if (!m.data[y * m.size + x]) continue;
      if (isFinderModule(x, y, m.size)) continue;
      modParts.push(drawModule(x, y, design.body));
    }
  }

  const origins = finderOrigins(m.size);
  const frames = origins.map((f) => eyeFrame(f.ox, f.oy, design.frame, f.corner)).join("");
  const balls = origins.map((f) => eyeBall(f.ox, f.oy, design.ball, f.corner)).join("");

  return { modules: modParts.join(""), eyeFrames: frames, eyeBalls: balls };
}

/* ── Legacy helpers (kept so imports elsewhere don't break) ─ */

export function qrMatrixToStyledPaths(
  m: QrMatrix,
  style: QrStyle = "square",
): { modules: string; finders: string } {
  const { modules, eyeFrames, eyeBalls } = qrMatrixToDesignPaths(m, qrStyleToDesign(style));
  return { modules, finders: eyeFrames + eyeBalls };
}

export function qrMatrixToPath(m: QrMatrix): string {
  const { modules, finders } = qrMatrixToStyledPaths(m, "square");
  return modules + finders;
}

export function qrMatrixToStyledPath(m: QrMatrix, style: QrStyle = "square"): string {
  const { modules, finders } = qrMatrixToStyledPaths(m, style);
  return modules + finders;
}

import type { BackLayout, BackState, FrontLayout } from "./types";

// ─── Front layouts ───────────────────────────────────────────────────────────

export const FRONT_LAYOUTS: { id: FrontLayout; name: string }[] = [
  { id: "stack", name: "Stack" },
  { id: "stack_logo_left", name: "Stack · Logo left (centered)" },
  { id: "stack_logo_right", name: "Stack · Logo right (centered)" },
  { id: "centered", name: "Centered" },
  { id: "bold", name: "Bold Name" },
  { id: "text_left", name: "Text left · Logo right" },
  { id: "logo_left", name: "Logo left · Text right" },
];

const VALID_FRONT_LAYOUT = new Set<FrontLayout>([
  "stack",
  "stack_logo_left",
  "stack_logo_right",
  "centered",
  "bold",
  "text_left",
  "logo_left",
]);

/** Map legacy layout ids; clamp unknown values to `stack`. */
export function normalizeFrontLayout(layout: unknown): FrontLayout {
  if (layout === "editorial") return "text_left";
  if (VALID_FRONT_LAYOUT.has(layout as FrontLayout)) return layout as FrontLayout;
  return "stack";
}

// ─── Back layouts ────────────────────────────────────────────────────────────

export const BACK_LAYOUTS: { id: BackLayout; name: string }[] = [
  { id: "one_qr", name: "One QR" },
  { id: "two_qr", name: "Two QRs" },
  { id: "logo_qr", name: "Logo + QR" },
  { id: "type", name: "Type Led" },
  { id: "minimal", name: "Minimal" },
];

const VALID_BACK_LAYOUT = new Set<BackLayout>(["one_qr", "two_qr", "logo_qr", "type", "minimal"]);

/** Unknown ids fall back to `two_qr` (legacy default). Missing layout uses `whenMissing` (factory default). */
export function normalizeBackLayout(layout: unknown, whenMissing: BackLayout = "one_qr"): BackLayout {
  if (layout === undefined || layout === null) return whenMissing;
  if (VALID_BACK_LAYOUT.has(layout as BackLayout)) return layout as BackLayout;
  return "two_qr";
}

// ─── QR style options ────────────────────────────────────────────────────────

export const QR_BODY_OPTIONS: { id: BackState["qrBody"]; name: string }[] = [
  { id: "square", name: "Square" },
  { id: "rounded", name: "Rounded" },
  { id: "dots", name: "Dots" },
];

export const QR_EYE_OPTIONS: { id: BackState["qrEyeFrame"]; name: string }[] = [
  { id: "square", name: "Square" },
  { id: "rounded", name: "Rounded" },
  { id: "circle", name: "Circle" },
  { id: "tear", name: "Tear" },
];

/** Migrate the old combined qrStyle to the new triplet. */
export function qrStyleToDesignFields(style: unknown): {
  qrBody: BackState["qrBody"];
  qrEyeFrame: BackState["qrEyeFrame"];
  qrEyeBall: BackState["qrEyeBall"];
} {
  switch (style) {
    case "rounded":
      return { qrBody: "rounded", qrEyeFrame: "rounded", qrEyeBall: "rounded" };
    case "dots":
      return { qrBody: "dots", qrEyeFrame: "square", qrEyeBall: "square" };
    case "circle":
      return { qrBody: "dots", qrEyeFrame: "circle", qrEyeBall: "circle" };
    case "tear":
      return { qrBody: "dots", qrEyeFrame: "tear", qrEyeBall: "tear" };
    case "square":
    default:
      return { qrBody: "square", qrEyeFrame: "square", qrEyeBall: "square" };
  }
}

const VALID_QR_BODY = new Set<BackState["qrBody"]>(["square", "rounded", "dots"]);
const VALID_QR_EYE = new Set<BackState["qrEyeFrame"]>([
  "square",
  "rounded",
  "circle",
  "tear",
]);

export function normalizeQrBody(v: unknown): BackState["qrBody"] {
  return VALID_QR_BODY.has(v as BackState["qrBody"])
    ? (v as BackState["qrBody"])
    : "square";
}

export function normalizeQrEye(v: unknown): BackState["qrEyeFrame"] {
  return VALID_QR_EYE.has(v as BackState["qrEyeFrame"])
    ? (v as BackState["qrEyeFrame"])
    : "square";
}

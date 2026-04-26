export type Person = {
  id: number;
  name: string;
  title: string;
  phone: string;
  email: string;
};

/** Background palette ids. Actual value on state is `string` so it can
 *  also be an arbitrary #rrggbb custom color. */
export type ColorId =
  | "dark"
  | "white"
  | "yellow"
  | "black"
  | "pink"
  | "deep"
  | "red";

/** Every color slot is represented as a string:
 *    - a palette option id (e.g. "dark", "yellow")
 *    - OR a #rrggbb custom hex
 */
export type ColorValue = string;

export type LogoId = "lg_full" | "ic_full" | "none";

export type FrontLayout = "stack" | "centered" | "bold" | "editorial";
export type BackLayout = "two_qr" | "logo_qr" | "type" | "minimal";

/** QR color palette ids. Actual field is `string`, can also be a hex. */
export type QrColorId = "yellow" | "white" | "black" | "purple" | "pink" | "red";

export type PatternConfig = {
  on: boolean;
  f1: boolean;
  f2: boolean;
  f3: boolean;
  density: number;
  size: number;
  rot: number;
  opacity: number;
  seed: number;
};

export type QrLink = {
  id: string;
  label: string;
  url: string;
};

export type FrontState = {
  /** Background: palette id OR #rrggbb. */
  color: ColorValue;
  /** Primary text override: palette id, #rrggbb, or null (= use palette's paired text). */
  textFill: ColorValue | null;
  /** Secondary text override, same shape as `textFill`. */
  subTextFill: ColorValue | null;
  logo: LogoId;
  /** Multiplier on layout logo height (wordmark + icon). ~0.5–2.0. */
  logoScale: number;
  layout: FrontLayout;
  pat: PatternConfig;
};

/** Legacy single-knob style, kept for migration from older saved state. */
export type QrStyleId = "square" | "rounded" | "dots" | "circle" | "tear";

/** QR-Monkey-style granular shape controls. Body is the regular module
 *  grid; eye frame is the outer ring of each finder; eye ball is the
 *  solid dot in the middle of each finder. */
export type QrBodyStyleId = "square" | "rounded" | "dots";
export type QrEyeStyleId = "square" | "rounded" | "circle" | "tear";

export type BackState = {
  color: ColorValue;
  textFill: ColorValue | null;
  subTextFill: ColorValue | null;
  /** Logo on back (logo_qr / type layouts). Independent from front. */
  logo: LogoId;
  /** Same semantics as `FrontState.logoScale`. */
  logoScale: number;
  layout: BackLayout;
  /** QR foreground: palette id, #rrggbb, or null for "auto" (= primary text). */
  qrColor: ColorValue | null;
  /** Shape of regular data modules. */
  qrBody: QrBodyStyleId;
  /** Shape of the outer ring of each of the three finder patterns. */
  qrEyeFrame: QrEyeStyleId;
  /** Shape of the solid dot at the center of each finder. */
  qrEyeBall: QrEyeStyleId;
  /** Background frame behind the QR. null = no frame. */
  qrFrame: ColorValue | null;
  /** Corner radius of the frame, 0..0.5 fraction of QR size. */
  qrFrameRadius: number;
  /** User-editable link list (each link renders one QR code). */
  qrLinks: QrLink[];
  /** Which qrLinks[] ids should actually render on the card. */
  qrLinkIds: string[];
  pat: PatternConfig;
};

export type CardFace = "front" | "back";

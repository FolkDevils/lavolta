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
  | "claret"
  | "cream"
  | "burgundy"
  | "black"
  | "white"
  | "gray"
  | "grayLight"
  | "grayLine"
  | "graySoft"
  | "grayDark";

/** Every color slot is represented as a string:
 *    - a palette option id (e.g. "dark", "yellow")
 *    - OR a #rrggbb custom hex
 */
export type ColorValue = string;

export type LogoId = "lg_full" | "ic_full" | "none";

export type FrontLayout =
  | "stack"
  /** Stack column right-aligned, logo vertically centered on the LEFT. */
  | "stack_logo_left"
  /** Stack column left-aligned, logo vertically centered on the RIGHT. */
  | "stack_logo_right"
  | "centered"
  | "bold";
export type BackLayout = "one_qr" | "two_qr" | "logo_qr" | "type" | "minimal";

/** QR color palette ids. Actual field is `string`, can also be a hex. */
export type QrColorId = "claret" | "burgundy" | "cream" | "white" | "black" | "gray";

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

/** Optional full-bleed background photo (front or back), under pattern + ink. */
export type FaceBgImageConfig = {
  enabled: boolean;
  /** Public path under `/public` (e.g. `/brand/BG.png`). */
  src: string;
  /** Pan in viewBox units; 0 keeps the image centered. */
  offsetX: number;
  offsetY: number;
  /** Zoom from card center; 1 = cover the card. */
  scale: number;
  tintEnabled: boolean;
  /** Solid overlay on top of the photo (for text legibility). */
  tintColor: string;
  tintOpacity: number;
};

/** CSS-style filter knobs for raster logos (`<image filter={…} />`). */
export type LogoImageAdjust = {
  hueRotate: number;
  brightness: number;
  saturate: number;
  contrast: number;
};

export type FrontState = {
  /** Background: palette id OR #rrggbb. */
  color: ColorValue;
  /** Primary text override: palette id, #rrggbb, or null (= use palette's paired text). */
  textFill: ColorValue | null;
  /** Secondary text override, same shape as `textFill`. */
  subTextFill: ColorValue | null;
  /** Phone number color override; falls back to primary text when null. */
  phoneFill: ColorValue | null;
  /** Email color override; falls back to primary text when null. */
  emailFill: ColorValue | null;
  logo: LogoId;
  /** Multiplier on layout logo height (wordmark + icon). ~0.5–2.0. */
  logoScale: number;
  /** Logo nudge in viewBox units; clamped to bleed box in render. */
  logoOffsetX: number;
  logoOffsetY: number;
  /** Horizontal nudge applied to every text block (name, title, contact)
   *  so the whole column slides together. */
  textOffsetX: number;
  /** Vertical nudge applied equally to name + title (keeps their relative spacing). */
  nameTitleBlockOffsetY: number;
  /** Vertical distance from name baseline to title (stack, centered, bold). */
  nameTitleGap: number;
  contactOffsetY: number;
  /** Vertical distance (viewBox units) between the TEL row and EMAIL row in stack layouts. */
  contactTelEmailGap: number;
  /** Multipliers on layout-specific base sizes for name / title / contact type. */
  fontScaleName: number;
  fontScaleTitle: number;
  fontScaleContactLabel: number;
  fontScaleContactValue: number;
  layout: FrontLayout;
  pat: PatternConfig;
  /** Optional photo layer between solid fill and pattern/content. */
  bgImage: FaceBgImageConfig;
  /** Logo raster color / tone via CSS filter. */
  logoAdjust: LogoImageAdjust;
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
  /** Logo nudge on the back face (viewBox units). */
  logoOffsetX: number;
  logoOffsetY: number;
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
  /** Absolute SVG font sizes (viewBox units) for back-face typography. */
  fontQrCaption: number;
  fontBackDisplay: number;
  fontMinimalLink: number;
  pat: PatternConfig;
  bgImage: FaceBgImageConfig;
  logoAdjust: LogoImageAdjust;
};

export type CardFace = "front" | "back";

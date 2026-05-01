import type { BackLayout, BackState, FrontLayout, FrontState, PatternConfig, Person, QrLink } from "./types";
import {
  clampLogoOffsetX,
  clampLogoOffsetY,
  clampLogoScale,
  clampTextOffsetX,
  clampTextOffsetY,
  normalizeColorValue,
  normalizeLogoId,
} from "./palette";
import { DEFAULT_BACK_BG_IMAGE, DEFAULT_FACE_BG_IMAGE, normalizeFaceBgImage } from "./faceBg";
import {
  normalizeBackLayout,
  normalizeFrontLayout,
  qrStyleToDesignFields,
  normalizeQrBody,
  normalizeQrEye,
  resolveBackLayoutDefaults,
  resolveFrontLayoutDefaults,
} from "./layouts";
import {
  clampContactTelEmailGap,
  clampFontBackDisplay,
  clampFontMinimalLink,
  clampFontQrCaption,
  clampFontScale,
  clampNameTitleGap,
  defaultNameTitleGap,
  normalizeFrontFontScalesForLayout,
} from "./typography";
import { clampTextOffsetY as _clampY } from "./palette";
import { LOGO_ADJUST_DEFAULTS, normalizeLogoImageAdjust } from "./logoFilter";

// ─── Pattern defaults ────────────────────────────────────────────────────────

/** Decorative flowers — off by default for La Volta cards. */
export const DEFAULT_PATTERN: PatternConfig = {
  on: false,
  f1: false,
  f2: true,
  f3: true,
  density: 80,
  size: 30,
  rot: 80,
  opacity: 20,
  seed: 4242,
};

// ─── Front defaults ──────────────────────────────────────────────────────────

/** Chrome fields that persist across layout switches (background, colors, logo id, pattern). */
type FrontChrome = Pick<
  FrontState,
  | "color"
  | "textFill"
  | "subTextFill"
  | "phoneFill"
  | "emailFill"
  | "logo"
  | "pat"
  | "bgImage"
  | "logoAdjust"
>;

/** Shared background/chrome defaults — same across all layouts and people. */
function defaultFrontChrome(): FrontChrome {
  return {
    color: "cream",
    textFill: "claret",
    subTextFill: "claret",
    phoneFill: "claret",
    emailFill: "claret",
    logo: "lg_full",
    pat: { ...DEFAULT_PATTERN },
    bgImage: { ...DEFAULT_FACE_BG_IMAGE },
    logoAdjust: { ...LOGO_ADJUST_DEFAULTS },
  };
}

/** Build a full FrontState from chrome + a layout's effective element defaults. */
function buildFrontForLayout(
  chrome: FrontChrome,
  layout: FrontLayout,
  personId?: number,
): FrontState {
  const d = resolveFrontLayoutDefaults(layout, personId);
  const state: FrontState = {
    ...chrome,
    layout,
    logoScale: clampLogoScale(d.logoScale),
    logoOffsetX: clampLogoOffsetX(d.logoOffsetX),
    logoOffsetY: clampLogoOffsetY(d.logoOffsetY),
    textOffsetX: clampTextOffsetX(d.textOffsetX),
    nameTitleBlockOffsetY: clampTextOffsetY(d.nameTitleBlockOffsetY),
    nameTitleGap: clampNameTitleGap(d.nameTitleGap),
    contactOffsetY: clampTextOffsetY(d.contactOffsetY),
    contactTelEmailGap: clampContactTelEmailGap(d.contactTelEmailGap),
    fontScaleName: clampFontScale(d.fontScaleName),
    fontScaleTitle: clampFontScale(d.fontScaleTitle),
    fontScaleContactLabel: clampFontScale(d.fontScaleContactLabel),
    fontScaleContactValue: clampFontScale(d.fontScaleContactValue),
  };
  return normalizeFrontFontScalesForLayout(state);
}

function defaultFrontLayoutForPerson(): FrontLayout {
  return "centered";
}

export const DEFAULT_FRONT: FrontState = buildFrontForLayout(defaultFrontChrome(), "centered", 1);

export function defaultFrontForPerson(personId: number): FrontState {
  return buildFrontForLayout(defaultFrontChrome(), defaultFrontLayoutForPerson(), personId);
}

// ─── Back defaults ───────────────────────────────────────────────────────────

export const DEFAULT_QR_LINKS: QrLink[] = [
  { id: "main", label: "lavoltanyc.com", url: "https://lavoltanyc.com/" },
];

/** Chrome fields that persist across back-layout switches. */
type BackChrome = Pick<
  BackState,
  | "color"
  | "textFill"
  | "subTextFill"
  | "logo"
  | "qrColor"
  | "qrBody"
  | "qrEyeFrame"
  | "qrEyeBall"
  | "qrFrame"
  | "qrFrameRadius"
  | "qrLinks"
  | "qrLinkIds"
  | "pat"
  | "bgImage"
  | "logoAdjust"
>;

function defaultBackChrome(): BackChrome {
  return {
    color: "cream",
    textFill: "cream",
    subTextFill: "cream",
    logo: "lg_full",
    qrColor: "#DFDBC3",
    qrBody: "dots",
    qrEyeFrame: "circle",
    qrEyeBall: "circle",
    qrFrame: "claret",
    qrFrameRadius: 0.06,
    qrLinks: DEFAULT_QR_LINKS.map((l) => ({ ...l })),
    qrLinkIds: ["main"],
    pat: { ...DEFAULT_PATTERN },
    bgImage: { ...DEFAULT_BACK_BG_IMAGE },
    logoAdjust: { ...LOGO_ADJUST_DEFAULTS },
  };
}

function buildBackForLayout(
  chrome: BackChrome,
  layout: BackLayout,
  personId?: number,
): BackState {
  const d = resolveBackLayoutDefaults(layout, personId);
  return {
    ...chrome,
    layout,
    logoScale: clampLogoScale(d.logoScale),
    logoOffsetX: clampLogoOffsetX(d.logoOffsetX),
    logoOffsetY: clampLogoOffsetY(d.logoOffsetY),
    fontQrCaption: clampFontQrCaption(d.fontQrCaption),
    fontBackDisplay: clampFontBackDisplay(d.fontBackDisplay),
    fontMinimalLink: clampFontMinimalLink(d.fontMinimalLink),
  };
}

export const DEFAULT_BACK: BackState = buildBackForLayout(defaultBackChrome(), "one_qr", 1);

export function defaultBackForPerson(personId: number): BackState {
  return buildBackForLayout(defaultBackChrome(), "one_qr", personId);
}

// ─── People defaults ─────────────────────────────────────────────────────────

export const DEFAULT_PEOPLE: Person[] = [
  {
    id: 1,
    name: "Suyin Royer",
    title: "CONSIGNMENTS",
    phone: "(646) 322-4537",
    email: "Consignments@lavoltanyc.com",
  },
];

// ─── Migration helpers ───────────────────────────────────────────────────────

export function migrateRawFront(
  raw: Partial<FrontState> & { nameOffsetY?: number; titleOffsetY?: number },
): FrontState {
  const layout = normalizeFrontLayout(raw.layout);
  const baseGap = defaultNameTitleGap(layout);
  const legacyFront = raw as Partial<FrontState> & { nameOffsetY?: number; titleOffsetY?: number };
  let nameTitleGap: number;
  if (typeof raw.nameTitleGap === "number" && Number.isFinite(raw.nameTitleGap)) {
    nameTitleGap = clampNameTitleGap(raw.nameTitleGap);
  } else if (
    typeof legacyFront.nameOffsetY === "number" ||
    typeof legacyFront.titleOffsetY === "number"
  ) {
    nameTitleGap = clampNameTitleGap(
      baseGap +
        (Number(legacyFront.titleOffsetY) || 0) -
        (Number(legacyFront.nameOffsetY) || 0),
    );
  } else {
    nameTitleGap = clampNameTitleGap(baseGap);
  }
  const nameTitleBlockOffsetY = _clampY(
    raw.nameTitleBlockOffsetY ?? legacyFront.nameOffsetY ?? 0,
  );
  const patMerged: PatternConfig = {
    ...DEFAULT_PATTERN,
    ...(raw.pat && typeof raw.pat === "object" ? raw.pat : {}),
  };
  const m: FrontState = {
    ...DEFAULT_FRONT,
    ...raw,
    layout,
    pat: patMerged,
    bgImage: normalizeFaceBgImage(raw.bgImage),
    logoAdjust: normalizeLogoImageAdjust(raw.logoAdjust),
  };
  const merged: FrontState = {
    ...m,
    logo: normalizeLogoId(m.logo),
    logoScale: clampLogoScale(m.logoScale),
    logoOffsetX: clampLogoOffsetX(m.logoOffsetX),
    logoOffsetY: clampLogoOffsetY(m.logoOffsetY),
    textOffsetX: clampTextOffsetX(m.textOffsetX),
    nameTitleBlockOffsetY,
    nameTitleGap,
    contactOffsetY: clampTextOffsetY(m.contactOffsetY),
    contactTelEmailGap: clampContactTelEmailGap(m.contactTelEmailGap),
    fontScaleName: clampFontScale(m.fontScaleName),
    fontScaleTitle: clampFontScale(m.fontScaleTitle),
    fontScaleContactLabel: clampFontScale(m.fontScaleContactLabel),
    fontScaleContactValue: clampFontScale(m.fontScaleContactValue),
    color: normalizeColorValue(m.color, "cream"),
    textFill: m.textFill ?? null,
    subTextFill: m.subTextFill ?? null,
    phoneFill: m.phoneFill ?? null,
    emailFill: m.emailFill ?? null,
  };
  return normalizeFrontFontScalesForLayout(merged);
}

export function buildFrontByPersonIdFromSaved(
  saved: {
    front?: Partial<FrontState> & { nameOffsetY?: number; titleOffsetY?: number };
    frontByPersonId?: Record<string, unknown>;
  } | null,
  people: Person[],
): Record<number, FrontState> {
  const out: Record<number, FrontState> = {};
  const rawMap = saved?.frontByPersonId as Record<string, Partial<FrontState>> | undefined;
  const hasPer = rawMap && typeof rawMap === "object" && Object.keys(rawMap).length > 0;

  for (const p of people) {
    const key = String(p.id);
    const disk = hasPer ? rawMap[key] : undefined;
    if (disk && typeof disk === "object" && Object.keys(disk).length > 0) {
      out[p.id] = migrateRawFront(disk as Partial<FrontState> & { nameOffsetY?: number });
    } else if (saved?.front && !hasPer) {
      const firstId = people[0]?.id;
      out[p.id] = p.id === firstId ? migrateRawFront(saved.front!) : defaultFrontForPerson(p.id);
    } else {
      out[p.id] = defaultFrontForPerson(p.id);
    }
  }
  return out;
}

export function migrateRawBack(
  raw: Partial<BackState> & { qrStyle?: unknown },
  defaults: BackState,
): BackState {
  const base = JSON.parse(JSON.stringify(defaults)) as BackState;
  const savedLinks =
    Array.isArray(raw.qrLinks) && raw.qrLinks.length > 0
      ? raw.qrLinks.map((l) => ({ ...l }))
      : base.qrLinks.map((l) => ({ ...l }));
  const savedIds = Array.isArray(raw.qrLinkIds)
    ? raw.qrLinkIds.filter((id) => savedLinks.some((l) => l.id === id))
    : [...base.qrLinkIds];
  const legacyDesign = qrStyleToDesignFields((raw as { qrStyle?: unknown }).qrStyle);
  const migratedBackLogo = raw.logo != null ? normalizeLogoId(raw.logo) : base.logo;
  const normalizedLayout = normalizeBackLayout(raw.layout, base.layout);
  const baseQrIds = savedIds.length > 0 ? savedIds : savedLinks.slice(0, 2).map((l) => l.id);
  const qrLinkIdsHydrated =
    normalizedLayout === "one_qr" && baseQrIds.length > 1 ? [baseQrIds[0]!] : [...baseQrIds];

  const patMerged: PatternConfig = {
    ...base.pat,
    ...(raw.pat && typeof raw.pat === "object" ? raw.pat : {}),
  };

  return {
    ...base,
    layout: normalizedLayout,
    logo: migratedBackLogo,
    logoScale: clampLogoScale(raw.logoScale ?? base.logoScale),
    logoOffsetX: clampLogoOffsetX(raw.logoOffsetX ?? base.logoOffsetX),
    logoOffsetY: clampLogoOffsetY(raw.logoOffsetY ?? base.logoOffsetY),
    color: normalizeColorValue(raw.color ?? base.color, "cream"),
    qrColor:
      raw.qrColor === null ? null : normalizeColorValue(raw.qrColor ?? base.qrColor, "claret"),
    qrBody: normalizeQrBody(raw.qrBody ?? legacyDesign.qrBody),
    qrEyeFrame: normalizeQrEye(raw.qrEyeFrame ?? legacyDesign.qrEyeFrame),
    qrEyeBall: normalizeQrEye(raw.qrEyeBall ?? legacyDesign.qrEyeBall),
    qrFrame: raw.qrFrame !== undefined ? raw.qrFrame : base.qrFrame,
    qrFrameRadius: raw.qrFrameRadius ?? base.qrFrameRadius,
    qrLinks: savedLinks,
    qrLinkIds: qrLinkIdsHydrated,
    textFill: raw.textFill !== undefined ? raw.textFill : base.textFill,
    subTextFill: raw.subTextFill !== undefined ? raw.subTextFill : base.subTextFill,
    fontQrCaption: clampFontQrCaption(raw.fontQrCaption ?? base.fontQrCaption),
    fontBackDisplay: clampFontBackDisplay(raw.fontBackDisplay ?? base.fontBackDisplay),
    fontMinimalLink: clampFontMinimalLink(raw.fontMinimalLink ?? base.fontMinimalLink),
    pat: patMerged,
    bgImage: normalizeFaceBgImage(raw.bgImage ?? base.bgImage),
    logoAdjust: normalizeLogoImageAdjust(raw.logoAdjust ?? base.logoAdjust),
  };
}

export function buildBackByPersonIdFromSaved(
  saved: {
    front?: Partial<FrontState>;
    back?: Partial<BackState> & { qrStyle?: unknown };
    backByPersonId?: Record<string, unknown>;
  } | null,
  people: Person[],
): Record<number, BackState> {
  const out: Record<number, BackState> = {};
  const rawMap = saved?.backByPersonId as Record<string, Partial<BackState>> | undefined;
  const hasPer = rawMap && typeof rawMap === "object" && Object.keys(rawMap).length > 0;

  for (const p of people) {
    const defaults = defaultBackForPerson(p.id);
    const key = String(p.id);
    const disk = hasPer ? rawMap[key] : undefined;
    if (disk && typeof disk === "object" && Object.keys(disk).length > 0) {
      out[p.id] = migrateRawBack(disk as Partial<BackState> & { qrStyle?: unknown }, defaults);
    } else if (saved?.back && !hasPer) {
      let legacy = saved.back as Partial<BackState> & { qrStyle?: unknown };
      if (
        legacy.logo == null &&
        saved.front &&
        typeof saved.front === "object" &&
        saved.front.logo != null
      ) {
        legacy = { ...legacy, logo: saved.front.logo };
      }
      out[p.id] = migrateRawBack(legacy, defaults);
    } else {
      out[p.id] = JSON.parse(JSON.stringify(defaults)) as BackState;
    }
  }
  return out;
}

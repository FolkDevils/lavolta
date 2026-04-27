import type { BackState, FrontState, PatternConfig, Person, QrLink } from "./types";
import {
  clampLogoOffsetX,
  clampLogoOffsetY,
  clampLogoScale,
  clampTextOffsetX,
  clampTextOffsetY,
  DEFAULT_LOGO_OFFSET_X,
  DEFAULT_LOGO_OFFSET_Y,
  DEFAULT_LOGO_SCALE,
  normalizeColorValue,
  normalizeLogoId,
} from "./palette";
import { normalizeBackLayout, normalizeFrontLayout, qrStyleToDesignFields, normalizeQrBody, normalizeQrEye } from "./layouts";
import {
  BACK_FONT_CAPTION_DEFAULT,
  BACK_FONT_DISPLAY_DEFAULT,
  BACK_FONT_MINIMAL_DEFAULT,
  clampContactTelEmailGap,
  clampFontBackDisplay,
  clampFontMinimalLink,
  clampFontQrCaption,
  clampFontScale,
  clampNameTitleGap,
  CONTACT_TEL_EMAIL_GAP_DEFAULT,
  defaultNameTitleGap,
  NAME_TITLE_GAP_DEFAULT_STACK,
  normalizeFrontFontScalesForLayout,
} from "./typography";
import { clampTextOffsetY as _clampY } from "./palette";

// ─── Pattern defaults ────────────────────────────────────────────────────────

/** Shared factory pattern for Ted & Andrew (front + back). Avi uses AVI_*_FLOWER_PATTERN. */
export const DEFAULT_PATTERN: PatternConfig = {
  on: true,
  f1: false,
  f2: true,
  f3: true,
  density: 80,
  size: 30,
  rot: 80,
  opacity: 20,
  seed: 4242,
};

/** Avi Cohen (person id 3) — tuned front flower preset. */
export const AVI_FRONT_FLOWER_PATTERN: PatternConfig = {
  on: true,
  f1: false,
  f2: true,
  f3: false,
  density: 43,
  size: 112,
  rot: 210,
  opacity: 17,
  seed: 4242,
};

export const AVI_BACK_FLOWER_PATTERN: PatternConfig = {
  on: true,
  f1: false,
  f2: true,
  f3: false,
  density: 80,
  size: 114,
  rot: 91,
  opacity: 17,
  seed: 4242,
};

// ─── Front defaults ──────────────────────────────────────────────────────────

/** Ted Royer — stack · logo right, tuned wordmark position, neutral type/position. */
export const DEFAULT_FRONT: FrontState = {
  color: "dark",
  textFill: null,
  subTextFill: "#ffffff",
  phoneFill: null,
  emailFill: null,
  logo: "lg_full",
  logoScale: clampLogoScale(DEFAULT_LOGO_SCALE),
  logoOffsetX: -32,
  logoOffsetY: 3,
  textOffsetX: 0,
  nameTitleBlockOffsetY: 0,
  nameTitleGap: NAME_TITLE_GAP_DEFAULT_STACK,
  contactOffsetY: 0,
  contactTelEmailGap: CONTACT_TEL_EMAIL_GAP_DEFAULT,
  fontScaleName: clampFontScale(1),
  fontScaleTitle: clampFontScale(1),
  fontScaleContactLabel: clampFontScale(0.9),
  fontScaleContactValue: clampFontScale(1.1),
  layout: "stack_logo_right",
  pat: { ...DEFAULT_PATTERN },
};

/** Ted = DEFAULT_FRONT. Andrew (2) & Avi (3) = centered layout + tuned type/logo/text-position. */
export function defaultFrontForPerson(personId: number): FrontState {
  const ted: FrontState = { ...DEFAULT_FRONT, pat: { ...DEFAULT_FRONT.pat } };
  let out: FrontState;
  if (personId === 1) {
    out = JSON.parse(JSON.stringify(ted)) as FrontState;
  } else if (personId === 2 || personId === 3) {
    out = {
      ...ted,
      pat: personId === 3 ? { ...AVI_FRONT_FLOWER_PATTERN } : { ...ted.pat },
      layout: "centered",
      logoScale: clampLogoScale(2),
      logoOffsetX: 0,
      logoOffsetY: 12,
      textOffsetX: 0,
      nameTitleBlockOffsetY: 30,
      nameTitleGap: clampNameTitleGap(26),
      contactOffsetY: 10,
      contactTelEmailGap: clampContactTelEmailGap(28),
      fontScaleName: clampFontScale(1.05),
      fontScaleTitle: clampFontScale(1.1),
      fontScaleContactLabel: clampFontScale(1),
      fontScaleContactValue: clampFontScale(1.1),
    };
  } else {
    out = JSON.parse(JSON.stringify(ted)) as FrontState;
  }
  return normalizeFrontFontScalesForLayout(out);
}

// ─── Back defaults ───────────────────────────────────────────────────────────

export const DEFAULT_QR_LINKS: QrLink[] = [
  { id: "main", label: "folkdevils.io", url: "https://www.folkdevils.io/" },
  { id: "lab", label: "devilsplayground", url: "https://devilsplayground.folkdevils.io/" },
];

export const DEFAULT_BACK: BackState = {
  color: "dark",
  textFill: null,
  subTextFill: "yellow",
  logo: "lg_full",
  logoScale: DEFAULT_LOGO_SCALE,
  logoOffsetX: DEFAULT_LOGO_OFFSET_X,
  logoOffsetY: DEFAULT_LOGO_OFFSET_Y,
  layout: "one_qr",
  qrColor: "yellow",
  qrBody: "dots",
  qrEyeFrame: "circle",
  qrEyeBall: "circle",
  qrFrame: null,
  qrFrameRadius: 0.06,
  qrLinks: DEFAULT_QR_LINKS.map((l) => ({ ...l })),
  qrLinkIds: ["main"],
  fontQrCaption: BACK_FONT_CAPTION_DEFAULT,
  fontBackDisplay: BACK_FONT_DISPLAY_DEFAULT,
  fontMinimalLink: BACK_FONT_MINIMAL_DEFAULT,
  pat: { ...DEFAULT_PATTERN },
};

/** Factory back face; Avi (id 3) alone swaps in AVI_BACK_FLOWER_PATTERN. */
export function defaultBackForPerson(personId: number): BackState {
  const b = JSON.parse(JSON.stringify(DEFAULT_BACK)) as BackState;
  if (personId === 3) {
    b.pat = { ...AVI_BACK_FLOWER_PATTERN };
  }
  return b;
}

// ─── People defaults ─────────────────────────────────────────────────────────

export const DEFAULT_PEOPLE: Person[] = [
  {
    id: 1,
    name: "Ted Royer",
    title: "CCO / FOUNDER",
    phone: "(646) 621-0279",
    email: "ted@folkdevils.io",
  },
  {
    id: 2,
    name: "Andrew Eaton",
    title: "FOUNDER",
    phone: "(201) 881-6941",
    email: "andrew@folkdevils.io",
  },
  {
    id: 3,
    name: "Avi Cohen",
    title: "FOUNDER",
    phone: "(516) 864-1377",
    email: "avi@folkdevils.io",
  },
];

// ─── Migration helpers ───────────────────────────────────────────────────────

/** Merge a partial saved front (including legacy Y offsets) into a full FrontState. */
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
    color: normalizeColorValue(m.color, "dark"),
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

/** Merge partial saved back (incl. legacy qrStyle) onto a full baseline for one person. */
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
    color: normalizeColorValue(raw.color ?? base.color, "dark"),
    qrColor:
      raw.qrColor === null ? null : normalizeColorValue(raw.qrColor ?? base.qrColor, "yellow"),
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

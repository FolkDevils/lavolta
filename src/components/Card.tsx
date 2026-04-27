"use client";

import { forwardRef, useId } from "react";
import {
  BLEED,
  clampContactTelEmailGap,
  clampFontBackDisplay,
  clampFontMinimalLink,
  clampFontQrCaption,
  clampNameTitleGap,
  COLORS,
  DEFAULT_QR_LINKS,
  frontFontContactLabelPx,
  frontFontContactValuePx,
  frontFontNamePx,
  frontFontTitlePx,
  LOGOS,
  SAFE_INSET,
  VB_H,
  VB_W,
} from "@/lib/constants";
import { resolveCardPalette, resolveSolidHex } from "@/lib/color";
import type { BackState, FrontState, Person } from "@/lib/types";
import { PatternLayer } from "./PatternLayer";
import { QrModule } from "./QrModule";

/* ── Shared helpers ───────────────────────────────────────── */

const PAD = SAFE_INSET + 20; // 60 — content padding (0.375" from bleed edge)
const CONTENT_X = PAD;
const CONTENT_Y = PAD;
const CONTENT_W = VB_W - PAD * 2;
const CONTENT_H = VB_H - PAD * 2;

function FillDefs({ id, def }: { id: string; def: (typeof COLORS)[number]["fill"] }) {
  if (def.type === "solid") return null;
  /* We only support 135° (top-left → bottom-right) right now. If more
   * angles are added later, swap these coords for a proper trig solution. */
  return (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={def.from} />
      <stop offset="100%" stopColor={def.to} />
    </linearGradient>
  );
}

function fillFor(def: (typeof COLORS)[number]["fill"], gradId: string) {
  return def.type === "solid" ? def.color : `url(#${gradId})`;
}

/** Base SVG shell: background fill, bleed mask, optional guides. */
function CardShell({
  children,
  fillDef,
  guides,
}: {
  children: React.ReactNode;
  fillDef: (typeof COLORS)[number]["fill"];
  guides?: boolean;
}) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `bg-${uid}`;
  const clipId = `clip-${uid}`;
  return (
    <>
      <defs>
        <FillDefs id={gradId} def={fillDef} />
        <clipPath id={clipId}>
          <rect x={0} y={0} width={VB_W} height={VB_H} />
        </clipPath>
      </defs>
      {/* Background — fills full-bleed area */}
      <rect x={0} y={0} width={VB_W} height={VB_H} fill={fillFor(fillDef, gradId)} />
      <g clipPath={`url(#${clipId})`}>{children}</g>
      {/* Optional guides (never exported) */}
      {guides ? (
        <g pointerEvents="none">
          <rect
            x={BLEED}
            y={BLEED}
            width={VB_W - BLEED * 2}
            height={VB_H - BLEED * 2}
            fill="none"
            stroke="#ff0011"
            strokeDasharray="6 4"
            strokeWidth={1.2}
          />
          <rect
            x={SAFE_INSET}
            y={SAFE_INSET}
            width={VB_W - SAFE_INSET * 2}
            height={VB_H - SAFE_INSET * 2}
            fill="none"
            stroke="#ff58cd"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        </g>
      ) : null}
    </>
  );
}

/* ── Typography helpers ───────────────────────────────────── */

type TxtProps = React.SVGProps<SVGTextElement> & { children: React.ReactNode };
function Txt({ children, ...p }: TxtProps) {
  return (
    <text fontFamily="Rubik, sans-serif" {...p}>
      {children}
    </text>
  );
}

/* ── Front ────────────────────────────────────────────────── */

type FrontProps = {
  fs: FrontState;
  person: Person;
  guides?: boolean;
};

/** Clamp a 1-D position so a box of `size` stays fully inside [min, max].
 *  If the box is larger than the window, center it instead of forcing an
 *  inverted clamp (hi < lo). */
function clampBox(pos: number, size: number, min: number, max: number): number {
  const hi = max - size;
  if (hi < min) return (min + hi) / 2;
  return Math.min(hi, Math.max(min, pos));
}

export const CardFront = forwardRef<SVGSVGElement, FrontProps>(function CardFront(
  { fs, person, guides },
  ref,
) {
  const c = resolveCardPalette(fs.color);
  const textFill = fs.textFill == null ? c.text : resolveSolidHex(fs.textFill, c.text);
  const subFill = fs.subTextFill == null ? c.sub : resolveSolidHex(fs.subTextFill, c.sub);
  /* Phone + Email default to whatever the primary text resolves to; picking a
   * specific swatch overrides just that field and leaves the name/title alone. */
  const phoneFill = fs.phoneFill == null ? textFill : resolveSolidHex(fs.phoneFill, textFill);
  const emailFill = fs.emailFill == null ? textFill : resolveSolidHex(fs.emailFill, textFill);
  const lg = LOGOS.find((x) => x.id === fs.logo) ?? LOGOS[0];

  /** Render the logo at (x, y) anchored by `align`, then translated by the
   *  user's nudge and finally clamped so the image element's bounding box
   *  never leaves the viewBox. This is the "auto-fit" behavior — users get
   *  full freedom of the sliders, but nothing can scroll off the card. */
  const Logo = ({
    x,
    y,
    h = lg.h,
    align = "start",
  }: {
    x: number;
    y: number;
    h?: number;
    align?: "start" | "middle" | "end";
  }) => {
    if (!lg.src) return null;
    // PNG aspect: StaticLogoLrg is 500×206 → ratio ~2.427
    // icon.svg: 512×512 → 1. The icon reads small at the same `h` as the
    // wordmark, so we render it at 2× the layout height. Vertical: every
    // layout passes `y` as the top of the *nominal* logo band; we center the
    // taller icon in that same band so it doesn't crowd the type below.
    const scale = fs.logoScale ?? 1;
    const ratio = lg.kind === "icon" ? 1 : 500 / 206;
    const hi = (lg.kind === "icon" ? h * 2 : h) * scale;
    const w = hi * ratio;
    const baseOx = align === "start" ? x : align === "middle" ? x - w / 2 : x - w;
    const baseOy = y + h / 2 - hi / 2;
    const ox = clampBox(baseOx + (fs.logoOffsetX ?? 0), w, 0, VB_W);
    const yDraw = clampBox(baseOy + (fs.logoOffsetY ?? 0), hi, 0, VB_H);
    return (
      <image
        href={lg.src}
        x={ox}
        y={yDraw}
        width={w}
        height={hi}
        preserveAspectRatio="xMidYMid meet"
      />
    );
  };

  /* Positioning:
   *   - `textOffsetX` slides the whole text column left/right.
   *   - `nameTitleBlockOffsetY` moves name + title together on Y.
   *   - `nameTitleGap` controls vertical space between name baseline and title
   *     (stack, centered, bold). Contact block has its own Y nudge. */
  const tx = fs.textOffsetX ?? 0;
  const blockY = fs.nameTitleBlockOffsetY ?? 0;
  const nameTx = `translate(${tx}, ${blockY})`;
  const titleTx = `translate(${tx}, ${blockY})`;
  const contactTx = `translate(${tx}, ${fs.contactOffsetY ?? 0})`;
  const nameTitleGap = clampNameTitleGap(fs.nameTitleGap);
  const layout = fs.layout;
  const fzName = frontFontNamePx(layout, fs.fontScaleName);
  const fzTitle = frontFontTitlePx(layout, fs.fontScaleTitle);
  const fzCL = frontFontContactLabelPx(layout, fs.fontScaleContactLabel);
  const fzCV = frontFontContactValuePx(layout, fs.fontScaleContactValue);

  /** Shared stack column (name, title, contact) that can anchor left or right,
   *  and stack either vertically distributed (full card height, like the classic
   *  `stack` where the logo sits top and the contact block is pinned to the
   *  bottom) or compacted + centered (sits beside a vertically-centered logo).
   *
   *  When `anchor === "end"` everything flips to right-align; the contact
   *  block mirrors so labels stay *outside* the values in the reading direction. */
  const StackColumn = ({
    anchor = "start",
    xLeft,
    xRight,
    verticalMode = "distributed",
  }: {
    anchor?: "start" | "end";
    xLeft: number;
    xRight: number;
    verticalMode?: "distributed" | "centered";
  }) => {
    const isEnd = anchor === "end";
    const textAnchor: "start" | "end" = isEnd ? "end" : "start";
    const nameX = isEnd ? xRight : xLeft;
    /* Contact block:
     *   - label/value order flips with anchor so the label stays *outside*
     *     the value in the reading direction
     *   - 56-unit gutter keeps "EMAIL" clear of its value
     *   - row spacing between TEL and EMAIL is user-controlled (`contactTelEmailGap`). */
    const labelX = isEnd ? xRight : xLeft;
    const valueX = isEnd ? xRight - 56 : xLeft + 56;
    const rowGap = clampContactTelEmailGap(fs.contactTelEmailGap);

    /* Y positions for each line. `distributed` keeps the classic stack where
     * name/title sit mid-card and contacts pin to the bottom. `centered` packs
     * the whole block tight and centers it on the card so it balances
     * visually with a mid-card logo.
     *
     * The user asked for more breathing room between the name/title group
     * and the TEL/EMAIL group. We achieve that by:
     *   - distributed → raising name/title from .52H → .46H
     *   - centered     → pushing the contact group further below the title
     *                    (CY + 36 instead of +24). */
    const CY = VB_H / 2;
    const nameY =
      verticalMode === "centered" ? CY - 32 : CONTENT_Y + CONTENT_H * 0.46;
    const titleY = nameY + nameTitleGap;
    const contactTopY =
      verticalMode === "centered" ? CY + 36 : CONTENT_Y + CONTENT_H - 44;
    const contactBottomY = contactTopY + rowGap;

    return (
      <>
        <g transform={nameTx}>
          <Txt
            x={nameX}
            y={nameY}
            fontSize={fzName}
            fontWeight={700}
            fill={textFill}
            textAnchor={textAnchor}
            dominantBaseline="alphabetic"
          >
            {person.name}
          </Txt>
        </g>
        <g transform={titleTx}>
          <Txt
            x={nameX}
            y={titleY}
            fontSize={fzTitle}
            fontWeight={600}
            fill={subFill}
            letterSpacing="0.14em"
            textAnchor={textAnchor}
            dominantBaseline="hanging"
          >
            {person.title.toUpperCase()}
          </Txt>
        </g>
        <g transform={contactTx}>
          <Txt
            x={labelX}
            y={contactTopY}
            fontSize={fzCL}
            fontWeight={700}
            fill={subFill}
            letterSpacing="0.14em"
            textAnchor={textAnchor}
          >
            TEL
          </Txt>
          <Txt
            x={valueX}
            y={contactTopY}
            fontSize={fzCV}
            fill={phoneFill}
            textAnchor={textAnchor}
          >
            {person.phone}
          </Txt>
          <Txt
            x={labelX}
            y={contactBottomY}
            fontSize={fzCL}
            fontWeight={700}
            fill={subFill}
            letterSpacing="0.14em"
            textAnchor={textAnchor}
          >
            EMAIL
          </Txt>
          <Txt
            x={valueX}
            y={contactBottomY}
            fontSize={fzCV}
            fill={emailFill}
            textAnchor={textAnchor}
          >
            {person.email}
          </Txt>
        </g>
      </>
    );
  };

  /** Split layouts reserve one side for a vertically-centered logo and give
   *  the text column the remaining width. `LOGO_COLUMN_W` has to cover the
   *  widest rendering case — wordmark at ~2.43 aspect at `LOGO_CENTER_H` —
   *  so the 34pt name never collides with the mark. */
  const LOGO_CENTER_H = 80;
  const LOGO_COLUMN_W = 200;
  const GAP = 24;

  /* Layout renderers — all work inside the content box (CONTENT_X/Y/W/H) */
  const layouts: Record<typeof fs.layout, React.ReactNode> = {
    stack: (
      <>
        <Logo x={CONTENT_X} y={CONTENT_Y} h={56} />
        <StackColumn xLeft={CONTENT_X} xRight={CONTENT_X + CONTENT_W} />
      </>
    ),

    stack_logo_left: (() => {
      /* Logo pinned to the left edge, vertically centered. Text column right-
       * aligned, occupying the remaining width minus the gap. */
      const logoCX = CONTENT_X + LOGO_COLUMN_W / 2;
      const textLeft = CONTENT_X + LOGO_COLUMN_W + GAP;
      return (
        <>
          <Logo
            x={logoCX}
            y={VB_H / 2 - LOGO_CENTER_H / 2}
            h={LOGO_CENTER_H}
            align="middle"
          />
          <StackColumn
            anchor="end"
            xLeft={textLeft}
            xRight={CONTENT_X + CONTENT_W}
            verticalMode="centered"
          />
        </>
      );
    })(),

    stack_logo_right: (() => {
      /* Mirror of `stack_logo_left`: text left-aligned, logo center on the right. */
      const logoCX = CONTENT_X + CONTENT_W - LOGO_COLUMN_W / 2;
      const textRight = CONTENT_X + CONTENT_W - LOGO_COLUMN_W - GAP;
      return (
        <>
          <Logo
            x={logoCX}
            y={VB_H / 2 - LOGO_CENTER_H / 2}
            h={LOGO_CENTER_H}
            align="middle"
          />
          <StackColumn xLeft={CONTENT_X} xRight={textRight} verticalMode="centered" />
        </>
      );
    })(),

    centered: (
      <>
        <Logo x={VB_W / 2} y={CONTENT_Y + 10} h={54} align="middle" />
        <g transform={nameTx}>
          <Txt
            x={VB_W / 2}
            y={VB_H / 2 + 6}
            fontSize={fzName}
            fontWeight={700}
            fill={textFill}
            textAnchor="middle"
          >
            {person.name}
          </Txt>
        </g>
        <g transform={titleTx}>
          <Txt
            x={VB_W / 2}
            y={VB_H / 2 + 6 + nameTitleGap}
            fontSize={fzTitle}
            fontWeight={600}
            fill={subFill}
            letterSpacing="0.16em"
            textAnchor="middle"
          >
            {person.title.toUpperCase()}
          </Txt>
        </g>
        <g transform={contactTx}>
          <Txt
            x={VB_W / 2 - 12}
            y={CONTENT_Y + CONTENT_H - 20}
            fontSize={fzCV}
            fill={phoneFill}
            textAnchor="end"
          >
            {person.phone}
          </Txt>
          <Txt
            x={VB_W / 2 + 12}
            y={CONTENT_Y + CONTENT_H - 20}
            fontSize={fzCV}
            fill={emailFill}
          >
            {person.email}
          </Txt>
        </g>
      </>
    ),

    bold: (
      <>
        <Logo x={CONTENT_X} y={CONTENT_Y} h={46} />
        <g transform={nameTx}>
          <Txt
            x={CONTENT_X}
            y={CONTENT_Y + CONTENT_H * 0.58}
            fontSize={fzName}
            fontWeight={900}
            fill={textFill}
            letterSpacing="-0.02em"
          >
            {person.name}
          </Txt>
        </g>
        <g transform={titleTx}>
          <Txt
            x={CONTENT_X}
            y={CONTENT_Y + CONTENT_H * 0.58 + nameTitleGap}
            fontSize={fzTitle}
            fontWeight={700}
            fill={subFill}
            letterSpacing="0.14em"
          >
            {person.title.toUpperCase()}
          </Txt>
        </g>
        <g transform={contactTx}>
          <Txt
            x={CONTENT_X}
            y={CONTENT_Y + CONTENT_H - 12}
            fontSize={fzCV}
            fill={phoneFill}
          >
            {person.phone}
          </Txt>
          <Txt
            x={CONTENT_X + CONTENT_W * 0.5}
            y={CONTENT_Y + CONTENT_H - 12}
            fontSize={fzCV}
            fill={emailFill}
          >
            {person.email}
          </Txt>
        </g>
      </>
    ),

    text_left: (
      <>
        <g transform={nameTx}>
          <Txt
            x={CONTENT_X}
            y={CONTENT_Y + 28}
            fontSize={fzName}
            fontWeight={700}
            fill={textFill}
          >
            {person.name}
          </Txt>
        </g>
        <Logo x={CONTENT_X + CONTENT_W} y={CONTENT_Y} h={48} align="end" />
        <g transform={titleTx}>
          <Txt
            x={CONTENT_X}
            y={CONTENT_Y + CONTENT_H - 20}
            fontSize={fzTitle}
            fontWeight={700}
            fill={subFill}
            letterSpacing="0.14em"
          >
            {person.title.toUpperCase()}
          </Txt>
        </g>
        <g transform={contactTx}>
          <Txt
            x={CONTENT_X + CONTENT_W}
            y={CONTENT_Y + CONTENT_H - 32}
            fontSize={fzCV}
            fill={phoneFill}
            textAnchor="end"
          >
            {person.phone}
          </Txt>
          <Txt
            x={CONTENT_X + CONTENT_W}
            y={CONTENT_Y + CONTENT_H - 14}
            fontSize={fzCV}
            fill={emailFill}
            textAnchor="end"
          >
            {person.email}
          </Txt>
        </g>
      </>
    ),

    logo_left: (
      <>
        <Logo x={CONTENT_X} y={CONTENT_Y} h={48} align="start" />
        <g transform={nameTx}>
          <Txt
            x={CONTENT_X + CONTENT_W}
            y={CONTENT_Y + 28}
            fontSize={fzName}
            fontWeight={700}
            fill={textFill}
            textAnchor="end"
          >
            {person.name}
          </Txt>
        </g>
        <g transform={titleTx}>
          <Txt
            x={CONTENT_X + CONTENT_W}
            y={CONTENT_Y + CONTENT_H - 20}
            fontSize={fzTitle}
            fontWeight={700}
            fill={subFill}
            letterSpacing="0.14em"
            textAnchor="end"
          >
            {person.title.toUpperCase()}
          </Txt>
        </g>
        <g transform={contactTx}>
          <Txt x={CONTENT_X} y={CONTENT_Y + CONTENT_H - 32} fontSize={fzCV} fill={phoneFill}>
            {person.phone}
          </Txt>
          <Txt x={CONTENT_X} y={CONTENT_Y + CONTENT_H - 14} fontSize={fzCV} fill={emailFill}>
            {person.email}
          </Txt>
        </g>
      </>
    ),
  };

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height="100%"
      style={{ display: "block" }}
      data-face="front"
    >
      <CardShell fillDef={c.fill} guides={guides}>
        <PatternLayer cfg={fs.pat} w={VB_W} h={VB_H} />
        {layouts[fs.layout]}
      </CardShell>
    </svg>
  );
});

/* ── Back ─────────────────────────────────────────────────── */

type BackProps = {
  bs: BackState;
  guides?: boolean;
};

export const CardBack = forwardRef<SVGSVGElement, BackProps>(function CardBack({ bs, guides }, ref) {
  const c = resolveCardPalette(bs.color);
  const textFill = bs.textFill == null ? c.text : resolveSolidHex(bs.textFill, c.text);
  const subFill = bs.subTextFill == null ? c.sub : resolveSolidHex(bs.subTextFill, c.sub);
  const lg = LOGOS.find((x) => x.id === bs.logo) ?? LOGOS[0];
  /* QR "Auto" (null) tracks the resolved primary text color so it
   * always reads on the current background. */
  const qrHex = bs.qrColor == null ? textFill : resolveSolidHex(bs.qrColor, textFill);
  const qrFrameHex =
    bs.qrFrame == null ? undefined : resolveSolidHex(bs.qrFrame, "#ffffff");
  const allLinks = bs.qrLinks?.length ? bs.qrLinks : DEFAULT_QR_LINKS;
  const selected = bs.qrLinkIds
    .map((id) => allLinks.find((l) => l.id === id))
    .filter(Boolean) as typeof allLinks;
  const effectiveLinks = selected.length ? selected : allLinks.slice(0, 2);
  const fzCap = clampFontQrCaption(bs.fontQrCaption);
  const fzDisp = clampFontBackDisplay(bs.fontBackDisplay);
  const fzMin = clampFontMinimalLink(bs.fontMinimalLink);

  /* Helper so every layout renders the QR with the same design props. */
  const qrDesign = {
    body: bs.qrBody ?? "square",
    frame: bs.qrEyeFrame ?? "square",
    ball: bs.qrEyeBall ?? "square",
  };
  const Qr = ({
    link,
    x,
    y,
    size,
  }: {
    link: (typeof allLinks)[number];
    x: number;
    y: number;
    size: number;
  }) => (
    <QrModule
      url={link.url}
      x={x}
      y={y}
      size={size}
      color={qrHex}
      bg={qrFrameHex}
      bgRadius={bs.qrFrameRadius ?? 0.06}
      design={qrDesign}
      quietZone={qrFrameHex ? 0.06 : 0}
    />
  );

  const Logo = ({
    x,
    y,
    h = lg.h,
    align = "middle",
  }: {
    x: number;
    y: number;
    h?: number;
    align?: "start" | "middle" | "end";
  }) => {
    if (!lg.src) return null;
    const scale = bs.logoScale ?? 1;
    const ratio = lg.kind === "icon" ? 1 : 500 / 206;
    const hi = (lg.kind === "icon" ? h * 2 : h) * scale;
    const w = hi * ratio;
    const baseOx = align === "start" ? x : align === "middle" ? x - w / 2 : x - w;
    const baseOy = y + h / 2 - hi / 2;
    const ox = clampBox(baseOx + (bs.logoOffsetX ?? 0), w, 0, VB_W);
    const yDraw = clampBox(baseOy + (bs.logoOffsetY ?? 0), hi, 0, VB_H);
    return (
      <image
        href={lg.src}
        x={ox}
        y={yDraw}
        width={w}
        height={hi}
        preserveAspectRatio="xMidYMid meet"
      />
    );
  };

  type Variant = "one_qr" | "two_qr" | "logo_qr" | "type" | "minimal";
  const layouts: Record<Variant, React.ReactNode> = {
    one_qr: (() => {
      const link = selected[0] ?? allLinks[0];
      const qrSize = 200;
      const x = (VB_W - qrSize) / 2;
      const topY = (VB_H - qrSize) / 2 - 10;
      return (
        <g key={link.id}>
          <Qr link={link} x={x} y={topY} size={qrSize} />
          <Txt
            x={VB_W / 2}
            y={topY + qrSize + 28}
            fontSize={fzCap}
            fontWeight={700}
            fill={subFill}
            letterSpacing="0.14em"
            textAnchor="middle"
          >
            {link.label.toUpperCase()}
          </Txt>
        </g>
      );
    })(),

    two_qr: (() => {
      const qrSize = 170;
      const gap = 48;
      const totalW = qrSize * effectiveLinks.length + gap * (effectiveLinks.length - 1);
      const startX = (VB_W - totalW) / 2;
      const topY = (VB_H - qrSize) / 2 - 10;
      return (
        <>
          {effectiveLinks.map((link, i) => (
            <g key={link.id}>
              <Qr link={link} x={startX + i * (qrSize + gap)} y={topY} size={qrSize} />
              <Txt
                x={startX + i * (qrSize + gap) + qrSize / 2}
                y={topY + qrSize + 28}
                fontSize={fzCap}
                fontWeight={700}
                fill={subFill}
                letterSpacing="0.14em"
                textAnchor="middle"
              >
                {link.label.toUpperCase()}
              </Txt>
            </g>
          ))}
        </>
      );
    })(),

    logo_qr: (() => {
      const qrSize = Math.round(110 * 1); // ~10% larger for scan + legibility
      const gap = 36;
      const totalW = qrSize * effectiveLinks.length + gap * (effectiveLinks.length - 1);
      const startX = (VB_W - totalW) / 2;
      return (
        <>
          <Logo x={VB_W / 2} y={CONTENT_Y + 6} h={46} align="middle" />
          {effectiveLinks.map((link, i) => (
            <g key={link.id}>
              <Qr
                link={link}
                x={startX + i * (qrSize + gap)}
                y={CONTENT_Y + 90}
                size={qrSize}
              />
              <Txt
                x={startX + i * (qrSize + gap) + qrSize / 2}
                y={CONTENT_Y + 90 + qrSize + 22}
                fontSize={fzCap}
                fontWeight={700}
                fill={subFill}
                letterSpacing="0.12em"
                textAnchor="middle"
              >
                {link.label.toUpperCase()}
              </Txt>
            </g>
          ))}
        </>
      );
    })(),

    type: (() => {
      const qrSize = 96;
      const gap = 28;
      const totalW = qrSize * effectiveLinks.length + gap * (effectiveLinks.length - 1);
      const startX = (VB_W - totalW) / 2;
      return (
        <>
          <Txt
            x={VB_W / 2}
            y={CONTENT_Y + 50}
            fontSize={fzDisp}
            fontWeight={900}
            fill={textFill}
            letterSpacing="-0.02em"
            textAnchor="middle"
          >
            FOLK DEVILS
          </Txt>
          {effectiveLinks.map((link, i) => (
            <g key={link.id}>
              <Qr
                link={link}
                x={startX + i * (qrSize + gap)}
                y={CONTENT_Y + 106}
                size={qrSize}
              />
              <Txt
                x={startX + i * (qrSize + gap) + qrSize / 2}
                y={CONTENT_Y + 106 + qrSize + 22}
                fontSize={fzCap}
                fontWeight={700}
                fill={subFill}
                letterSpacing="0.12em"
                textAnchor="middle"
              >
                {link.label.toUpperCase()}
              </Txt>
            </g>
          ))}
        </>
      );
    })(),

    minimal: (() => {
      const qrSize = 64;
      const startY = CONTENT_Y + CONTENT_H - qrSize * effectiveLinks.length - (effectiveLinks.length - 1) * 16;
      return (
        <>
          {effectiveLinks.map((link, i) => (
            <g key={link.id}>
              <Qr
                link={link}
                x={CONTENT_X}
                y={startY + i * (qrSize + 16)}
                size={qrSize}
              />
              <Txt
                x={CONTENT_X + qrSize + 18}
                y={startY + i * (qrSize + 16) + qrSize / 2 + 4}
                fontSize={fzMin}
                fontWeight={600}
                fill={textFill}
              >
                {link.label}
              </Txt>
            </g>
          ))}
        </>
      );
    })(),
  };

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height="100%"
      style={{ display: "block" }}
      data-face="back"
    >
      <CardShell fillDef={c.fill} guides={guides}>
        <PatternLayer cfg={bs.pat} w={VB_W} h={VB_H} />
        {layouts[bs.layout]}
      </CardShell>
    </svg>
  );
});

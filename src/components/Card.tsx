"use client";

import { forwardRef, useId } from "react";
import {
  BLEED,
  COLORS,
  DEFAULT_QR_LINKS,
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
            stroke="#5a0044"
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

export const CardFront = forwardRef<SVGSVGElement, FrontProps>(function CardFront(
  { fs, person, guides },
  ref,
) {
  const c = resolveCardPalette(fs.color);
  const textFill = fs.textFill == null ? c.text : resolveSolidHex(fs.textFill, c.text);
  const subFill = fs.subTextFill == null ? c.sub : resolveSolidHex(fs.subTextFill, c.sub);
  const lg = LOGOS.find((x) => x.id === fs.logo) ?? LOGOS[0];

  /** Render the logo at (x, y) anchored by `align` */
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
    // icon.svg: 512×512 → 1 — icon reads small at the same `h` as the wordmark,
    // so we render it at 2× the layout height while keeping wordmark unchanged.
    // Vertical: every layout passes `y` as the top of the *nominal* logo band (`h`).
    // If we only stretched height downward, the icon would feel "pushed down" and
    // crowd the type — center the taller icon in that same band instead.
    const scale = fs.logoScale ?? 1;
    const ratio = lg.kind === "icon" ? 1 : 500 / 206;
    const hi = (lg.kind === "icon" ? h * 2 : h) * scale;
    const w = hi * ratio;
    const ox = align === "start" ? x : align === "middle" ? x - w / 2 : x - w;
    const yDraw = y + h / 2 - hi / 2;
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
     *   - 26-unit row spacing gives 13pt type comfortable rhythm */
    const labelX = isEnd ? xRight : xLeft;
    const valueX = isEnd ? xRight - 56 : xLeft + 56;

    /* Y positions for each line. `distributed` keeps the original classic
     * stack proportions; `centered` packs the block tight and centers it on
     * the card so it balances visually with a mid-card logo.
     *
     * Block geometry for `centered`:
     *   - name baseline   → CY − 30
     *   - title hanging   → name baseline + 10
     *   - TEL row         → CY + 24
     *   - EMAIL row       → TEL + 26
     *   …which puts the block roughly 120→236 on a 360-unit card, nicely
     *   centered on VB_H/2 = 180. */
    const CY = VB_H / 2;
    const nameY =
      verticalMode === "centered" ? CY - 30 : CONTENT_Y + CONTENT_H * 0.52;
    const titleY =
      verticalMode === "centered" ? CY - 30 + 10 : CONTENT_Y + CONTENT_H * 0.52 + 18;
    const contactTopY = verticalMode === "centered" ? CY + 24 : CONTENT_Y + CONTENT_H - 42;
    const contactBottomY =
      verticalMode === "centered" ? CY + 50 : CONTENT_Y + CONTENT_H - 16;

    return (
      <>
        <Txt
          x={nameX}
          y={nameY}
          fontSize={34}
          fontWeight={700}
          fill={textFill}
          textAnchor={textAnchor}
          dominantBaseline="alphabetic"
        >
          {person.name}
        </Txt>
        <Txt
          x={nameX}
          y={titleY}
          fontSize={11}
          fontWeight={600}
          fill={subFill}
          letterSpacing="0.14em"
          textAnchor={textAnchor}
          dominantBaseline="hanging"
        >
          {person.title.toUpperCase()}
        </Txt>
        <g>
          <Txt
            x={labelX}
            y={contactTopY}
            fontSize={9}
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
            fontSize={13}
            fill={textFill}
            textAnchor={textAnchor}
          >
            {person.phone}
          </Txt>
          <Txt
            x={labelX}
            y={contactBottomY}
            fontSize={9}
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
            fontSize={13}
            fill={textFill}
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
        <Txt
          x={VB_W / 2}
          y={VB_H / 2 + 6}
          fontSize={28}
          fontWeight={700}
          fill={textFill}
          textAnchor="middle"
        >
          {person.name}
        </Txt>
        <Txt
          x={VB_W / 2}
          y={VB_H / 2 + 28}
          fontSize={10}
          fontWeight={600}
          fill={subFill}
          letterSpacing="0.16em"
          textAnchor="middle"
        >
          {person.title.toUpperCase()}
        </Txt>
        <Txt
          x={VB_W / 2 - 12}
          y={CONTENT_Y + CONTENT_H - 20}
          fontSize={12}
          fill={textFill}
          textAnchor="end"
        >
          {person.phone}
        </Txt>
        <Txt
          x={VB_W / 2 + 12}
          y={CONTENT_Y + CONTENT_H - 20}
          fontSize={12}
          fill={textFill}
        >
          {person.email}
        </Txt>
      </>
    ),

    bold: (
      <>
        <Logo x={CONTENT_X} y={CONTENT_Y} h={46} />
        <Txt
          x={CONTENT_X}
          y={CONTENT_Y + CONTENT_H * 0.58}
          fontSize={56}
          fontWeight={900}
          fill={textFill}
          letterSpacing="-0.02em"
        >
          {person.name}
        </Txt>
        <Txt
          x={CONTENT_X}
          y={CONTENT_Y + CONTENT_H - 34}
          fontSize={10}
          fontWeight={700}
          fill={subFill}
          letterSpacing="0.14em"
        >
          {person.title.toUpperCase()}
        </Txt>
        <Txt
          x={CONTENT_X}
          y={CONTENT_Y + CONTENT_H - 12}
          fontSize={12}
          fill={textFill}
        >
          {person.phone}
        </Txt>
        <Txt
          x={CONTENT_X + CONTENT_W * 0.5}
          y={CONTENT_Y + CONTENT_H - 12}
          fontSize={12}
          fill={textFill}
        >
          {person.email}
        </Txt>
      </>
    ),

    text_left: (
      <>
        <Txt
          x={CONTENT_X}
          y={CONTENT_Y + 28}
          fontSize={28}
          fontWeight={700}
          fill={textFill}
        >
          {person.name}
        </Txt>
        <Logo x={CONTENT_X + CONTENT_W} y={CONTENT_Y} h={48} align="end" />
        <Txt
          x={CONTENT_X}
          y={CONTENT_Y + CONTENT_H - 20}
          fontSize={10}
          fontWeight={700}
          fill={subFill}
          letterSpacing="0.14em"
        >
          {person.title.toUpperCase()}
        </Txt>
        <Txt
          x={CONTENT_X + CONTENT_W}
          y={CONTENT_Y + CONTENT_H - 32}
          fontSize={12}
          fill={textFill}
          textAnchor="end"
        >
          {person.phone}
        </Txt>
        <Txt
          x={CONTENT_X + CONTENT_W}
          y={CONTENT_Y + CONTENT_H - 14}
          fontSize={12}
          fill={textFill}
          textAnchor="end"
        >
          {person.email}
        </Txt>
      </>
    ),

    logo_left: (
      <>
        <Logo x={CONTENT_X} y={CONTENT_Y} h={48} align="start" />
        <Txt
          x={CONTENT_X + CONTENT_W}
          y={CONTENT_Y + 28}
          fontSize={28}
          fontWeight={700}
          fill={textFill}
          textAnchor="end"
        >
          {person.name}
        </Txt>
        <Txt
          x={CONTENT_X + CONTENT_W}
          y={CONTENT_Y + CONTENT_H - 20}
          fontSize={10}
          fontWeight={700}
          fill={subFill}
          letterSpacing="0.14em"
          textAnchor="end"
        >
          {person.title.toUpperCase()}
        </Txt>
        <Txt x={CONTENT_X} y={CONTENT_Y + CONTENT_H - 32} fontSize={12} fill={textFill}>
          {person.phone}
        </Txt>
        <Txt x={CONTENT_X} y={CONTENT_Y + CONTENT_H - 14} fontSize={12} fill={textFill}>
          {person.email}
        </Txt>
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
    const ox = align === "start" ? x : align === "middle" ? x - w / 2 : x - w;
    const yDraw = y + h / 2 - hi / 2;
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

  type Variant = "two_qr" | "logo_qr" | "type" | "minimal";
  const layouts: Record<Variant, React.ReactNode> = {
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
                fontSize={10}
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
                fontSize={9}
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
            fontSize={54}
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
                fontSize={9}
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
                fontSize={16}
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

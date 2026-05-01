"use client";

import { forwardRef } from "react";
import {
  clampContactTelEmailGap,
  clampNameTitleGap,
  LOGOS,
  VB_H,
  VB_W,
  frontFontContactLabelPx,
  frontFontContactValuePx,
  frontFontNamePx,
  frontFontTitlePx,
} from "@/lib/constants";
import { resolveCardPalette, resolveSolidHex } from "@/lib/color";
import { buildLogoImageFilter } from "@/lib/logoFilter";
import type { FrontState, Person } from "@/lib/types";
import { PatternLayer } from "../PatternLayer";
import { CardShell, clampBox, CONTENT_H, CONTENT_W, CONTENT_X, CONTENT_Y, Txt } from "./shared";

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
  const phoneFill = fs.phoneFill == null ? textFill : resolveSolidHex(fs.phoneFill, textFill);
  const emailFill = fs.emailFill == null ? textFill : resolveSolidHex(fs.emailFill, textFill);
  const lg = LOGOS.find((x) => x.id === fs.logo) ?? LOGOS[0];

  /* Scale horizontal / vertical layout from legacy 480×240 content box. */
  const sx = CONTENT_W / 480;
  const sy = CONTENT_H / 240;
  /* Logo column for stack_logo_* — wide column so the crest reads large
   * (centered layout uses LOGO_H_HERO instead, not these). */
  const LOGO_COLUMN_W = Math.round(CONTENT_W * 0.38);
  const LOGO_CENTER_H = Math.round(LOGO_COLUMN_W * 0.88);
  const GAP = Math.round(36 * sx);
  const labelValueGap = Math.round(78 * sx);

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
    const scale = fs.logoScale ?? 1;
    const ratio = lg.kind === "icon" ? 1 : lg.aspect ?? 500 / 206;
    const hi = (lg.kind === "icon" ? h * 2 : h) * scale;
    const w = hi * ratio;
    const logoFilter = buildLogoImageFilter(fs.logoAdjust);
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
        style={logoFilter ? { filter: logoFilter } : undefined}
      />
    );
  };

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
    const labelX = isEnd ? xRight : xLeft;
    const valueX = isEnd ? xRight - labelValueGap : xLeft + labelValueGap;
    const rowGap = clampContactTelEmailGap(fs.contactTelEmailGap);
    const CY = CONTENT_Y + CONTENT_H / 2;
    /* Centered = name+title sit just above middle, contact below middle (logo
     * fills the rest of the column). Distributed = name in upper third, title
     * just below, contact pinned near bottom. Both proportions tuned for an
     * 8.5×5.5 landscape card. */
    const nameY =
      verticalMode === "centered"
        ? CY - Math.round(CONTENT_H * 0.06)
        : CONTENT_Y + Math.round(CONTENT_H * 0.55);
    const titleY = nameY + nameTitleGap;
    const contactTopY =
      verticalMode === "centered"
        ? CY + Math.round(CONTENT_H * 0.18)
        : CONTENT_Y + Math.round(CONTENT_H * 0.85);
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
            variant="sans"
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
            variant="sans"
            x={valueX}
            y={contactTopY}
            fontSize={fzCV}
            fill={phoneFill}
            textAnchor={textAnchor}
          >
            {person.phone}
          </Txt>
          <Txt
            variant="sans"
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
            variant="sans"
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

  /* Logo size baselines off CONTENT_H. `LOGO_H_HERO` is centered-layout only;
   * other layouts use larger corner / stack / column sizes so ×scale can read. */
  const LOGO_H_TOP = Math.round(CONTENT_H * 0.28);
  const LOGO_H_HERO = Math.round(CONTENT_H * 0.4);
  const LOGO_H_CORNER = Math.round(CONTENT_H * 0.28);
  const contactBottomY = CONTENT_Y + CONTENT_H - Math.round(28 * sy);

  const layouts: Record<typeof fs.layout, React.ReactNode> = {
    stack: (
      <>
        <Logo x={CONTENT_X} y={CONTENT_Y} h={LOGO_H_TOP} />
        <StackColumn xLeft={CONTENT_X} xRight={CONTENT_X + CONTENT_W} />
      </>
    ),

    stack_logo_left: (() => {
      const logoCX = CONTENT_X + LOGO_COLUMN_W / 2;
      const textLeft = CONTENT_X + LOGO_COLUMN_W + GAP;
      return (
        <>
          <Logo
            x={logoCX}
            y={CONTENT_Y + CONTENT_H / 2 - LOGO_CENTER_H / 2}
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
      const logoCX = CONTENT_X + CONTENT_W - LOGO_COLUMN_W / 2;
      const textRight = CONTENT_X + CONTENT_W - LOGO_COLUMN_W - GAP;
      return (
        <>
          <Logo
            x={logoCX}
            y={CONTENT_Y + CONTENT_H / 2 - LOGO_CENTER_H / 2}
            h={LOGO_CENTER_H}
            align="middle"
          />
          <StackColumn xLeft={CONTENT_X} xRight={textRight} verticalMode="centered" />
        </>
      );
    })(),

    centered: (() => {
      const logoY = CONTENT_Y + Math.round(CONTENT_H * 0.02);
      const nameY = CONTENT_Y + Math.round(CONTENT_H * 0.66);
      const titleY = nameY + nameTitleGap;
      const contactY = CONTENT_Y + CONTENT_H - Math.round(36 * sy);
      /* Single <text> with two <tspan>s + a spacer tspan keeps phone+email
       * centered as one group regardless of either string's width. */
      const contactGap = Math.round(fzCV * 1.6);
      return (
        <>
          <Logo x={VB_W / 2} y={logoY} h={LOGO_H_HERO} align="middle" />
          <g transform={nameTx}>
            <Txt
              x={VB_W / 2}
              y={nameY}
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
              y={titleY}
              fontSize={fzTitle}
              fontWeight={600}
              fill={subFill}
              letterSpacing="0.18em"
              textAnchor="middle"
              dominantBaseline="hanging"
            >
              {person.title.toUpperCase()}
            </Txt>
          </g>
          <g transform={contactTx}>
            <Txt
              variant="sans"
              x={VB_W / 2}
              y={contactY}
              fontSize={fzCV}
              textAnchor="middle"
            >
              <tspan fill={phoneFill}>{person.phone}</tspan>
              <tspan dx={contactGap} fill={emailFill}>
                {person.email}
              </tspan>
            </Txt>
          </g>
        </>
      );
    })(),

    bold: (() => {
      const nameY = CONTENT_Y + Math.round(CONTENT_H * 0.55);
      return (
        <>
          <Logo x={CONTENT_X} y={CONTENT_Y} h={LOGO_H_CORNER} />
          <g transform={nameTx}>
            <Txt
              x={CONTENT_X}
              y={nameY}
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
              y={nameY + nameTitleGap}
              fontSize={fzTitle}
              fontWeight={700}
              fill={subFill}
              letterSpacing="0.14em"
              dominantBaseline="hanging"
            >
              {person.title.toUpperCase()}
            </Txt>
          </g>
          <g transform={contactTx}>
            <Txt
              variant="sans"
              x={CONTENT_X}
              y={contactBottomY}
              fontSize={fzCV}
              fill={phoneFill}
            >
              {person.phone}
            </Txt>
            <Txt
              variant="sans"
              x={CONTENT_X + CONTENT_W}
              y={contactBottomY}
              fontSize={fzCV}
              fill={emailFill}
              textAnchor="end"
            >
              {person.email}
            </Txt>
          </g>
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
      data-face="front"
    >
      <CardShell fillDef={c.fill} guides={guides} bgImage={fs.bgImage}>
        <PatternLayer cfg={fs.pat} w={VB_W} h={VB_H} />
        {layouts[fs.layout]}
      </CardShell>
    </svg>
  );
});

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
    const valueX = isEnd ? xRight - 68 : xLeft + 68;
    const rowGap = clampContactTelEmailGap(fs.contactTelEmailGap);
    const CY = VB_H / 2;
    const nameY = verticalMode === "centered" ? CY - 32 : CONTENT_Y + CONTENT_H * 0.46;
    const titleY = nameY + nameTitleGap;
    const contactTopY = verticalMode === "centered" ? CY + 36 : CONTENT_Y + CONTENT_H - 44;
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
          <Txt x={valueX} y={contactTopY} fontSize={fzCV} fill={phoneFill} textAnchor={textAnchor}>
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
          <Txt x={valueX} y={contactBottomY} fontSize={fzCV} fill={emailFill} textAnchor={textAnchor}>
            {person.email}
          </Txt>
        </g>
      </>
    );
  };

  const LOGO_CENTER_H = 80;
  const LOGO_COLUMN_W = 200;
  const GAP = 24;

  const layouts: Record<typeof fs.layout, React.ReactNode> = {
    stack: (
      <>
        <Logo x={CONTENT_X} y={CONTENT_Y} h={56} />
        <StackColumn xLeft={CONTENT_X} xRight={CONTENT_X + CONTENT_W} />
      </>
    ),

    stack_logo_left: (() => {
      const logoCX = CONTENT_X + LOGO_COLUMN_W / 2;
      const textLeft = CONTENT_X + LOGO_COLUMN_W + GAP;
      return (
        <>
          <Logo x={logoCX} y={VB_H / 2 - LOGO_CENTER_H / 2} h={LOGO_CENTER_H} align="middle" />
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
          <Logo x={logoCX} y={VB_H / 2 - LOGO_CENTER_H / 2} h={LOGO_CENTER_H} align="middle" />
          <StackColumn xLeft={CONTENT_X} xRight={textRight} verticalMode="centered" />
        </>
      );
    })(),

    centered: (
      <>
        <Logo x={VB_W / 2} y={CONTENT_Y + 10} h={54} align="middle" />
        <g transform={nameTx}>
          <Txt x={VB_W / 2} y={VB_H / 2 + 6} fontSize={fzName} fontWeight={700} fill={textFill} textAnchor="middle">
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
          <Txt x={VB_W / 2 - 12} y={CONTENT_Y + CONTENT_H - 20} fontSize={fzCV} fill={phoneFill} textAnchor="end">
            {person.phone}
          </Txt>
          <Txt x={VB_W / 2 + 12} y={CONTENT_Y + CONTENT_H - 20} fontSize={fzCV} fill={emailFill}>
            {person.email}
          </Txt>
        </g>
      </>
    ),

    bold: (
      <>
        <Logo x={CONTENT_X} y={CONTENT_Y} h={46} />
        <g transform={nameTx}>
          <Txt x={CONTENT_X} y={CONTENT_Y + CONTENT_H * 0.58} fontSize={fzName} fontWeight={900} fill={textFill} letterSpacing="-0.02em">
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
          <Txt x={CONTENT_X} y={CONTENT_Y + CONTENT_H - 12} fontSize={fzCV} fill={phoneFill}>
            {person.phone}
          </Txt>
          <Txt x={CONTENT_X + CONTENT_W * 0.5} y={CONTENT_Y + CONTENT_H - 12} fontSize={fzCV} fill={emailFill}>
            {person.email}
          </Txt>
        </g>
      </>
    ),

    text_left: (
      <>
        <g transform={nameTx}>
          <Txt x={CONTENT_X} y={CONTENT_Y + 28} fontSize={fzName} fontWeight={700} fill={textFill}>
            {person.name}
          </Txt>
        </g>
        <Logo x={CONTENT_X + CONTENT_W} y={CONTENT_Y} h={48} align="end" />
        <g transform={titleTx}>
          <Txt x={CONTENT_X} y={CONTENT_Y + CONTENT_H - 20} fontSize={fzTitle} fontWeight={700} fill={subFill} letterSpacing="0.14em">
            {person.title.toUpperCase()}
          </Txt>
        </g>
        <g transform={contactTx}>
          <Txt x={CONTENT_X + CONTENT_W} y={CONTENT_Y + CONTENT_H - 32} fontSize={fzCV} fill={phoneFill} textAnchor="end">
            {person.phone}
          </Txt>
          <Txt x={CONTENT_X + CONTENT_W} y={CONTENT_Y + CONTENT_H - 14} fontSize={fzCV} fill={emailFill} textAnchor="end">
            {person.email}
          </Txt>
        </g>
      </>
    ),

    logo_left: (
      <>
        <Logo x={CONTENT_X} y={CONTENT_Y} h={48} align="start" />
        <g transform={nameTx}>
          <Txt x={CONTENT_X + CONTENT_W} y={CONTENT_Y + 28} fontSize={fzName} fontWeight={700} fill={textFill} textAnchor="end">
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

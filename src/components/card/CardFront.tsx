"use client";

import { forwardRef } from "react";
import {
  clampContactTelEmailGap,
  clampNameTitleGap,
  frontLayoutOrientation,
  getCardDims,
  LOGOS,
  frontFontContactLabelPx,
  frontFontContactValuePx,
  frontFontNamePx,
  frontFontTitlePx,
} from "@/lib/constants";
import { resolveCardPalette, resolveSolidHex } from "@/lib/color";
import { buildLogoImageFilter } from "@/lib/logoFilter";
import type { FrontState, Person } from "@/lib/types";
import { PatternLayer } from "../PatternLayer";
import { CardShell, clampBox, contentRectFor, Txt } from "./shared";

type FrontProps = {
  fs: FrontState;
  person: Person;
  guides?: boolean;
};

export const CardFront = forwardRef<SVGSVGElement, FrontProps>(function CardFront(
  { fs, person, guides },
  ref,
) {
  const orientation = frontLayoutOrientation(fs.layout);
  const { vbW, vbH } = getCardDims(orientation);
  const { contentX, contentY, contentW, contentH } = contentRectFor(vbW, vbH);

  const c = resolveCardPalette(fs.color);
  const textFill = fs.textFill == null ? c.text : resolveSolidHex(fs.textFill, c.text);
  const subFill = fs.subTextFill == null ? c.sub : resolveSolidHex(fs.subTextFill, c.sub);
  const phoneFill = fs.phoneFill == null ? textFill : resolveSolidHex(fs.phoneFill, textFill);
  const emailFill = fs.emailFill == null ? textFill : resolveSolidHex(fs.emailFill, textFill);
  const lg = LOGOS.find((x) => x.id === fs.logo) ?? LOGOS[0];

  /* Scale per-axis from a legacy 480×240 content box. Portrait renders read
   * as a "rotated" landscape: sx becomes the short axis. */
  const sx = contentW / 480;
  const sy = contentH / 240;
  const layout = fs.layout;
  /* Logo column width for stack_logo_* — based on whichever dimension is shorter.
   * For landscape this is contentW; for portrait we still use contentW so the
   * column fits the visual width. */
  const LOGO_COLUMN_W = Math.round(contentW * 0.38);
  const LOGO_CENTER_H = Math.round(LOGO_COLUMN_W * 0.88);
  const GAP = Math.round(36 * sx);
  /* Label column (TEL / EMAIL) → value column; portrait stack only gets extra air. */
  const labelValueGap = Math.round((layout === "p_stack" ? 108 : 78) * sx);

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
    const ox = clampBox(baseOx + (fs.logoOffsetX ?? 0), w, 0, vbW);
    const yDraw = clampBox(baseOy + (fs.logoOffsetY ?? 0), hi, 0, vbH);
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
    /* Stack · Logo left (anchor "end"): no TEL/EMAIL labels — values only, flush right. */
    const showContactLabels = !isEnd;
    const contactLabelX = xLeft;
    const contactValueX = isEnd ? xRight : xLeft + labelValueGap;
    const contactLabelAnchor: "start" | "end" = "start";
    const contactValueAnchor: "start" | "end" = isEnd ? "end" : "start";
    const rowGap = clampContactTelEmailGap(fs.contactTelEmailGap);
    const CY = contentY + contentH / 2;
    /* Centered = name+title sit just above middle, contact below middle (logo
     * fills the rest of the column). Distributed = name in upper third, title
     * just below, contact pinned near bottom. */
    const nameY =
      verticalMode === "centered"
        ? CY - Math.round(contentH * 0.06)
        : contentY + Math.round(contentH * 0.55);
    const titleY = nameY + nameTitleGap;
    const contactTopY =
      verticalMode === "centered"
        ? CY + Math.round(contentH * 0.18)
        : contentY + Math.round(contentH * 0.85);
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
          {showContactLabels ? (
            <Txt
              variant="sans"
              x={contactLabelX}
              y={contactTopY}
              fontSize={fzCL}
              fontWeight={700}
              fill={subFill}
              letterSpacing="0.14em"
              textAnchor={contactLabelAnchor}
            >
              TEL
            </Txt>
          ) : null}
          <Txt
            variant="sans"
            x={contactValueX}
            y={contactTopY}
            fontSize={fzCV}
            fill={phoneFill}
            textAnchor={contactValueAnchor}
          >
            {person.phone}
          </Txt>
          {showContactLabels ? (
            <Txt
              variant="sans"
              x={contactLabelX}
              y={contactBottomY}
              fontSize={fzCL}
              fontWeight={700}
              fill={subFill}
              letterSpacing="0.14em"
              textAnchor={contactLabelAnchor}
            >
              EMAIL
            </Txt>
          ) : null}
          <Txt
            variant="sans"
            x={contactValueX}
            y={contactBottomY}
            fontSize={fzCV}
            fill={emailFill}
            textAnchor={contactValueAnchor}
          >
            {person.email}
          </Txt>
        </g>
      </>
    );
  };

  /* Logo size baselines (relative to contentH for landscape, contentW for portrait
   * so visual scale stays similar regardless of orientation). */
  const LOGO_H_TOP = Math.round(contentH * 0.28);
  const LOGO_H_HERO = Math.round(contentH * 0.4);
  const LOGO_H_CORNER = Math.round(contentH * 0.28);
  const contactBottomY = contentY + contentH - Math.round(28 * sy);

  /* Portrait sizing baselines — favor short axis (contentW) to keep the logo
   * from blowing up vertically in tall layouts. */
  const PORTRAIT_LOGO_H_HERO = Math.round(contentW * 0.5);
  const PORTRAIT_LOGO_H_TOP = Math.round(contentW * 0.32);

  const layouts: Record<typeof fs.layout, React.ReactNode> = {
    /* ── Landscape ──────────────────────────────────────────────────────── */
    stack: (
      <>
        <Logo x={contentX} y={contentY} h={LOGO_H_TOP} />
        <StackColumn xLeft={contentX} xRight={contentX + contentW} />
      </>
    ),

    stack_logo_left: (() => {
      const logoCX = contentX + LOGO_COLUMN_W / 2;
      const textLeft = contentX + LOGO_COLUMN_W + GAP;
      return (
        <>
          <Logo
            x={logoCX}
            y={contentY + contentH / 2 - LOGO_CENTER_H / 2}
            h={LOGO_CENTER_H}
            align="middle"
          />
          <StackColumn
            anchor="end"
            xLeft={textLeft}
            xRight={contentX + contentW}
            verticalMode="centered"
          />
        </>
      );
    })(),

    stack_logo_right: (() => {
      const logoCX = contentX + contentW - LOGO_COLUMN_W / 2;
      const textRight = contentX + contentW - LOGO_COLUMN_W - GAP;
      return (
        <>
          <Logo
            x={logoCX}
            y={contentY + contentH / 2 - LOGO_CENTER_H / 2}
            h={LOGO_CENTER_H}
            align="middle"
          />
          <StackColumn xLeft={contentX} xRight={textRight} verticalMode="centered" />
        </>
      );
    })(),

    centered: (() => {
      const logoY = contentY + Math.round(contentH * 0.02);
      const nameY = contentY + Math.round(contentH * 0.66);
      const titleY = nameY + nameTitleGap;
      const contactY = contentY + contentH - Math.round(36 * sy);
      const contactGap = Math.round(fzCV * 1.6);
      return (
        <>
          <Logo x={vbW / 2} y={logoY} h={LOGO_H_HERO} align="middle" />
          <g transform={nameTx}>
            <Txt
              x={vbW / 2}
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
              x={vbW / 2}
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
            <Txt variant="sans" x={vbW / 2} y={contactY} fontSize={fzCV} textAnchor="middle">
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
      const nameY = contentY + Math.round(contentH * 0.55);
      return (
        <>
          <Logo x={contentX} y={contentY} h={LOGO_H_CORNER} />
          <g transform={nameTx}>
            <Txt
              x={contentX}
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
              x={contentX}
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
            <Txt variant="sans" x={contentX} y={contactBottomY} fontSize={fzCV} fill={phoneFill}>
              {person.phone}
            </Txt>
            <Txt
              variant="sans"
              x={contentX + contentW}
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

    /* ── Portrait ───────────────────────────────────────────────────────── */
    p_centered: (() => {
      /* Logo centered upper-third, name/title centered mid-card, phone + email
       * stacked and centered above the bottom edge. */
      const logoY = contentY + Math.round(contentH * 0.08);
      const nameY = contentY + Math.round(contentH * 0.58);
      const titleY = nameY + nameTitleGap;
      const rowGap = clampContactTelEmailGap(fs.contactTelEmailGap);
      const emailY = contentY + contentH - Math.round(32 * sy);
      const phoneY = emailY - rowGap;
      return (
        <>
          <Logo x={vbW / 2} y={logoY} h={PORTRAIT_LOGO_H_HERO} align="middle" />
          <g transform={nameTx}>
            <Txt
              x={vbW / 2}
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
              x={vbW / 2}
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
            <Txt variant="sans" x={vbW / 2} y={phoneY} fontSize={fzCV} fill={phoneFill} textAnchor="middle">
              {person.phone}
            </Txt>
            <Txt variant="sans" x={vbW / 2} y={emailY} fontSize={fzCV} fill={emailFill} textAnchor="middle">
              {person.email}
            </Txt>
          </g>
        </>
      );
    })(),

    p_stack: (() => {
      /* Logo top-left, name+title in upper-mid, TEL/EMAIL stacked just below the title.
       * Slider `contactOffsetY` still applies on top. */
      const rowGap = clampContactTelEmailGap(fs.contactTelEmailGap);
      const nameY = contentY + Math.round(contentH * 0.5);
      const titleY = nameY + nameTitleGap;
      const contactTopY = titleY + Math.round(fzTitle * 1.6) + 300;
      const contactBottomY = contactTopY + rowGap;
      const labelX = contentX;
      const valueX = contentX + labelValueGap;
      return (
        <>
          <Logo x={contentX} y={contentY} h={PORTRAIT_LOGO_H_TOP} />
          <g transform={nameTx}>
            <Txt
              x={contentX}
              y={nameY}
              fontSize={fzName}
              fontWeight={700}
              fill={textFill}
            >
              {person.name}
            </Txt>
          </g>
          <g transform={titleTx}>
            <Txt
              x={contentX}
              y={titleY}
              fontSize={fzTitle}
              fontWeight={600}
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
              x={labelX}
              y={contactTopY}
              fontSize={fzCL}
              fontWeight={700}
              fill={subFill}
              letterSpacing="0.14em"
            >
              TEL
            </Txt>
            <Txt variant="sans" x={valueX} y={contactTopY} fontSize={fzCV} fill={phoneFill}>
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
            >
              EMAIL
            </Txt>
            <Txt variant="sans" x={valueX} y={contactBottomY} fontSize={fzCV} fill={emailFill}>
              {person.email}
            </Txt>
          </g>
        </>
      );
    })(),

    p_logo_top: (() => {
      /* Hero logo fills upper half; name set big-bold below, title small-caps,
       * phone + email stacked and centered near the bottom. */
      const logoY = contentY + Math.round(contentH * 0.06);
      const nameY = contentY + Math.round(contentH * 0.66);
      const titleY = nameY + nameTitleGap;
      const rowGap = clampContactTelEmailGap(fs.contactTelEmailGap);
      const emailY = contentY + contentH - Math.round(28 * sy);
      const phoneY = emailY - rowGap;
      return (
        <>
          <Logo
            x={vbW / 2}
            y={logoY}
            h={Math.round(PORTRAIT_LOGO_H_HERO * 1.15)}
            align="middle"
          />
          <g transform={nameTx}>
            <Txt
              x={vbW / 2}
              y={nameY}
              fontSize={fzName}
              fontWeight={900}
              fill={textFill}
              letterSpacing="-0.02em"
              textAnchor="middle"
            >
              {person.name}
            </Txt>
          </g>
          <g transform={titleTx}>
            <Txt
              x={vbW / 2}
              y={titleY}
              fontSize={fzTitle}
              fontWeight={700}
              fill={subFill}
              letterSpacing="0.18em"
              textAnchor="middle"
              dominantBaseline="hanging"
            >
              {person.title.toUpperCase()}
            </Txt>
          </g>
          <g transform={contactTx}>
            <Txt variant="sans" x={vbW / 2} y={phoneY} fontSize={fzCV} fill={phoneFill} textAnchor="middle">
              {person.phone}
            </Txt>
            <Txt variant="sans" x={vbW / 2} y={emailY} fontSize={fzCV} fill={emailFill} textAnchor="middle">
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
      viewBox={`0 0 ${vbW} ${vbH}`}
      width="100%"
      height="100%"
      style={{ display: "block" }}
      data-face="front"
      data-orientation={orientation}
    >
      <CardShell fillDef={c.fill} guides={guides} bgImage={fs.bgImage} vbW={vbW} vbH={vbH}>
        <PatternLayer cfg={fs.pat} w={vbW} h={vbH} ink={c.hair} />
        {layouts[fs.layout]}
      </CardShell>
    </svg>
  );
});

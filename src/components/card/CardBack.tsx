"use client";

import { forwardRef } from "react";
import {
  CARD_GEOM_SCALE,
  clampFontBackDisplay,
  clampFontMinimalLink,
  clampFontQrCaption,
  DEFAULT_QR_LINKS,
  LOGOS,
  VB_H,
  VB_W,
} from "@/lib/constants";
import { resolveCardPalette, resolveSolidHex } from "@/lib/color";
import { buildLogoImageFilter } from "@/lib/logoFilter";
import type { BackState } from "@/lib/types";
import { PatternLayer } from "../PatternLayer";
import { QrModule } from "../QrModule";
import { CardShell, clampBox, CONTENT_H, CONTENT_X, CONTENT_Y, Txt } from "./shared";

type BackProps = {
  bs: BackState;
  guides?: boolean;
};

export const CardBack = forwardRef<SVGSVGElement, BackProps>(function CardBack({ bs, guides }, ref) {
  const c = resolveCardPalette(bs.color);
  const textFill = bs.textFill == null ? c.text : resolveSolidHex(bs.textFill, c.text);
  const subFill = bs.subTextFill == null ? c.sub : resolveSolidHex(bs.subTextFill, c.sub);
  const lg = LOGOS.find((x) => x.id === bs.logo) ?? LOGOS[0];
  const qrHex = bs.qrColor == null ? textFill : resolveSolidHex(bs.qrColor, textFill);
  const qrFrameHex = bs.qrFrame == null ? undefined : resolveSolidHex(bs.qrFrame, "#ffffff");
  const allLinks = bs.qrLinks?.length ? bs.qrLinks : DEFAULT_QR_LINKS;
  const selected = bs.qrLinkIds
    .map((id) => allLinks.find((l) => l.id === id))
    .filter(Boolean) as typeof allLinks;
  const effectiveLinks = selected.length ? selected : allLinks.slice(0, 2);
  const fzCap = clampFontQrCaption(bs.fontQrCaption);
  const fzDisp = clampFontBackDisplay(bs.fontBackDisplay);
  const fzMin = clampFontMinimalLink(bs.fontMinimalLink);

  /* QR sizes scaled to landscape: cap by the SHORTER side so they don't go
   * absurdly wide. Caption gap pulled in tighter to feel intentional. */
  const qrLarge = Math.min(Math.floor(VB_H * 0.62), Math.floor(VB_W * 0.42));
  const qrMed = Math.min(Math.floor(VB_H * 0.48), Math.floor(VB_W * 0.32));
  const qrSmall = Math.min(Math.floor(VB_H * 0.30), Math.floor(VB_W * 0.20));
  const gapLg = Math.round(60 * CARD_GEOM_SCALE);
  const gapMd = Math.round(40 * CARD_GEOM_SCALE);
  const gapSm = Math.round(28 * CARD_GEOM_SCALE);
  const capGap = Math.round(22 * CARD_GEOM_SCALE);

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
    const ratio = lg.kind === "icon" ? 1 : lg.aspect ?? 500 / 206;
    const hi = (lg.kind === "icon" ? h * 2 : h) * scale;
    const w = hi * ratio;
    const logoFilter = buildLogoImageFilter(bs.logoAdjust);
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
        style={logoFilter ? { filter: logoFilter } : undefined}
      />
    );
  };

  type Variant = "one_qr" | "two_qr" | "logo_qr" | "type" | "minimal";
  const layouts: Record<Variant, React.ReactNode> = {
    one_qr: (() => {
      const link = selected[0] ?? allLinks[0];
      const qrSize = qrLarge;
      const x = (VB_W - qrSize) / 2;
      const topY = (VB_H - qrSize) / 2 - Math.round(VB_H * 0.012);
      return (
        <g key={link.id}>
          <Qr link={link} x={x} y={topY} size={qrSize} />
          <Txt
            variant="sans"
            x={VB_W / 2}
            y={topY + qrSize + capGap}
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
      const qrSize = qrMed;
      const gap = gapLg;
      const totalW = qrSize * effectiveLinks.length + gap * (effectiveLinks.length - 1);
      const startX = (VB_W - totalW) / 2;
      const topY = (VB_H - qrSize) / 2 - Math.round(VB_H * 0.012);
      return (
        <>
          {effectiveLinks.map((link, i) => (
            <g key={link.id}>
              <Qr link={link} x={startX + i * (qrSize + gap)} y={topY} size={qrSize} />
              <Txt
                variant="sans"
                x={startX + i * (qrSize + gap) + qrSize / 2}
                y={topY + qrSize + capGap}
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
      const logoH = Math.round(CONTENT_H * 0.34);
      const qrSize = Math.min(Math.floor(VB_H * 0.42), Math.floor(VB_W * 0.22));
      const gap = gapMd;
      const totalW = qrSize * effectiveLinks.length + gap * (effectiveLinks.length - 1);
      const startX = (VB_W - totalW) / 2;
      const qrBandY = CONTENT_Y + Math.round(CONTENT_H * 0.42);
      return (
        <>
          <Logo
            x={VB_W / 2}
            y={CONTENT_Y + Math.round(CONTENT_H * 0.02)}
            h={logoH}
            align="middle"
          />
          {effectiveLinks.map((link, i) => (
            <g key={link.id}>
              <Qr link={link} x={startX + i * (qrSize + gap)} y={qrBandY} size={qrSize} />
              <Txt
                variant="sans"
                x={startX + i * (qrSize + gap) + qrSize / 2}
                y={qrBandY + qrSize + Math.round(22 * CARD_GEOM_SCALE)}
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
      const qrSize = qrSmall;
      const gap = gapSm;
      const totalW = qrSize * effectiveLinks.length + gap * (effectiveLinks.length - 1);
      const startX = (VB_W - totalW) / 2;
      const headlineY = CONTENT_Y + Math.round(CONTENT_H * 0.18);
      const qrY = CONTENT_Y + Math.round(CONTENT_H * 0.42);
      return (
        <>
          <Txt
            x={VB_W / 2}
            y={headlineY}
            fontSize={fzDisp}
            fontWeight={900}
            fill={textFill}
            letterSpacing="-0.02em"
            textAnchor="middle"
          >
            LA VOLTA
          </Txt>
          {effectiveLinks.map((link, i) => (
            <g key={link.id}>
              <Qr link={link} x={startX + i * (qrSize + gap)} y={qrY} size={qrSize} />
              <Txt
                variant="sans"
                x={startX + i * (qrSize + gap) + qrSize / 2}
                y={qrY + qrSize + Math.round(22 * CARD_GEOM_SCALE)}
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
      const qrSize = Math.round(96 * CARD_GEOM_SCALE);
      const rowGap = Math.round(20 * CARD_GEOM_SCALE);
      const rowStep = qrSize + rowGap;
      const n = effectiveLinks.length;
      const startY = CONTENT_Y + CONTENT_H - n * qrSize - Math.max(0, n - 1) * rowGap;
      return (
        <>
          {effectiveLinks.map((link, i) => (
            <g key={link.id}>
              <Qr link={link} x={CONTENT_X} y={startY + i * rowStep} size={qrSize} />
              <Txt
                variant="sans"
                x={CONTENT_X + qrSize + Math.round(18 * CARD_GEOM_SCALE)}
                y={startY + i * rowStep + qrSize / 2 + 4}
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
      <CardShell fillDef={c.fill} guides={guides} bgImage={bs.bgImage}>
        <PatternLayer cfg={bs.pat} w={VB_W} h={VB_H} />
        {layouts[bs.layout]}
      </CardShell>
    </svg>
  );
});

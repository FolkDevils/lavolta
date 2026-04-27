"use client";

import { forwardRef } from "react";
import {
  clampFontBackDisplay,
  clampFontMinimalLink,
  clampFontQrCaption,
  DEFAULT_QR_LINKS,
  LOGOS,
  VB_H,
  VB_W,
} from "@/lib/constants";
import { resolveCardPalette, resolveSolidHex } from "@/lib/color";
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
      const qrSize = 110;
      const gap = 36;
      const totalW = qrSize * effectiveLinks.length + gap * (effectiveLinks.length - 1);
      const startX = (VB_W - totalW) / 2;
      return (
        <>
          <Logo x={VB_W / 2} y={CONTENT_Y + 6} h={46} align="middle" />
          {effectiveLinks.map((link, i) => (
            <g key={link.id}>
              <Qr link={link} x={startX + i * (qrSize + gap)} y={CONTENT_Y + 90} size={qrSize} />
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
              <Qr link={link} x={startX + i * (qrSize + gap)} y={CONTENT_Y + 106} size={qrSize} />
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
      const startY =
        CONTENT_Y + CONTENT_H - qrSize * effectiveLinks.length - (effectiveLinks.length - 1) * 16;
      return (
        <>
          {effectiveLinks.map((link, i) => (
            <g key={link.id}>
              <Qr link={link} x={CONTENT_X} y={startY + i * (qrSize + 16)} size={qrSize} />
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

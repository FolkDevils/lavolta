"use client";

import { forwardRef } from "react";
import {
  backLayoutOrientation,
  CARD_GEOM_SCALE,
  clampFontBackDisplay,
  clampFontMinimalLink,
  clampFontQrCaption,
  DEFAULT_QR_LINKS,
  getCardDims,
  LOGOS,
} from "@/lib/constants";
import { resolveCardPalette, resolveSolidHex } from "@/lib/color";
import { buildLogoImageFilter } from "@/lib/logoFilter";
import type { BackState } from "@/lib/types";
import { PatternLayer } from "../PatternLayer";
import { QrModule } from "../QrModule";
import { CardShell, clampBox, contentRectFor, Txt } from "./shared";

type BackProps = {
  bs: BackState;
  guides?: boolean;
};

export const CardBack = forwardRef<SVGSVGElement, BackProps>(function CardBack({ bs, guides }, ref) {
  const orientation = backLayoutOrientation(bs.layout);
  const { vbW, vbH } = getCardDims(orientation);
  const { contentX, contentY, contentW, contentH } = contentRectFor(vbW, vbH);

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

  /* QR sizes capped by the SHORTER side so they never go absurdly wide. */
  const qrLarge = Math.min(Math.floor(vbH * 0.62), Math.floor(vbW * 0.62));
  const qrMed = Math.min(Math.floor(vbH * 0.48), Math.floor(vbW * 0.48));
  const qrSmall = Math.min(Math.floor(vbH * 0.30), Math.floor(vbW * 0.30));
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
    const ox = clampBox(baseOx + (bs.logoOffsetX ?? 0), w, 0, vbW);
    const yDraw = clampBox(baseOy + (bs.logoOffsetY ?? 0), hi, 0, vbH);
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

  const layouts: Record<typeof bs.layout, React.ReactNode> = {
    /* ── Landscape ──────────────────────────────────────────────────────── */
    one_qr: (() => {
      const link = selected[0] ?? allLinks[0];
      const qrSize = Math.min(Math.floor(vbH * 0.62), Math.floor(vbW * 0.42));
      const x = (vbW - qrSize) / 2;
      const topY = (vbH - qrSize) / 2 - Math.round(vbH * 0.012);
      return (
        <g key={link.id}>
          <Qr link={link} x={x} y={topY} size={qrSize} />
          <Txt
            variant="sans"
            x={vbW / 2}
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
      const qrSize = Math.min(Math.floor(vbH * 0.48), Math.floor(vbW * 0.32));
      const gap = gapLg;
      const totalW = qrSize * effectiveLinks.length + gap * (effectiveLinks.length - 1);
      const startX = (vbW - totalW) / 2;
      const topY = (vbH - qrSize) / 2 - Math.round(vbH * 0.012);
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
      const logoH = Math.round(contentH * 0.34);
      const qrSize = Math.min(Math.floor(vbH * 0.42), Math.floor(vbW * 0.22));
      const gap = gapMd;
      const totalW = qrSize * effectiveLinks.length + gap * (effectiveLinks.length - 1);
      const startX = (vbW - totalW) / 2;
      const qrBandY = contentY + Math.round(contentH * 0.42);
      return (
        <>
          <Logo
            x={vbW / 2}
            y={contentY + Math.round(contentH * 0.02)}
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
      const startX = (vbW - totalW) / 2;
      const headlineY = contentY + Math.round(contentH * 0.18);
      const qrY = contentY + Math.round(contentH * 0.42);
      return (
        <>
          <Txt
            x={vbW / 2}
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
      const startY = contentY + contentH - n * qrSize - Math.max(0, n - 1) * rowGap;
      return (
        <>
          {effectiveLinks.map((link, i) => (
            <g key={link.id}>
              <Qr link={link} x={contentX} y={startY + i * rowStep} size={qrSize} />
              <Txt
                variant="sans"
                x={contentX + qrSize + Math.round(18 * CARD_GEOM_SCALE)}
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

    /* ── Portrait ───────────────────────────────────────────────────────── */
    p_one_qr: (() => {
      /* Big QR vertically centered with a caption underneath. */
      const link = selected[0] ?? allLinks[0];
      const qrSize = qrLarge;
      const x = (vbW - qrSize) / 2;
      const topY = contentY + Math.round(contentH * 0.16) + 100;
      return (
        <g key={link.id}>
          <Qr link={link} x={x} y={topY} size={qrSize} />
          <Txt
            variant="sans"
            x={vbW / 2}
            y={topY + qrSize + Math.round(capGap * 1.4)}
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

    p_two_qr: (() => {
      /* Two QRs stacked vertically, each with a caption. */
      const qrSize = qrMed;
      const rowGap = Math.round(gapLg * 0.7);
      const totalH = qrSize * effectiveLinks.length + rowGap * (effectiveLinks.length - 1);
      const startY = contentY + (contentH - totalH) / 2;
      const x = (vbW - qrSize) / 2;
      return (
        <>
          {effectiveLinks.map((link, i) => (
            <g key={link.id}>
              <Qr link={link} x={x} y={startY + i * (qrSize + rowGap)} size={qrSize} />
              <Txt
                variant="sans"
                x={vbW / 2}
                y={startY + i * (qrSize + rowGap) + qrSize + capGap}
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

    p_logo_qr: (() => {
      /* Logo top-third, QRs centered below. */
      const logoH = Math.round(contentW * 0.42);
      const qrSize = Math.min(Math.floor(vbH * 0.36), Math.floor(vbW * 0.55));
      const gap = gapMd;
      const totalW = qrSize * effectiveLinks.length + gap * (effectiveLinks.length - 1);
      const startX = (vbW - totalW) / 2;
      const qrBandY = contentY + Math.round(contentH * 0.46);
      return (
        <>
          <Logo
            x={vbW / 2}
            y={contentY + Math.round(contentH * 0.06)}
            h={logoH}
            align="middle"
          />
          {effectiveLinks.map((link, i) => (
            <g key={link.id}>
              <Qr link={link} x={startX + i * (qrSize + gap)} y={qrBandY} size={qrSize} />
              <Txt
                variant="sans"
                x={startX + i * (qrSize + gap) + qrSize / 2}
                y={qrBandY + qrSize + Math.round(24 * CARD_GEOM_SCALE)}
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
  };

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${vbW} ${vbH}`}
      width="100%"
      height="100%"
      style={{ display: "block" }}
      data-face="back"
      data-orientation={orientation}
    >
      <CardShell fillDef={c.fill} guides={guides} bgImage={bs.bgImage} vbW={vbW} vbH={vbH}>
        <PatternLayer cfg={bs.pat} w={vbW} h={vbH} ink={c.hair} />
        {layouts[bs.layout]}
      </CardShell>
    </svg>
  );
});

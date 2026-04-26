"use client";

import { useMemo } from "react";
import {
  buildQrMatrix,
  qrMatrixToDesignPaths,
  DEFAULT_QR_DESIGN,
  type QrDesign,
} from "@/lib/qr";

type Props = {
  url: string;
  /** Top-left in SVG user units */
  x: number;
  y: number;
  /** Finished size of the QR in SVG user units (applies to both axes) */
  size: number;
  /** Foreground hex for dark modules */
  color: string;
  /** Optional background hex (e.g. to punch through the card pattern) */
  bg?: string;
  /** Granular shape design: body + eye frame + eye ball. */
  design?: QrDesign;
  /** Corner radius for the background rect as fraction of size (0..0.5). */
  bgRadius?: number;
  /** Inner padding inside the bg rect, expressed as a fraction of size. */
  quietZone?: number;
};

/**
 * A real, vector, readable QR code rendered as three SVG paths so we can
 * control each layer independently:
 *
 *   - module body  (nonzero fill, no self-intersection quirks)
 *   - eye frames   (evenodd fill so outer − inner = clean ring)
 *   - eye balls    (nonzero fill, single filled shape)
 *
 * No CSS filter tricks — we compute the module matrix with the `qrcode`
 * library and flatten it to path data in the requested shapes. Any
 * exporter sees plain vector geometry.
 */
export function QrModule({
  url,
  x,
  y,
  size,
  color,
  bg,
  design = DEFAULT_QR_DESIGN,
  bgRadius = 0.06,
  quietZone = 0,
}: Props) {
  const { modules, eyeFrames, eyeBalls, boxSize } = useMemo(() => {
    const m = buildQrMatrix(url);
    const paths = qrMatrixToDesignPaths(m, design);
    return { ...paths, boxSize: m.size };
  }, [url, design]);

  const pad = size * quietZone;
  const innerSize = size - pad * 2;

  /* Square module bodies look sharpest with crispEdges; curved shapes
   * need geometricPrecision so the anti-aliasing doesn't quantize away
   * the subtle radii. */
  const rendering = design.body === "square" ? "crispEdges" : "geometricPrecision";

  return (
    <g transform={`translate(${x} ${y})`}>
      {bg ? (
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          fill={bg}
          rx={size * bgRadius}
          ry={size * bgRadius}
        />
      ) : null}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        x={pad}
        y={pad}
        width={innerSize}
        height={innerSize}
        viewBox={`0 0 ${boxSize} ${boxSize}`}
        shapeRendering={rendering}
      >
        <path d={modules} fill={color} />
        <path d={eyeFrames} fill={color} fillRule="evenodd" />
        <path d={eyeBalls} fill={color} />
      </svg>
    </g>
  );
}

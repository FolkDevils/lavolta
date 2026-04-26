import { FLOWER_SCALE, FLOWER_SRCS } from "@/lib/constants";
import { mkRng } from "@/lib/rng";
import type { PatternConfig } from "@/lib/types";

type Props = {
  cfg: PatternConfig;
  w: number;
  h: number;
};

/**
 * Falling-flower pattern rendered as SVG <image> elements.
 *
 * The previous implementation iterated a cols×rows grid row-major and
 * broke the moment it hit `cfg.density`, which deterministically left
 * the bottom-right cells empty. It also never let flowers sit across
 * the card edge, so corners felt "stamped" rather than like a piece
 * of a larger print pattern.
 *
 * New algorithm:
 *   1. Interior pass — place one seeded candidate in every cell of the
 *      cols×rows grid, Fisher–Yates shuffle with the same seeded RNG,
 *      then truncate to `density`. Uniform distribution, no directional
 *      bias → corners get the same odds as the middle.
 *   2. Spill ring — one extra ring of cells past every edge on all four
 *      sides + corners. Always rendered; the parent `<clipPath>` trims
 *      whatever lands outside the bleed, so the pattern reads as a
 *      continuous mat instead of a contained block.
 *   3. Jitter bumped to ±45% of cell so the underlying grid is invisible.
 *   4. Per-flower size multipliers live in `FLOWER_SCALE` so
 *      art-direction is centralized and easy to tweak.
 *
 * Everything is deterministic from `cfg.seed` — identical configs always
 * render pixel-for-pixel the same pattern, which matters for export
 * repeatability.
 */
export function PatternLayer({ cfg, w, h }: Props) {
  if (!cfg.on) return null;

  const enabled: (string | false)[] = [
    cfg.f1 && FLOWER_SRCS[0],
    cfg.f2 && FLOWER_SRCS[1],
    cfg.f3 && FLOWER_SRCS[2],
  ];
  const srcs = enabled.filter(Boolean) as string[];
  if (!srcs.length) return null;

  const rng = mkRng(cfg.seed);
  const aspect = w / h;
  const cols = Math.max(2, Math.round(Math.sqrt(cfg.density * aspect)));
  const rows = Math.max(2, Math.ceil(cfg.density / cols));
  const cellW = w / cols;
  const cellH = h / rows;

  type Item = { src: string; x: number; y: number; sz: number; rot: number };

  /** Deterministic placement inside a cell centered at (cx, cy).
   *  Always advances the RNG by the same number of draws so output is
   *  stable regardless of which cells caller visits. */
  const place = (cx: number, cy: number): Item => {
    const jx = (rng() - 0.5) * cellW * 0.9;
    const jy = (rng() - 0.5) * cellH * 0.9;
    const src = srcs[Math.floor(rng() * srcs.length)];
    const scaleRand = 0.75 + rng() * 0.5;
    const rot = (rng() - 0.5) * cfg.rot;
    const flowerScale = FLOWER_SCALE[FLOWER_SRCS.indexOf(src)] ?? 1;
    return {
      src,
      x: cx + jx,
      y: cy + jy,
      sz: cfg.size * scaleRand * flowerScale,
      rot,
    };
  };

  /* ── Pass 1: interior grid ───────────────────────────────── */
  const interior: Item[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      interior.push(place((c + 0.5) * cellW, (r + 0.5) * cellH));
    }
  }
  /* Shuffle so the truncation isn't spatially biased — the bottom-right
   * corner is now just as likely to survive as the top-left. */
  for (let i = interior.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [interior[i], interior[j]] = [interior[j], interior[i]];
  }
  const visible = interior.slice(0, Math.min(cfg.density, interior.length));

  /* ── Pass 2: spill ring ──────────────────────────────────── */
  const ring: Item[] = [];
  for (let r = -1; r <= rows; r++) {
    for (let c = -1; c <= cols; c++) {
      if (c >= 0 && c < cols && r >= 0 && r < rows) continue; /* ring only */
      ring.push(place((c + 0.5) * cellW, (r + 0.5) * cellH));
    }
  }

  const items = [...visible, ...ring];

  return (
    <g opacity={cfg.opacity / 100}>
      {items.map((it, i) => (
        <image
          key={i}
          href={it.src}
          x={it.x - it.sz / 2}
          y={it.y - it.sz / 2}
          width={it.sz}
          height={it.sz}
          transform={`rotate(${it.rot.toFixed(2)} ${it.x} ${it.y})`}
          preserveAspectRatio="xMidYMid meet"
        />
      ))}
    </g>
  );
}

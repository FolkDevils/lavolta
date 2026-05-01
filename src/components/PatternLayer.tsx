import { FLOWER_SCALE } from "@/lib/constants";
import { mkRng } from "@/lib/rng";
import type { PatternConfig } from "@/lib/types";

type Props = {
  cfg: PatternConfig;
  w: number;
  h: number;
  /** Subtle mark color — pass card palette `hair` for tone-on-tone. */
  ink?: string;
};

type MotifItem = { motif: 0 | 1 | 2; x: number; y: number; sz: number; rot: number };

function PatternShape({ item, ink }: { item: MotifItem; ink: string }) {
  const { motif, x, y, sz, rot } = item;
  const sw = Math.max(0.75, sz * 0.065);
  const g = `translate(${x} ${y}) rotate(${rot.toFixed(2)})`;

  if (motif === 0) {
    return (
      <g transform={g}>
        <circle r={sz * 0.42} fill="none" stroke={ink} strokeWidth={sw} opacity={0.88} />
        <circle r={sz * 0.19} fill="none" stroke={ink} strokeWidth={sw * 0.85} opacity={0.52} />
      </g>
    );
  }
  if (motif === 1) {
    const s = sz * 0.52;
    return (
      <g transform={g}>
        <rect
          x={-s / 2}
          y={-s / 2}
          width={s}
          height={s}
          rx={sz * 0.045}
          ry={sz * 0.045}
          fill="none"
          stroke={ink}
          strokeWidth={sw}
          transform="rotate(45)"
        />
      </g>
    );
  }
  return (
    <g transform={g}>
      <ellipse rx={sz * 0.44} ry={sz * 0.24} fill="none" stroke={ink} strokeWidth={sw} opacity={0.88} />
      <circle r={sz * 0.085} fill={ink} fillOpacity={0.35} />
    </g>
  );
}

/** Evenly spaced subset of `items` (length n) — avoids random clumps when density < grid cells. */
function evenSample<T>(items: T[], n: number): T[] {
  const L = items.length;
  if (L === 0 || n <= 0) return [];
  if (n >= L) return [...items];
  const out: T[] = [];
  for (let k = 0; k < n; k++) {
    const idx = Math.min(L - 1, Math.floor(((k + 0.5) * L) / n));
    out.push(items[idx]!);
  }
  return out;
}

/**
 * Seeded scatter of simple vector motifs (La Volta–adjacent: rings, gem diamond,
 * oval “seal”) — interior grid + spill ring; tight jitter + even subsampling.
 * Rotation slider sets one shared angle (degrees) for every motif.
 */
export function PatternLayer({ cfg, w, h, ink }: Props) {
  if (!cfg.on) return null;

  const mark = ink ?? "rgba(107,30,45,0.16)";

  const enabled: (0 | 1 | 2 | false)[] = [cfg.f1 && 0, cfg.f2 && 1, cfg.f3 && 2];
  const motifs = enabled.filter((v): v is 0 | 1 | 2 => v !== false);
  if (!motifs.length) return null;

  const rng = mkRng(cfg.seed);
  const aspect = w / h;
  const cols = Math.max(2, Math.round(Math.sqrt(cfg.density * aspect)));
  const rows = Math.max(2, Math.ceil(cfg.density / cols));
  const cellW = w / cols;
  const cellH = h / rows;

  const place = (cx: number, cy: number): MotifItem => {
    const jitter = 0.28;
    const jx = (rng() - 0.5) * cellW * jitter;
    const jy = (rng() - 0.5) * cellH * jitter;
    const motif = motifs[Math.floor(rng() * motifs.length)]!;
    const scaleRand = 0.88 + rng() * 0.2;
    const rot = cfg.rot;
    const motifScale = FLOWER_SCALE[motif] ?? 1;
    return {
      motif,
      x: cx + jx,
      y: cy + jy,
      sz: cfg.size * scaleRand * motifScale,
      rot,
    };
  };

  const interior: MotifItem[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      interior.push(place((c + 0.5) * cellW, (r + 0.5) * cellH));
    }
  }
  const visible = evenSample(interior, Math.min(cfg.density, interior.length));

  const ring: MotifItem[] = [];
  for (let r = -1; r <= rows; r++) {
    for (let c = -1; c <= cols; c++) {
      if (c >= 0 && c < cols && r >= 0 && r < rows) continue;
      ring.push(place((c + 0.5) * cellW, (r + 0.5) * cellH));
    }
  }

  const items = [...visible, ...ring];

  return (
    <g opacity={cfg.opacity / 100}>
      {items.map((it, i) => (
        <PatternShape key={i} item={it} ink={mark} />
      ))}
    </g>
  );
}

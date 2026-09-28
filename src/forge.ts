import { DiamondField, type Grid } from './ascii';

/*
 * The custom-systems visual: one point cloud that keeps re-forming into a
 * different object, drawn as the hero's diamond matrix.
 */

const N = 4600;
const HOLD = 2.4;
const MORPH = 1.5;
const GOLD = 2.399963229728653;

type Shape = { name: string; build: (i: number, out: Float32Array) => void };

const frac = (x: number) => x - Math.floor(x);
const hash = (i: number) => frac(Math.sin(i * 91.345) * 47453.5453);

const SHAPES: Shape[] = [
  {
    name: 'Sphere',
    build: (i, o) => {
      const y = 1 - (2 * (i + 0.5)) / N;
      const r = Math.sqrt(1 - y * y);
      const a = i * GOLD;
      o[0] = Math.cos(a) * r * 0.92;
      o[1] = y * 0.92;
      o[2] = Math.sin(a) * r * 0.92;
    },
  },
  {
    name: 'Lattice',
    build: (i, o) => {
      // Edges of a cube plus the diagonals of its faces.
      const e = i % 18;
      const t = frac(i * 0.6180339) * 2 - 1;
      const s = 0.66;
      const edges: [number, number, number][] = [
        [t, -1, -1], [t, 1, -1], [t, -1, 1], [t, 1, 1],
        [-1, t, -1], [1, t, -1], [-1, t, 1], [1, t, 1],
        [-1, -1, t], [1, -1, t], [-1, 1, t], [1, 1, t],
        [t, t, 1], [t, -t, -1], [1, t, t], [-1, t, -t], [t, 1, t], [t, -1, -t],
      ];
      const p = edges[e];
      o[0] = p[0] * s;
      o[1] = p[1] * s;
      o[2] = p[2] * s;
    },
  },
  {
    name: 'Torus',
    build: (i, o) => {
      const a = frac(i * 0.6180339) * Math.PI * 2;
      const b = frac(i * 0.7548776) * Math.PI * 2;
      const R = 0.72;
      const r = 0.3;
      o[0] = (R + r * Math.cos(b)) * Math.cos(a);
      o[1] = r * Math.sin(b);
      o[2] = (R + r * Math.cos(b)) * Math.sin(a);
    },
  },
  {
    name: 'Gear',
    build: (i, o) => {
      const a = frac(i * 0.6180339) * Math.PI * 2;
      const k = frac(i * 0.7548776);
      const tooth = Math.cos(a * 12) > 0.1 ? 1 : 0;
      const outer = 0.74 + tooth * 0.16;
      if (i % 5 < 3) {
        // Rim, including the tooth flanks.
        o[0] = Math.cos(a) * outer;
        o[1] = Math.sin(a) * outer;
        o[2] = (k - 0.5) * 0.34;
      } else {
        // Faces: an annulus with a hub.
        const rr = i % 5 === 3 ? 0.2 + k * (outer - 0.2) : 0.2;
        o[0] = Math.cos(a) * rr;
        o[1] = Math.sin(a) * rr;
        o[2] = (i % 2 ? 0.17 : -0.17);
      }
    },
  },
  {
    name: 'Helix',
    build: (i, o) => {
      const t = (i + 0.5) / N;
      if (i % 7 === 0) {
        // Rungs between the two strands.
        const step = Math.floor(t * 22) / 22;
        const a = step * Math.PI * 6;
        const k = frac(i * 0.6180339) * 2 - 1;
        o[0] = Math.cos(a) * 0.42 * k;
        o[1] = (step - 0.5) * 1.9;
        o[2] = Math.sin(a) * 0.42 * k;
        return;
      }
      const a = t * Math.PI * 6 + (i % 2) * Math.PI;
      const j = (hash(i) - 0.5) * 0.05;
      o[0] = Math.cos(a) * 0.42 + j;
      o[1] = (t - 0.5) * 1.9;
      o[2] = Math.sin(a) * 0.42 + j;
    },
  },
];

const POINTS = SHAPES.map((s) => {
  const arr = new Float32Array(N * 3);
  const o = new Float32Array(3);
  for (let i = 0; i < N; i++) {
    s.build(i, o);
    arr.set(o, i * 3);
  }
  return arr;
});
const STAGGER = Float32Array.from({ length: N }, (_, i) => hash(i + 17));

export function mountForge(canvas: HTMLCanvasElement): void {
  let acc = new Float32Array(1);

  const sample = (g: Grid, time: number, out: Float32Array) => {
    if (acc.length !== out.length) acc = new Float32Array(out.length);
    acc.fill(0);
    const { cols, rows, cw, ch, width, height } = g;
    const narrow = width < 768;
    const cx = narrow ? width / 2 : width * 0.74;
    const cy = narrow ? height * 0.26 : height * 0.5;
    const scale = narrow ? Math.min(width * 0.3, height * 0.17) : Math.min(width * 0.145, height * 0.26);
    // Keep brightness independent of how many points land in each cell.
    const gain = Math.min(1.4, (scale * scale) / (cw * ch) / 546);

    const cycle = HOLD + MORPH;
    const k = Math.floor(time / cycle);
    const local = time - k * cycle;
    const from = POINTS[k % SHAPES.length];
    const to = POINTS[(k + 1) % SHAPES.length];
    const m = Math.max(0, (local - HOLD) / MORPH);

    const ry = time * 0.32;
    const rx = 0.42 + Math.sin(time * 0.21) * 0.12;
    const cyR = Math.cos(ry);
    const syR = Math.sin(ry);
    const cxR = Math.cos(rx);
    const sxR = Math.sin(rx);

    for (let i = 0; i < N; i++) {
      let t = (m * 1.35 - STAGGER[i] * 0.35);
      t = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
      const o = i * 3;
      // Points bow outward mid-morph, so the form dissolves rather than slides.
      const burst = Math.sin(t * Math.PI) * 0.18;
      let x = from[o] + (to[o] - from[o]) * t;
      let y = from[o + 1] + (to[o + 1] - from[o + 1]) * t;
      let z = from[o + 2] + (to[o + 2] - from[o + 2]) * t;
      x *= 1 + burst;
      y *= 1 + burst;
      z *= 1 + burst;

      const x1 = x * cyR + z * syR;
      const z1 = -x * syR + z * cyR;
      const y1 = y * cxR - z1 * sxR;
      const z2 = y * sxR + z1 * cxR;

      const p = 3.4 / (3.4 - z2);
      const sx = cx + x1 * scale * p;
      const sy = cy - y1 * scale * p;
      const c = Math.floor(sx / cw);
      const r = Math.floor(sy / ch);
      if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
      acc[r * cols + c] += (0.3 + 0.45 * (z2 * 0.5 + 0.5)) * gain;
    }

    // A faint orbit ring around the form.
    const ringR = scale * 1.42;
    for (let j = 0; j < 180; j++) {
      const a = (j / 180) * Math.PI * 2;
      const sx = cx + Math.cos(a) * ringR;
      const sy = cy + Math.sin(a) * ringR * 0.3;
      const c = Math.floor(sx / cw);
      const r = Math.floor(sy / ch);
      if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
      const lit = frac(j / 180 - time * 0.06) < 0.08 ? 0.55 : 0.12;
      acc[r * cols + c] = Math.max(acc[r * cols + c], lit);
    }

    for (let i = 0; i < out.length; i++) out[i] = acc[i] > 0 ? 1 - Math.exp(-acc[i] * 1.15) : 0;
  };

  new DiamondField(canvas, {
    cell: (w) => (w < 768 ? [7, 9] : [8, 10]),
    sample,
  });
}

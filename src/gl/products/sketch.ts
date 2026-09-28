import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

export type Style = 'frame' | 'faint' | 'base' | 'strong' | 'dash';

export const STYLES: Style[] = ['frame', 'faint', 'base', 'strong', 'dash'];

/** Reveal window per style, as [start, end] of the 0..1 reveal progress. */
const REVEAL: Record<Style, [number, number]> = {
  frame: [0, 0.45],
  faint: [0.1, 0.7],
  base: [0.2, 0.8],
  strong: [0.35, 0.9],
  dash: [0.5, 1],
};

export function createMaterials(): Record<Style, LineMaterial> {
  const make = (color: number, opacity: number, linewidth: number, dashed = false) =>
    new LineMaterial({
      color,
      opacity,
      linewidth,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      dashed,
      dashSize: 0.06,
      gapSize: 0.055,
      dashScale: 1,
    });
  return {
    frame: make(0xc8c8ce, 0.55, 1),
    faint: make(0x9a9aa3, 0.34, 1),
    base: make(0xc8c8ce, 0.62, 1),
    strong: make(0xffffff, 0.95, 1.35),
    dash: make(0xc8c8ce, 0.55, 1, true),
  };
}

type P2 = [number, number];

/**
 * Accumulates line segments in a product's local 3D space. 2D helpers draw
 * on a plane at depth `z`; `seg` draws anywhere.
 */
export class Sketch {
  private readonly buckets: Record<Style, number[]> = { frame: [], faint: [], base: [], strong: [], dash: [] };
  private readonly lines: { style: Style; line: LineSegments2; count: number }[] = [];
  z = 0;

  seg(s: Style, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): void {
    this.buckets[s].push(x1, y1, z1, x2, y2, z2);
  }

  line(s: Style, x1: number, y1: number, x2: number, y2: number): void {
    this.seg(s, x1, y1, this.z, x2, y2, this.z);
  }

  poly(s: Style, pts: P2[], closed = false): void {
    for (let i = 0; i < pts.length - 1; i++) this.line(s, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    if (closed && pts.length > 2) this.line(s, pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1]);
  }

  arc(s: Style, cx: number, cy: number, r: number, a0: number, a1: number, steps?: number): void {
    const n = steps ?? Math.max(6, Math.ceil((Math.abs(a1 - a0) * r) / 0.03));
    const pts: P2[] = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    this.poly(s, pts);
  }

  circle(s: Style, cx: number, cy: number, r: number, steps?: number): void {
    this.arc(s, cx, cy, r, 0, Math.PI * 2, steps);
  }

  rect(s: Style, x0: number, y0: number, x1: number, y1: number, r = 0): void {
    if (r <= 0) {
      this.poly(s, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], true);
      return;
    }
    const h = Math.PI / 2;
    this.line(s, x0 + r, y0, x1 - r, y0);
    this.arc(s, x1 - r, y0 + r, r, -h, 0, 6);
    this.line(s, x1, y0 + r, x1, y1 - r);
    this.arc(s, x1 - r, y1 - r, r, 0, h, 6);
    this.line(s, x1 - r, y1, x0 + r, y1);
    this.arc(s, x0 + r, y1 - r, r, h, 2 * h, 6);
    this.line(s, x0, y1 - r, x0, y0 + r);
    this.arc(s, x0 + r, y0 + r, r, 2 * h, 3 * h, 6);
  }

  /** Corner brackets around a box, the "focus" mark. */
  brackets(s: Style, x0: number, y0: number, x1: number, y1: number, len = 0.08): void {
    this.poly(s, [[x0, y0 + len], [x0, y0], [x0 + len, y0]]);
    this.poly(s, [[x1 - len, y0], [x1, y0], [x1, y0 + len]]);
    this.poly(s, [[x1, y1 - len], [x1, y1], [x1 - len, y1]]);
    this.poly(s, [[x0 + len, y1], [x0, y1], [x0, y1 - len]]);
  }

  /** Small outlined triangle marker pointing along `angle`. */
  marker(s: Style, x: number, y: number, size = 0.045, angle = Math.PI): void {
    const pts: P2[] = [0, 2.35, -2.35].map((a) => [x + Math.cos(angle + a) * size, y + Math.sin(angle + a) * size]);
    this.poly(s, pts, true);
  }

  /** Short horizontal bars standing in for lines of text. */
  text(s: Style, x: number, y: number, widths: number[], gap = 0.075): void {
    widths.forEach((w, i) => this.line(s, x, y - i * gap, x + w, y - i * gap));
  }

  /** Dashed connector along local Z between two planes, with markers. */
  connector(x: number, y: number, zFrom: number, zTo: number, markAt: number[] = []): void {
    this.seg('dash', x, y, zFrom, x, y, zTo);
    const prev = this.z;
    for (const z of markAt) {
      this.z = z;
      this.marker('base', x, y, 0.04, Math.PI / 2);
    }
    this.z = prev;
  }

  /** Iso-lines of `f` over a rectangle via marching squares. */
  contours(
    s: Style,
    f: (x: number, y: number) => number,
    box: [number, number, number, number],
    levels: number[],
    res: [number, number] = [90, 62],
  ): void {
    const [x0, y0, x1, y1] = box;
    const [nx, ny] = res;
    const dx = (x1 - x0) / nx;
    const dy = (y1 - y0) / ny;
    const v = new Float32Array((nx + 1) * (ny + 1));
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) v[j * (nx + 1) + i] = f(x0 + i * dx, y0 + j * dy);

    for (const lv of levels) {
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const a = v[j * (nx + 1) + i];
          const b = v[j * (nx + 1) + i + 1];
          const c = v[(j + 1) * (nx + 1) + i + 1];
          const d = v[(j + 1) * (nx + 1) + i];
          const idx = (a > lv ? 1 : 0) | (b > lv ? 2 : 0) | (c > lv ? 4 : 0) | (d > lv ? 8 : 0);
          if (idx === 0 || idx === 15) continue;
          const px = x0 + i * dx;
          const py = y0 + j * dy;
          const e = [
            [px + dx * ((lv - a) / (b - a)), py],
            [px + dx, py + dy * ((lv - b) / (c - b))],
            [px + dx * ((lv - d) / (c - d)), py + dy],
            [px, py + dy * ((lv - a) / (d - a))],
          ] as P2[];
          const pairs = SEGMENTS[idx];
          for (let k = 0; k < pairs.length; k += 2) {
            const p = e[pairs[k]];
            const q = e[pairs[k + 1]];
            this.line(s, p[0], p[1], q[0], q[1]);
          }
        }
      }
    }
  }

  build(parent: THREE.Object3D, materials: Record<Style, LineMaterial>): void {
    for (const style of STYLES) {
      const data = this.buckets[style];
      if (!data.length) continue;
      const geometry = new LineSegmentsGeometry();
      geometry.setPositions(data);
      const line = new LineSegments2(geometry, materials[style]);
      if (style === 'dash') line.computeLineDistances();
      line.frustumCulled = false;
      parent.add(line);
      this.lines.push({ style, line, count: data.length / 6 });
    }
  }

  reveal(progress: number): void {
    for (const { style, line, count } of this.lines) {
      const [a, b] = REVEAL[style];
      const t = THREE.MathUtils.clamp((progress - a) / (b - a), 0, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      (line.geometry as LineSegmentsGeometry).instanceCount = Math.round(count * eased);
      line.visible = t > 0;
    }
  }
}

/* Marching-squares edge pairs per case; edges are 0 bottom, 1 right, 2 top, 3 left. */
const SEGMENTS: number[][] = [
  [], [3, 0], [0, 1], [3, 1], [1, 2], [3, 2, 0, 1], [0, 2], [3, 2],
  [2, 3], [0, 2], [0, 3, 1, 2], [1, 2], [1, 3], [0, 1], [3, 0], [],
];

/**
 * A fixed-capacity line set rewritten every frame, for moving parts such as
 * waveforms and rotating gears.
 */
export class LiveLines {
  readonly line: LineSegments2;
  private readonly array: Float32Array;
  private readonly geometry: LineSegmentsGeometry;
  private cursor = 0;
  /** Extra opacity multiplier, honoured when the lines own their material. */
  fade = 1;

  constructor(
    readonly capacity: number,
    material: LineMaterial,
  ) {
    this.geometry = new LineSegmentsGeometry();
    this.geometry.setPositions(new Float32Array(capacity * 6));
    this.array = (this.geometry.attributes.instanceStart as THREE.InterleavedBufferAttribute).data.array as Float32Array;
    this.line = new LineSegments2(this.geometry, material);
    this.line.frustumCulled = false;
  }

  begin(): void {
    this.cursor = 0;
  }

  seg(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): void {
    if (this.cursor >= this.capacity) return;
    const o = this.cursor * 6;
    const a = this.array;
    a[o] = x1;
    a[o + 1] = y1;
    a[o + 2] = z1;
    a[o + 3] = x2;
    a[o + 4] = y2;
    a[o + 5] = z2;
    this.cursor++;
  }

  end(): void {
    const data = (this.geometry.attributes.instanceStart as THREE.InterleavedBufferAttribute).data;
    data.needsUpdate = true;
    this.geometry.instanceCount = this.cursor;
  }
}

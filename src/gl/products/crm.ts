import type * as THREE from 'three';
import { LiveLines } from './sketch';
import { Product, Z, alongPath, gauss, range, seeded } from './product';

type P = [number, number];

const HUBS: P[] = [
  [-0.95, 0.3],
  [0.55, -0.3],
  [1.2, 0.72],
];
const FOCUS_CARD: P = [0.45, 0.38];
const RING: P = [-1.02, 0.42];

/**
 * 02 — AI-native CRM. Front: the relationship graph and intent field.
 * Middle: a pipeline board with a deal advancing. Back: account intelligence.
 */
export class CrmProduct extends Product {
  private readonly score: LiveLines;
  private readonly ghost: LiveLines;
  private readonly halo: LiveLines;
  private readonly tokens: { mesh: THREE.Mesh; path: P[]; speed: number; offset: number }[] = [];

  constructor() {
    super();
    const s = this.sketch;
    const rand = seeded(7);

    // Front plane: intent field and the graph on top of it.
    this.frame(0);
    const field = (x: number, y: number) =>
      gauss(x, y, HUBS[0][0], HUBS[0][1], 0.75, 0.6) * 0.9 +
      gauss(x, y, HUBS[1][0], HUBS[1][1], 0.6, 0.5) +
      gauss(x, y, HUBS[2][0], HUBS[2][1], 0.45, 0.4) * 0.7;
    s.contours('faint', field, [-1.82, -1.22, 1.82, 1.22], range(0.14, 0.9, 0.11), [100, 68]);

    const nodes: { p: P; hub: number; r: number }[] = [];
    HUBS.forEach((h, hi) => {
      const count = [10, 9, 6][hi];
      for (let i = 0; i < count; i++) {
        const a = rand() * Math.PI * 2;
        const d = 0.28 + rand() * [0.55, 0.5, 0.35][hi];
        const p: P = [h[0] + Math.cos(a) * d * 1.2, h[1] + Math.sin(a) * d * 0.85];
        if (Math.abs(p[0]) > 1.8 || Math.abs(p[1]) > 1.2) continue;
        nodes.push({ p, hub: hi, r: 0.022 + rand() * 0.028 });
      }
    });
    s.z = Z[0];
    for (const n of nodes) {
      s.line('faint', n.p[0], n.p[1], HUBS[n.hub][0], HUBS[n.hub][1]);
      s.circle('base', n.p[0], n.p[1], n.r, 14);
    }
    for (let i = 0; i < nodes.length; i += 3) {
      const a = nodes[i];
      const b = nodes[(i + 7) % nodes.length];
      if (a.hub !== b.hub) s.line('faint', a.p[0], a.p[1], b.p[0], b.p[1]);
    }
    s.line('base', HUBS[0][0], HUBS[0][1], HUBS[1][0], HUBS[1][1]);
    s.line('base', HUBS[1][0], HUBS[1][1], HUBS[2][0], HUBS[2][1]);
    for (const h of HUBS) {
      s.circle('strong', h[0], h[1], 0.075);
      s.circle('faint', h[0], h[1], 0.16);
    }

    // Middle plane: pipeline board.
    this.frame(1);
    s.z = Z[1];
    const cols = [-1.75, -0.85, 0.05, 0.95];
    const counts = [4, 3, 3, 2];
    cols.forEach((x, ci) => {
      s.text('base', x, 1.05, [0.34]);
      s.circle('faint', x + 0.72, 1.05, 0.035, 12);
      s.rect('faint', x - 0.03, -1.16, x + 0.83, 0.93, 0.06);
      for (let k = 0; k < counts[ci]; k++) {
        const y = 0.84 - k * 0.42;
        const focus = ci === 2 && k === 1;
        s.rect(focus ? 'strong' : 'base', x + 0.03, y - 0.32, x + 0.77, y, 0.04);
        s.circle('faint', x + 0.13, y - 0.1, 0.04, 12);
        s.text('faint', x + 0.22, y - 0.08, [0.4, 0.26]);
        s.line('faint', x + 0.1, y - 0.26, x + 0.1 + 0.55 * (0.3 + 0.2 * k + 0.15 * ci), y - 0.26);
      }
    });
    s.brackets('strong', FOCUS_CARD[0] - 0.42, FOCUS_CARD[1] - 0.25, FOCUS_CARD[0] + 0.42, FOCUS_CARD[1] + 0.13, 0.08);

    // Back plane: account intelligence.
    this.frame(2);
    s.z = Z[2];
    s.circle('faint', RING[0], RING[1], 0.5);
    s.circle('faint', RING[0], RING[1], 0.37);
    for (let k = 0; k < 36; k++) {
      const a = (k / 36) * Math.PI * 2;
      s.line('faint', RING[0] + Math.cos(a) * 0.53, RING[1] + Math.sin(a) * 0.53, RING[0] + Math.cos(a) * 0.58, RING[1] + Math.sin(a) * 0.58);
    }
    s.line('faint', -0.2, 0.05, 1.7, 0.05);
    s.line('faint', -0.2, 0.05, -0.2, 0.95);
    const trend: P[] = [];
    for (let i = 0; i <= 24; i++) {
      const x = -0.2 + (i / 24) * 1.3;
      trend.push([x, 0.2 + i * 0.022 + Math.sin(i * 1.3) * 0.06]);
    }
    s.poly('base', trend);
    const last = trend[trend.length - 1];
    s.seg('dash', last[0], last[1], Z[2], 1.7, 0.9, Z[2]);
    s.circle('strong', last[0], last[1], 0.03, 12);
    [-0.35, -0.62, -0.89].forEach((y, i) => {
      s.rect(i === 0 ? 'strong' : 'base', -1.72, y - 0.07, -1.58, y + 0.07, 0.02);
      s.text(i === 0 ? 'base' : 'faint', -1.46, y + 0.025, [[1.5, 1.1, 1.3][i], [0.9, 0.7, 0.8][i]], 0.06);
    });

    for (const h of HUBS.slice(0, 2)) s.connector(h[0], h[1], Z[0], Z[2] - 0.25, [Z[1], Z[2]]);
    s.connector(FOCUS_CARD[0], FOCUS_CARD[1] - 0.06, Z[0], Z[2] - 0.25, [Z[1], Z[2]]);
    s.connector(RING[0], RING[1] + 0.5, Z[0], Z[2] - 0.25, [Z[2]]);

    this.build();

    this.score = this.live(90, 'strong');
    this.ghost = this.live(40, 'base', true);
    this.halo = this.live(48, 'base', true);

    // Signals travelling between accounts and their hubs.
    for (let i = 0; i < 7; i++) {
      const n = nodes[(i * 5) % nodes.length];
      const mesh = this.disc(0.022);
      this.tokens.push({ mesh, path: [n.p, HUBS[n.hub]], speed: 0.25 + (i % 3) * 0.08, offset: i * 0.37 });
    }
    const main = this.disc(0.03);
    this.tokens.push({ mesh: main, path: [HUBS[0], HUBS[1], HUBS[2]], speed: 0.14, offset: 0 });

    this.label('ARCSCALE', [HUBS[0][0] - 0.2, HUBS[0][1] + 0.26, Z[0]], 0.5, { tone: 'bright' });
    this.label('INTENT 0.92', [FOCUS_CARD[0] - 0.42, FOCUS_CARD[1] + 0.26, Z[1]], 0.6, { tone: 'bright' });
    this.label('QUALIFY → PROPOSAL', [0.05, -1.3, Z[1]], 0.65);
    this.label('92', [RING[0] - 0.1, RING[1] - 0.04, Z[2]], 0.7, { tone: 'bright' });
    this.label('FORECAST +18%', [0.9, 1.08, Z[2]], 0.75);
    this.label('NEXT BEST ACTION', [-1.72, -0.16, Z[2]], 0.78);
    this.label('0110', [HUBS[1][0], HUBS[1][1], Z[2] - 0.3], 0.86, { side: 'right' });
    this.label('1011', [FOCUS_CARD[0], FOCUS_CARD[1] - 0.06, Z[2] - 0.3], 0.9, { side: 'right' });
  }

  tick(t: number): void {
    // Score ring fills to 92 and breathes.
    const sc = this.score;
    sc.begin();
    const fill = 0.92 + Math.sin(t * 0.8) * 0.012;
    const n = 88;
    for (let k = 0; k < n; k++) {
      const a = Math.PI / 2 - (k / n) * fill * Math.PI * 2;
      const b = Math.PI / 2 - ((k + 1) / n) * fill * Math.PI * 2;
      sc.seg(RING[0] + Math.cos(a) * 0.435, RING[1] + Math.sin(a) * 0.435, Z[2], RING[0] + Math.cos(b) * 0.435, RING[1] + Math.sin(b) * 0.435, Z[2]);
    }
    sc.end();

    // A deal card sliding from Qualify to Proposal on a loop.
    const g = this.ghost;
    g.begin();
    const cyc = (t * 0.22) % 1;
    const move = Math.min(1, Math.max(0, (cyc - 0.2) / 0.5));
    const e = move * move * (3 - 2 * move);
    const x0 = -0.82 + e * 0.9;
    const y0 = 0.42 - 0.84 + Math.sin(e * Math.PI) * 0.22;
    const corners: P[] = [[x0, y0 - 0.32], [x0 + 0.74, y0 - 0.32], [x0 + 0.74, y0], [x0, y0]];
    for (let k = 0; k < 4; k++) {
      const p = corners[k];
      const q = corners[(k + 1) % 4];
      g.seg(p[0], p[1], Z[1] + 0.12, q[0], q[1], Z[1] + 0.12);
    }
    g.seg(x0 + 0.1, y0 - 0.09, Z[1] + 0.12, x0 + 0.5, y0 - 0.09, Z[1] + 0.12);
    g.end();
    g.fade = Math.sin(Math.min(1, cyc / 0.9) * Math.PI);

    // Intent halo expanding from the focus hub.
    const h = this.halo;
    h.begin();
    const ph = (t * 0.45) % 1;
    const r = 0.1 + ph * 0.45;
    for (let k = 0; k < 48; k++) {
      const a = (k / 48) * Math.PI * 2;
      const b = ((k + 1) / 48) * Math.PI * 2;
      h.seg(HUBS[1][0] + Math.cos(a) * r, HUBS[1][1] + Math.sin(a) * r * 0.9, Z[0], HUBS[1][0] + Math.cos(b) * r, HUBS[1][1] + Math.sin(b) * r * 0.9, Z[0]);
    }
    h.end();
    h.fade = 1 - ph;

    for (const tok of this.tokens) alongPath(tok.mesh, tok.path, Z[0], ((t * tok.speed + tok.offset) % 1.25) / 1.0);
  }
}

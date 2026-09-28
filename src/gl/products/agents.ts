import type * as THREE from 'three';
import { LiveLines } from './sketch';
import { Product, Z, alongPath, range } from './product';

type P = [number, number];

const NODE = { w: 0.28, h: 0.12 };
const NODES: Record<string, P> = {
  intake: [-1.5, 0],
  plan: [-0.72, 0],
  retrieve: [0.1, 0.62],
  erp: [0.1, 0],
  crm: [0.1, -0.62],
  verify: [0.9, 0],
  respond: [1.6, 0],
};
const EDGES: [string, string][] = [
  ['intake', 'plan'],
  ['plan', 'retrieve'],
  ['plan', 'erp'],
  ['plan', 'crm'],
  ['retrieve', 'verify'],
  ['erp', 'verify'],
  ['crm', 'verify'],
  ['verify', 'respond'],
];
const SPANS: { x0: number; x1: number; y: number; strong?: boolean }[] = [
  { x0: -1.7, x1: 1.7, y: 0.72 },
  { x0: -1.7, x1: -0.95, y: 0.46 },
  { x0: -0.95, x1: -0.1, y: 0.2 },
  { x0: -0.45, x1: 0.55, y: -0.06, strong: true },
  { x0: 0.05, x1: 0.95, y: -0.32 },
  { x0: 0.95, x1: 1.4, y: -0.58 },
  { x0: 1.4, x1: 1.7, y: -0.84 },
];

/** Orthogonal route between two nodes with a mid-way elbow. */
function route(a: P, b: P): P[] {
  const ax = a[0] + NODE.w;
  const bx = b[0] - NODE.w;
  if (Math.abs(a[1] - b[1]) < 1e-3) return [[ax, a[1]], [bx, b[1]]];
  const mx = (ax + bx) / 2;
  return [[ax, a[1]], [mx, a[1]], [mx, b[1]], [bx, b[1]]];
}

/**
 * 03 — Agentic workflows and chat. Front: the agent's plan as a graph.
 * Middle: the conversation. Back: the execution trace.
 */
export class AgentsProduct extends Product {
  private readonly typing: LiveLines;
  private readonly playhead: LiveLines;
  private readonly tokens: { mesh: THREE.Mesh; path: P[]; speed: number; offset: number }[] = [];

  constructor() {
    super();
    const s = this.sketch;

    // Front plane: workflow graph over a dot grid.
    this.frame(0);
    s.z = Z[0];
    for (const x of range(-1.7, 1.7, 0.34)) {
      for (const y of range(-1.1, 1.1, 0.275)) {
        s.line('faint', x - 0.018, y, x + 0.018, y);
        s.line('faint', x, y - 0.018, x, y + 0.018);
      }
    }
    for (const [a, b] of EDGES) {
      const path = route(NODES[a], NODES[b]);
      s.poly('base', path);
      const end = path[path.length - 1];
      s.marker('base', end[0] - 0.03, end[1], 0.035, 0);
    }
    for (const [name, [x, y]] of Object.entries(NODES)) {
      const hot = name === 'erp' || name === 'plan';
      s.rect(hot ? 'strong' : 'base', x - NODE.w, y - NODE.h, x + NODE.w, y + NODE.h, 0.05);
      s.circle('faint', x - NODE.w + 0.08, y, 0.035, 12);
      s.text('faint', x - NODE.w + 0.15, y + 0.02, [0.3, 0.2], 0.05);
    }
    const v = NODES.verify;
    const p = NODES.plan;
    s.seg('dash', v[0], v[1] + NODE.h, Z[0], v[0], 0.98, Z[0]);
    s.seg('dash', v[0], 0.98, Z[0], p[0], 0.98, Z[0]);
    s.seg('dash', p[0], 0.98, Z[0], p[0], p[1] + NODE.h, Z[0]);
    s.marker('base', p[0], p[1] + NODE.h + 0.04, 0.035, -Math.PI / 2);

    // Middle plane: the chat.
    this.frame(1);
    s.z = Z[1];
    s.line('faint', -1.95, 0.98, 1.95, 0.98);
    for (let i = 0; i < 3; i++) s.circle('faint', -1.78 + i * 0.1, 1.15, 0.028, 10);
    s.text('faint', -0.3, 1.16, [0.6]);
    s.rect('base', 0.2, 0.46, 1.72, 0.84, 0.1);
    s.text('base', 0.34, 0.72, [1.1, 0.7], 0.12);
    s.rect('base', -1.72, -0.5, 0.75, 0.34, 0.1);
    s.text('base', -1.58, 0.21, [1.9, 1.5, 1.7], 0.11);
    s.rect('strong', -1.58, -0.38, -0.1, -0.13, 0.05);
    s.circle('faint', -1.47, -0.255, 0.045, 12);
    s.text('faint', -1.36, -0.225, [0.8, 0.55], 0.07);
    s.rect('base', -1.72, -1.16, 1.72, -0.84, 0.16);
    s.text('faint', -1.52, -1.0, [1.2]);
    s.marker('strong', 1.52, -1.0, 0.06, 0);

    // Back plane: execution trace.
    this.frame(2);
    s.z = Z[2];
    s.line('faint', -1.7, 1.0, 1.7, 1.0);
    range(-1.7, 1.7, 0.17).forEach((x, i) => s.line('faint', x, 1.0, x, i % 4 === 0 ? 1.07 : 1.04));
    for (const sp of SPANS) {
      s.rect(sp.strong ? 'strong' : 'base', sp.x0, sp.y - 0.07, sp.x1, sp.y + 0.07, 0.03);
      s.line('faint', sp.x0 + 0.05, sp.y, sp.x0 + Math.min(0.45, (sp.x1 - sp.x0) * 0.6), sp.y);
    }
    s.line('faint', -1.7, -1.05, 1.7, -1.05);

    s.connector(NODES.erp[0], NODES.erp[1], Z[0], Z[2] - 0.25, [Z[1], Z[2]]);
    s.connector(NODES.crm[0], NODES.crm[1], Z[0], Z[2] - 0.25, [Z[2]]);
    s.connector(NODES.plan[0], NODES.plan[1], Z[0], Z[2] - 0.25, [Z[1], Z[2]]);
    s.connector(NODES.respond[0], 0.62, Z[0], Z[2] - 0.25, [Z[1]]);

    this.build();

    this.typing = this.live(60, 'base');
    this.playhead = this.live(8, 'strong');

    const lanes = ['retrieve', 'erp', 'crm'];
    lanes.forEach((lane, i) => {
      const path = [
        ...route(NODES.intake, NODES.plan),
        ...route(NODES.plan, NODES[lane]),
        ...route(NODES[lane], NODES.verify),
        ...route(NODES.verify, NODES.respond),
      ];
      this.tokens.push({ mesh: this.disc(0.026), path, speed: 0.16, offset: i / 3 });
    });

    this.label('PLAN', [NODES.plan[0] - 0.28, NODES.plan[1] + 0.26, Z[0]], 0.5, { tone: 'bright' });
    this.label('TOOL · ANY SYSTEM', [NODES.erp[0] - 0.28, NODES.erp[1] - 0.26, Z[0]], 0.56);
    this.label('SELF-CHECK', [0.0, 1.1, Z[0]], 0.6);
    this.label('AGENT', [-1.72, 0.44, Z[1]], 0.62);
    this.label('TRACE 0.84S', [-1.7, 1.18, Z[2]], 0.7);
    this.label('0100', [NODES.erp[0], NODES.erp[1], Z[2] - 0.3], 0.84, { side: 'right' });
    this.label('1110', [NODES.plan[0], NODES.plan[1], Z[2] - 0.3], 0.88, { side: 'right' });
  }

  tick(t: number): void {
    const ty = this.typing;
    ty.begin();
    for (let i = 0; i < 3; i++) {
      const cx = -1.55 + i * 0.1;
      const cy = -0.7 + Math.max(0, Math.sin(t * 5 - i * 0.7)) * 0.04;
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        const b = ((k + 1) / 14) * Math.PI * 2;
        ty.seg(cx + Math.cos(a) * 0.028, cy + Math.sin(a) * 0.028, Z[1], cx + Math.cos(b) * 0.028, cy + Math.sin(b) * 0.028, Z[1]);
      }
    }
    ty.end();

    const ph = this.playhead;
    ph.begin();
    const x = -1.7 + ((t * 0.28) % 1) * 3.4;
    ph.seg(x, -1.05, Z[2], x, 1.0, Z[2]);
    ph.seg(x - 0.04, 1.06, Z[2], x + 0.04, 1.06, Z[2]);
    ph.seg(x - 0.04, 1.06, Z[2], x, 1.0, Z[2]);
    ph.seg(x + 0.04, 1.06, Z[2], x, 1.0, Z[2]);
    ph.end();

    for (const tok of this.tokens) alongPath(tok.mesh, tok.path, Z[0], (t * tok.speed + tok.offset) % 1);
  }
}

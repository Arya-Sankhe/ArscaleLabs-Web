/*
 * Small isometric stacks for the compare cards. Each is drawn flat in plane
 * coordinates (x in -1..1, y in -0.7..0.7) and projected by one SVG matrix.
 */

type Kind = 'machine' | 'crm' | 'agents';

const S = 80;
const CX = 160;
const CY = 120;
const ISO = `matrix(${0.866 * S} ${0.5 * S} ${-0.866 * S} ${0.5 * S} ${CX} ${CY})`;

const n = (v: number) => +v.toFixed(3);
const pts = (p: [number, number][]) => p.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');
const line = (c: string, x1: number, y1: number, x2: number, y2: number) =>
  `<line class="${c}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`;
const rect = (c: string, x: number, y: number, w: number, h: number, r = 0.03) =>
  `<rect class="${c}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${r}"/>`;
const circle = (c: string, x: number, y: number, r: number) => `<circle class="${c}" cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`;
const poly = (c: string, p: [number, number][]) => `<polyline class="${c}" points="${pts(p)}"/>`;

function wave(x0: number, x1: number, y: number, amp: number, f: (t: number) => number, steps = 60): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return [x0 + (x1 - x0) * t, y + f(t) * amp] as [number, number];
  });
}

const MOTIFS: Record<Kind, [string, string, string]> = {
  machine: [
    // Front: impeller and the incoming vibration trace.
    [
      circle('s-base', 0.42, 0, 0.42),
      circle('s-faint', 0.42, 0, 0.3),
      `<g class="spin">${Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        const p: [number, number][] = Array.from({ length: 7 }, (_, k) => {
          const r = 0.08 + (k / 6) * 0.3;
          const b = a + (k / 6) * 0.9;
          return [0.42 + Math.cos(b) * r, Math.sin(b) * r];
        });
        return poly('s-strong', p);
      }).join('')}<animateTransform attributeName="transform" type="rotate" from="0 0.42 0" to="360 0.42 0" dur="9s" repeatCount="indefinite"/></g>`,
      circle('s-strong', 0.42, 0, 0.07),
      poly('s-base flow', wave(-0.92, -0.08, 0, 0.14, (t) => Math.sin(t * 26) * (0.4 + 0.6 * Math.exp(-Math.pow((t - 0.62) * 7, 2))))),
      rect('s-faint', -0.95, -0.55, 0.3, 0.12),
    ].join(''),
    // Middle: spectrum with one harmonic breaking threshold.
    [
      line('s-faint', -0.9, 0.5, 0.9, 0.5),
      line('s-dash', -0.9, -0.2, 0.9, -0.2),
      ...Array.from({ length: 22 }, (_, i) => {
        const x = -0.85 + i * 0.08;
        const h = i === 13 ? 0.9 : 0.12 + Math.abs(Math.sin(i * 1.7)) * 0.32;
        return line(i === 13 ? 's-strong' : 's-base', x, 0.5, x, 0.5 - h);
      }),
    ].join(''),
    // Back: thermal contours.
    [0.12, 0.22, 0.34, 0.47, 0.6].map((r, i) => `<ellipse class="${i === 0 ? 's-strong' : 's-faint'}" cx="-0.2" cy="0.05" rx="${r * 1.35}" ry="${r}"/>`).join(''),
  ],
  crm: [
    // Front: relationship graph.
    (() => {
      const hubs: [number, number][] = [[-0.5, -0.15], [0.35, 0.2], [0.7, -0.38]];
      const nodes: [number, number, number][] = [
        [-0.85, -0.45, 0], [-0.75, 0.25, 0], [-0.2, -0.5, 0], [-0.3, 0.35, 0], [0.05, 0.5, 1], [0.6, 0.5, 1],
        [0.1, -0.1, 1], [0.85, 0.05, 2], [0.45, -0.6, 2], [0.95, -0.55, 2],
      ];
      return [
        line('s-base', ...hubs[0], ...hubs[1]),
        line('s-base', ...hubs[1], ...hubs[2]),
        ...nodes.map(([x, y, h]) => line('s-faint', x, y, ...hubs[h]) + circle('s-base', x, y, 0.035)),
        ...hubs.map(([x, y]) => circle('s-strong', x, y, 0.07)),
        `<circle class="s-base pulse" cx="${hubs[1][0]}" cy="${hubs[1][1]}" r="0.16"/>`,
      ].join('');
    })(),
    // Middle: pipeline board.
    [-0.92, -0.46, 0, 0.46]
      .map((x, ci) =>
        [
          rect('s-faint', x, -0.62, 0.42, 1.24, 0.04),
          ...Array.from({ length: [3, 3, 2, 1][ci] }, (_, k) => rect(ci === 2 && k === 0 ? 's-strong' : 's-base', x + 0.04, -0.52 + k * 0.36, 0.34, 0.28)),
        ].join(''),
      )
      .join(''),
    // Back: score ring and trend.
    [
      circle('s-faint', -0.5, 0, 0.36),
      `<circle class="s-strong" cx="-0.5" cy="0" r="0.28" pathLength="100" stroke-dasharray="92 100" transform="rotate(-90 -0.5 0)"/>`,
      poly('s-base', wave(0.0, 0.9, 0.2, 0.28, (t) => -t * 1.6 + Math.sin(t * 14) * 0.18, 24)),
      line('s-faint', 0, 0.45, 0.9, 0.45),
    ].join(''),
  ],
  agents: [
    // Front: plan graph with a self-check loop.
    (() => {
      const box = (x: number, y: number, c = 's-base') => rect(c, x - 0.16, y - 0.08, 0.32, 0.16, 0.04);
      const flow = 'M-0.64,0 L-0.36,0 M0,0 L0.36,0 M0.2,0 L0.2,-0.4 L0.36,-0.4 M0.2,0 L0.2,0.4 L0.36,0.4 M0.68,-0.4 L0.8,-0.4 L0.8,0 M0.68,0.4 L0.8,0.4 L0.8,0';
      return [
        `<path class="s-base flow" d="${flow}"/>`,
        box(-0.8, 0),
        box(-0.18, 0, 's-strong'),
        box(0.52, -0.4),
        box(0.52, 0),
        box(0.52, 0.4),
        `<path class="s-dash" d="M0.52,0.48 C0.52,0.7 -0.18,0.7 -0.18,0.08"/>`,
        `<circle class="dotfill" r="0.035"><animateMotion dur="3.2s" repeatCount="indefinite" path="M-0.64,0 L-0.34,0 L0.2,0 L0.2,-0.4 L0.36,-0.4"/></circle>`,
      ].join('');
    })(),
    // Middle: chat.
    [
      rect('s-base', -0.9, -0.58, 1.0, 0.24, 0.06),
      rect('s-strong', -0.1, -0.22, 1.0, 0.34, 0.06),
      rect('s-base', -0.9, 0.24, 0.7, 0.2, 0.06),
      line('s-faint', -0.8, -0.46, -0.1, -0.46),
      line('s-faint', 0.0, -0.1, 0.8, -0.1),
      line('s-faint', 0.0, 0.0, 0.55, 0.0),
      ...[0, 1, 2].map((i) => `<circle class="dotfill pulse" style="animation-delay:${i * 0.25}s" cx="${-0.76 + i * 0.1}" cy="0.34" r="0.022"/>`),
    ].join(''),
    // Back: execution trace.
    [
      ...[
        [-0.9, 0.9], [-0.9, -0.3], [-0.3, 0.2], [0.05, 0.7], [0.4, 0.8],
      ].map(([x0, x1], i) => line(i === 3 ? 's-strong' : 's-base', x0, -0.5 + i * 0.25, x1, -0.5 + i * 0.25)),
      line('s-dash', 0.1, -0.65, 0.1, 0.62),
    ].join(''),
  ],
};

function planeOutline(): string {
  return `<rect class="plane__frame" x="-1" y="-0.7" width="2" height="1.4" rx="0.1"/>`;
}

function links(kind: Kind): string {
  const at: Record<Kind, [number, number][]> = {
    machine: [[0.42, 0], [-0.2, 0.05]],
    crm: [[0.35, 0.2], [-0.5, -0.15]],
    agents: [[-0.18, 0], [0.52, 0.4]],
  };
  return at[kind]
    .map(([x, y]) => {
      const sx = CX + (x - y) * 0.866 * S;
      const sy = CY + (x + y) * 0.5 * S;
      return `<line class="link" x1="${n(sx)}" y1="${n(sy - 30)}" x2="${n(sx)}" y2="${n(sy + 30)}"/>`;
    })
    .join('');
}

export function mountCompare(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.card').forEach((card, i) => {
    const kind = card.dataset.kind as Kind;
    const art = card.querySelector('.card__art');
    if (!art) return;
    const [front, middle, back] = MOTIFS[kind];
    const plane = (k: number, body: string) =>
      `<g class="plane" data-k="${k}"><g transform="${ISO}">${planeOutline()}${body}</g></g>`;
    art.innerHTML = `<svg class="iso" viewBox="0 0 320 240" style="--delay:${(i * 0.45).toFixed(2)}s">${plane(2, back)}${plane(1, middle)}${links(kind)}${plane(0, front)}</svg>`;
  });
}

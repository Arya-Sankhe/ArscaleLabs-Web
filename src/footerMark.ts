import { DiamondField, type Grid } from './ascii';

/*
 * The footer wordmark as a live diamond matrix. It resolves outward when it
 * first comes into view, a light band sweeps through it on a loop, and the
 * pointer leaves a ripple in the surrounding field.
 */

const SUPER = 3;
const VIEW_H = 118;
const MARK_H = 100;

const frac = (x: number) => x - Math.floor(x);
const hash2 = (x: number, y: number) => frac(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);

function wordmarkImage(): Promise<HTMLImageElement> {
  const symbol = document.getElementById('wordmark');
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 701 100" color="#fff">${symbol?.innerHTML ?? ''}</svg>`;
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  return img.decode().then(() => img);
}

export function mountFooterMark(canvas: HTMLCanvasElement): void {
  let image: HTMLImageElement | null = null;
  let cover = new Float32Array(1);
  let grid: Grid | null = null;
  const pointer = { x: -1e4, y: -1e4, energy: 0 };

  const buildMask = (g: Grid) => {
    grid = g;
    cover = new Float32Array(g.cols * g.rows);
    if (!image) return;
    const w = g.cols * SUPER;
    const h = g.rows * SUPER;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const ctx = off.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const markH = (h * MARK_H) / VIEW_H;
    const markW = Math.min(w, (markH * 701) / 100);
    ctx.drawImage(image, (w - markW) / 2, (h - markH) / 2, markW, markH);
    const data = ctx.getImageData(0, 0, w, h).data;
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        let sum = 0;
        for (let j = 0; j < SUPER; j++)
          for (let i = 0; i < SUPER; i++) sum += data[((r * SUPER + j) * w + c * SUPER + i) * 4 + 3];
        cover[r * g.cols + c] = sum / (SUPER * SUPER * 255);
      }
    }
  };

  const sample = (g: Grid, t: number, out: Float32Array) => {
    const { cols, rows, cw, ch } = g;
    // The canvas runs edge to edge; reveal and sweep are measured across the mark.
    const across = (cols * cw) / ((rows * ch * MARK_H * 701) / (VIEW_H * 100));
    const intro = t / 1.8;
    const sweep = frac(t / 5.5) * 1.6 - 0.3;
    pointer.energy *= 0.96;
    const pc = pointer.x / cw;
    const pr = pointer.y / ch;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = r * cols + c;
        const u = (c / cols - 0.5) * across + 0.5;
        const v = r / rows;
        const h = hash2(c, r);

        const dx = (u - 0.5) * 2.2;
        const dy = (v - 0.5) * 0.9;
        const thr = Math.hypot(dx, dy) * 0.78 + h * 0.2;
        const appear = Math.min(1, Math.max(0, (intro * 1.2 - thr) / 0.08));

        const pd = Math.hypot((c - pc) * cw, (r - pr) * ch);
        const ring = Math.exp(-Math.pow((pd - (1 - pointer.energy) * 160) / 26, 2)) * pointer.energy;
        const near = Math.exp(-(pd * pd) / (2 * 70 * 70));

        const m = cover[k];
        let val = 0;
        if (m > 0.05) {
          const band = Math.exp(-Math.pow((u - sweep) * 7, 2));
          const shimmer = 0.5 + 0.5 * Math.sin(c * 0.21 - r * 0.35 - t * 1.4);
          const flick = h > 0.985 ? 0.35 * (0.5 + 0.5 * Math.sin(t * 9 + h * 40)) : 0;
          val = m * (0.52 + 0.18 * shimmer + 0.4 * band) + flick + near * 0.25;
        } else {
          // Sparse background field that twinkles and answers the pointer.
          const twinkle = h > 0.9 ? 0.1 + 0.08 * Math.sin(t * (0.6 + h) + h * 30) : 0;
          val = twinkle + ring * 0.55 + near * 0.12 * (h > 0.5 ? 1 : 0);
        }
        out[k] = Math.min(1, val) * appear;
      }
    }
  };

  const field = new DiamondField(canvas, {
    cell: (w) => (w < 768 ? [3, 3.6] : w < 1200 ? [5, 6.5] : [7, 9]),
    sample,
    onResize: buildMask,
  });
  void field;

  wordmarkImage()
    .then((img) => {
      image = img;
      if (grid) buildMask(grid);
    })
    .catch(() => document.documentElement.classList.add('no-canvas'));

  canvas.addEventListener(
    'pointermove',
    (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const moved = Math.hypot(x - pointer.x, y - pointer.y);
      pointer.x = x;
      pointer.y = y;
      if (moved > 40 || pointer.energy < 0.2) pointer.energy = 1;
    },
    { passive: true },
  );
  canvas.addEventListener('pointerleave', () => {
    pointer.x = -1e4;
    pointer.y = -1e4;
  });
}

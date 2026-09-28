/**
 * A 2D-canvas diamond matrix in the same visual language as the hero hands:
 * one glyph per cell, its size quantised by brightness. Renders only while
 * on screen.
 */

export interface Grid {
  cols: number;
  rows: number;
  /** Cell size in CSS pixels. */
  cw: number;
  ch: number;
  width: number;
  height: number;
}

export interface FieldOptions {
  cell: (width: number) => [number, number];
  /** Fill `out` (cols × rows, row-major) with brightness 0..1. */
  sample: (grid: Grid, time: number, out: Float32Array) => void;
  onResize?: (grid: Grid) => void;
}

const LEVELS = 6;

export class DiamondField {
  private readonly ctx: CanvasRenderingContext2D;
  private grid: Grid = { cols: 1, rows: 1, cw: 8, ch: 10, width: 1, height: 1 };
  private values = new Float32Array(1);
  private visible = false;
  private raf = 0;
  private start = -1;
  private last = 0;
  private readonly still = window.matchMedia('(prefers-reduced-motion: reduce)');
  /** Seconds since the field first came into view. */
  time = 0;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly opts: FieldOptions,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible && !this.raf) {
          this.last = performance.now();
          this.raf = requestAnimationFrame(this.frame);
        }
      },
      { rootMargin: '80px' },
    ).observe(canvas);
    this.resize();
  }

  private resize(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const [cw, ch] = this.opts.cell(width);
    const cols = Math.floor(width / cw);
    const rows = Math.floor(height / ch);
    this.grid = { cols, rows, cw, ch, width, height };
    this.values = new Float32Array(cols * rows);
    this.opts.onResize?.(this.grid);
    if (!this.raf) this.draw();
  }

  private readonly frame = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (this.start < 0) this.start = now;
    if (!this.still.matches) this.time += dt;
    this.draw();
    this.raf = this.visible ? requestAnimationFrame(this.frame) : 0;
  };

  private draw(): void {
    const { ctx, grid, values } = this;
    const { cols, rows, cw, ch, width, height } = grid;
    values.fill(0);
    this.opts.sample(grid, this.still.matches ? 4 : this.time, values);

    ctx.clearRect(0, 0, width, height);
    const ox = (width - cols * cw) / 2;
    const oy = (height - rows * ch) / 2;
    const paths: Path2D[] = Array.from({ length: LEVELS + 1 }, () => new Path2D());
    for (let r = 0; r < rows; r++) {
      const cy = oy + (r + 0.5) * ch;
      for (let c = 0; c < cols; c++) {
        const v = values[r * cols + c];
        if (v < 0.04) continue;
        const level = Math.min(LEVELS, Math.round(v * LEVELS));
        const cx = ox + (c + 0.5) * cw;
        const p = paths[level];
        if (level <= 1) {
          const s = cw * 0.1;
          p.rect(cx - s, cy - s, s * 2, s * 2);
          continue;
        }
        const hw = cw * (0.16 + ((level - 2) / (LEVELS - 2)) * 0.44);
        const hh = hw / 1.3;
        p.moveTo(cx, cy - hh);
        p.lineTo(cx + hw, cy);
        p.lineTo(cx, cy + hh);
        p.lineTo(cx - hw, cy);
        p.closePath();
      }
    }
    for (let l = 1; l <= LEVELS; l++) {
      ctx.fillStyle = `rgba(242, 242, 244, ${l <= 1 ? 0.32 : 0.45 + (l / LEVELS) * 0.55})`;
      ctx.fill(paths[l]);
    }
  }
}

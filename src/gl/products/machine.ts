import { LiveLines } from './sketch';
import { Product, Z, gauss, range } from './product';

const BEARING: [number, number] = [0.25, -0.04];
const MOTOR: [number, number] = [-0.85, -0.1];
const PUMP: [number, number] = [1.3, -0.04];

/** Surface temperature: motor windings, a hot bearing, a warm pump. */
function heat(x: number, y: number): number {
  return (
    0.78 * gauss(x, y, MOTOR[0], MOTOR[1], 0.62, 0.5) +
    1.0 * gauss(x, y, BEARING[0], BEARING[1], 0.2, 0.24) +
    0.5 * gauss(x, y, PUMP[0], PUMP[1], 0.5, 0.46) +
    0.05 * Math.sin(x * 3.1 + y * 2.3) +
    0.035 * Math.sin(x * 5.7 - y * 4.4)
  );
}

/**
 * 01 — Live machine analysis. Front: the asset (motor, bearing, coupling,
 * pump). Middle: vibration and spectrum telemetry. Back: thermal signature.
 */
export class MachineProduct extends Product {
  private readonly impeller: LiveLines;
  private readonly wave: LiveLines;
  private readonly spectrum: LiveLines;
  private readonly pulse: LiveLines;

  constructor() {
    super();
    const s = this.sketch;

    // Back plane: thermal contours.
    this.frame(2);
    s.contours('faint', heat, [-1.82, -1.22, 1.82, 1.22], range(0.12, 0.96, 0.07), [118, 80]);
    s.contours('base', heat, [-1.82, -1.22, 1.82, 1.22], [0.9, 1.0], [118, 80]);

    // Front plane: the asset.
    this.frame(0);
    s.rect('base', -1.62, -0.94, 1.78, -0.82, 0.02);
    for (const x of [-1.45, -0.55, 0.9, 1.65]) s.rect('faint', x - 0.08, -1.04, x + 0.08, -0.94, 0.01);
    s.rect('base', -1.5, -0.72, -0.2, 0.5, 0.12);
    for (const x of range(-1.38, -0.33, 0.075)) s.line('faint', x, -0.6, x, 0.38);
    s.rect('base', -1.1, 0.5, -0.62, 0.72, 0.03);
    s.poly('faint', [[-0.86, 0.72], [-0.86, 0.92], [-1.3, 1.02], [-1.75, 1.02]]);
    s.rect('base', -0.2, -0.5, -0.05, 0.3, 0.03);
    s.line('base', -0.05, 0.03, 0.62, 0.03);
    s.line('base', -0.05, -0.11, 0.62, -0.11);
    s.rect('base', 0.12, -0.36, 0.38, 0.28, 0.04);
    s.circle('strong', BEARING[0], BEARING[1], 0.1);
    s.circle('faint', BEARING[0], BEARING[1], 0.055);
    s.rect('base', 0.62, -0.2, 0.8, 0.12, 0.02);
    s.line('faint', 0.71, -0.2, 0.71, 0.12);
    s.line('base', 0.8, -0.04, 0.86, -0.04);
    s.circle('base', PUMP[0], PUMP[1], 0.48);
    s.arc('faint', PUMP[0], PUMP[1], 0.54, -0.4, Math.PI * 1.5);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      s.circle('faint', PUMP[0] + Math.cos(a) * 0.41, PUMP[1] + Math.sin(a) * 0.41, 0.022, 10);
    }
    s.poly('base', [[1.22, 0.43], [1.22, 0.84], [1.8, 0.84]]);
    s.poly('base', [[1.38, 0.43], [1.38, 0.7], [1.8, 0.7]]);
    s.brackets('strong', 0.04, -0.47, 0.46, 0.39, 0.09);

    // Middle plane: telemetry.
    this.frame(1);
    s.line('faint', -1.7, 0.55, 1.7, 0.55);
    s.line('dash', -1.7, 0.83, 1.7, 0.83);
    s.line('dash', -1.7, 0.27, 1.7, 0.27);
    s.line('faint', -1.7, -1.05, 1.7, -1.05);
    for (const x of range(-1.7, 1.7, 0.2)) s.line('faint', x, -1.05, x, -1.1);
    s.text('faint', -1.7, 1.12, [0.42]);
    s.text('faint', -1.7, -0.08, [0.3]);

    // Connectors: each component threads back through its signal to its heat.
    for (const [x, y] of [MOTOR, BEARING, PUMP, [-0.4, 0.62] as [number, number]]) {
      s.connector(x, y, Z[0], Z[2] - 0.25, [Z[1], Z[2]]);
    }

    this.build();

    this.impeller = this.live(60, 'strong');
    this.wave = this.live(220, 'strong');
    this.spectrum = this.live(48, 'base');
    this.pulse = this.live(40, 'base', true);

    this.label('BRG-02', [0.04, 0.47, Z[0]], 0.55, { tone: 'bright' });
    this.label('ANOMALY 0.87', [0.04, -0.6, Z[0]], 0.62);
    this.label('VIB RMS 4.2 MM/S', [-1.7, 1.0, Z[1]], 0.6);
    this.label('Δ +38% / 72H', [1.05, -0.2, Z[1]], 0.7);
    this.label('1101', [MOTOR[0], MOTOR[1], Z[2] - 0.3], 0.8, { side: 'right' });
    this.label('0111', [BEARING[0], BEARING[1], Z[2] - 0.3], 0.84, { side: 'right' });
    this.label('0001', [PUMP[0], PUMP[1], Z[2] - 0.3], 0.88, { side: 'right' });
    this.label('THERMAL', [-1.8, 1.08, Z[2]], 0.4);
  }

  tick(t: number): void {
    // Impeller: 7 swept vanes turning inside the volute.
    const im = this.impeller;
    im.begin();
    const rot = t * 0.9;
    for (let v = 0; v < 7; v++) {
      const a0 = rot + (v / 7) * Math.PI * 2;
      let px = PUMP[0] + Math.cos(a0) * 0.08;
      let py = PUMP[1] + Math.sin(a0) * 0.08;
      for (let k = 1; k <= 6; k++) {
        const r = 0.08 + (k / 6) * 0.28;
        const a = a0 + (k / 6) * 0.9;
        const nx = PUMP[0] + Math.cos(a) * r;
        const ny = PUMP[1] + Math.sin(a) * r;
        im.seg(px, py, Z[0], nx, ny, Z[0]);
        px = nx;
        py = ny;
      }
    }
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const b = ((k + 1) / 16) * Math.PI * 2;
      im.seg(PUMP[0] + Math.cos(a) * 0.08, PUMP[1] + Math.sin(a) * 0.08, Z[0], PUMP[0] + Math.cos(b) * 0.08, PUMP[1] + Math.sin(b) * 0.08, Z[0]);
    }
    im.end();

    // Vibration: a healthy carrier with a recurring bearing-fault burst.
    const w = this.wave;
    w.begin();
    const n = 210;
    let prev = 0;
    for (let i = 0; i <= n; i++) {
      const x = -1.7 + (i / n) * 3.4;
      const burstAt = ((t * 0.35) % 1) * 4.4 - 1.9;
      const burst = Math.exp(-((x - burstAt) ** 2) / 0.012) * 0.24;
      const y =
        0.55 +
        Math.sin(x * 9 - t * 3.2) * 0.07 +
        Math.sin(x * 23 + t * 5.1) * 0.03 +
        Math.sin(x * 71 - t * 9) * burst;
      if (i > 0) w.seg(x - 3.4 / n, prev, Z[1], x, y, Z[1]);
      prev = y;
    }
    w.end();

    // Spectrum: harmonics plus the fault frequency climbing.
    const sp = this.spectrum;
    sp.begin();
    for (let i = 0; i < 42; i++) {
      const x = -1.64 + i * 0.08;
      const f = i / 41;
      const harm = 0.55 * gauss(f, 0, 0.12, 0, 0.02, 1) + 0.32 * gauss(f, 0, 0.24, 0, 0.02, 1) + 0.18 * gauss(f, 0, 0.36, 0, 0.02, 1);
      const fault = (0.5 + 0.15 * Math.sin(t * 1.6)) * gauss(f, 0, 0.66, 0, 0.025, 1);
      const floor = 0.05 + 0.03 * Math.sin(i * 1.7 + t * 2);
      sp.seg(x, -1.05, Z[1], x, -1.05 + Math.min(0.9, floor + harm + fault), Z[1]);
    }
    sp.end();

    // A ring pulsing out of the hot bearing.
    const p = this.pulse;
    p.begin();
    const phase = (t * 0.6) % 1;
    const r = 0.12 + phase * 0.5;
    for (let k = 0; k < 40; k++) {
      const a = (k / 40) * Math.PI * 2;
      const b = ((k + 1) / 40) * Math.PI * 2;
      if (phase > 0.85) break;
      p.seg(BEARING[0] + Math.cos(a) * r, BEARING[1] + Math.sin(a) * r, Z[2], BEARING[0] + Math.cos(b) * r, BEARING[1] + Math.sin(b) * r, Z[2]);
    }
    p.end();
    p.fade = 1 - phase / 0.85;
  }
}

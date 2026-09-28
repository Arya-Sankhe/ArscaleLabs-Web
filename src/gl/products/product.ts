import * as THREE from 'three';
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LiveLines, Sketch, STYLES, createMaterials, type Style } from './sketch';

/** Depth of the three stacked planes: front, middle, back. */
export const Z = [2.2, 0, -2.2] as const;
export const PLANE = { w: 1.95, h: 1.35, r: 0.16 };

export interface Label {
  text: string;
  at: [number, number, number];
  /** Reveal threshold, 0..1. */
  delay: number;
  tone?: 'dim' | 'bright';
  side?: 'left' | 'right';
}

/** Lines behind this local depth belong to the middle and back planes. */
const FRONT_CUT = Z[0] - 0.4;

/** Multiplies the alpha of everything behind the front plane by `uBehind`. */
function fadeBehind(material: LineMaterial, uniform: { value: number }): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBehind = uniform;
    shader.vertexShader = shader.vertexShader.replace(
      'void main() {',
      'varying float vPlaneZ;\nvoid main() {\n  vPlaneZ = position.y < 0.5 ? instanceStart.z : instanceEnd.z;',
    );
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float uBehind;\nvarying float vPlaneZ;\nvoid main() {')
      .replace(
        'vec4 diffuseColor = vec4( diffuse, alpha );',
        `alpha *= mix(uBehind, 1.0, smoothstep(${(FRONT_CUT - 0.3).toFixed(2)}, ${FRONT_CUT.toFixed(2)}, vPlaneZ));\n  vec4 diffuseColor = vec4( diffuse, alpha );`,
      );
  };
  material.customProgramCacheKey = () => 'fade-behind';
}

export abstract class Product {
  /** Placement, rotation and scale; owned by the stage. */
  readonly root = new THREE.Group();
  /** Scaled along Z to fold the planes together on enter and exit. */
  readonly stack = new THREE.Group();
  /** 0 shows only the front plane, 1 shows all three. */
  private readonly behind = { value: 1 };
  readonly materials: Record<Style, LineMaterial> = createMaterials();
  readonly labels: Label[] = [];
  protected readonly sketch = new Sketch();
  private readonly baseOpacity: Record<Style, number>;
  private readonly discs: THREE.Mesh[] = [];
  private readonly owned: { lines: LiveLines; material: LineMaterial; style: Style }[] = [];
  private alpha = 0;
  private readonly discMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  constructor() {
    this.root.add(this.stack);
    for (const s of STYLES) fadeBehind(this.materials[s], this.behind);
    this.baseOpacity = Object.fromEntries(STYLES.map((s) => [s, this.materials[s].opacity])) as Record<Style, number>;
  }

  protected frame(plane: number, inset = 0): void {
    this.sketch.z = Z[plane];
    const { w, h, r } = PLANE;
    this.sketch.rect('frame', -w + inset, -h + inset, w - inset, h - inset, r);
  }

  /** `own` gives the lines a private material so `fade` can dim them alone. */
  protected live(capacity: number, style: Style, own = false): LiveLines {
    const material = own ? this.materials[style].clone() : this.materials[style];
    if (own) fadeBehind(material, this.behind);
    const lines = new LiveLines(capacity, material);
    if (own) this.owned.push({ lines, material, style });
    this.stack.add(lines.line);
    return lines;
  }

  /** A filled white dot, the only solid element in a wireframe. */
  protected disc(radius = 0.028): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 20), this.discMaterial);
    mesh.frustumCulled = false;
    this.stack.add(mesh);
    this.discs.push(mesh);
    return mesh;
  }

  protected label(text: string, at: [number, number, number], delay: number, extra: Partial<Label> = {}): void {
    this.labels.push({ text, at, delay, ...extra });
  }

  protected build(): void {
    this.sketch.build(this.stack, this.materials);
  }

  setResolution(w: number, h: number): void {
    for (const s of STYLES) this.materials[s].resolution.set(w, h);
    for (const o of this.owned) o.material.resolution.set(w, h);
  }

  /** Call after `tick` so per-line `fade` values land this frame. */
  applyFades(): void {
    for (const o of this.owned) o.material.opacity = this.baseOpacity[o.style] * this.alpha * o.lines.fade;
  }

  /** `reveal` draws lines on; `alpha` fades everything; `behind` fades the rear planes. */
  apply(reveal: number, alpha: number, behind: number): void {
    this.alpha = alpha;
    this.behind.value = behind;
    this.sketch.reveal(reveal);
    for (const s of STYLES) this.materials[s].opacity = this.baseOpacity[s] * alpha;
    const live = THREE.MathUtils.clamp((reveal - 0.55) / 0.35, 0, 1);
    this.discMaterial.opacity = alpha * live;
    this.root.visible = alpha > 0.002;
  }

  abstract tick(time: number): void;
}

export const gauss = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) =>
  Math.exp(-(((x - cx) * (x - cx)) / (sx * sx) + ((y - cy) * (y - cy)) / (sy * sy)));

export function range(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let v = from; v <= to + 1e-6; v += step) out.push(v);
  return out;
}

/** Deterministic PRNG so the illustrations are identical on every load. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Moves `mesh` along a polyline at parameter `t` in 0..1. */
export function alongPath(mesh: THREE.Object3D, path: [number, number][], z: number, t: number): void {
  let total = 0;
  const lens: number[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const l = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
    lens.push(l);
    total += l;
  }
  let d = THREE.MathUtils.clamp(t, 0, 1) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const k = lens[i] ? Math.min(d / lens[i], 1) : 0;
      mesh.position.set(
        path[i][0] + (path[i + 1][0] - path[i][0]) * k,
        path[i][1] + (path[i + 1][1] - path[i][1]) * k,
        z,
      );
      return;
    }
    d -= lens[i];
  }
}

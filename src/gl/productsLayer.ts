import * as THREE from 'three';
import { AgentsProduct } from './products/agents';
import { CrmProduct } from './products/crm';
import { MachineProduct } from './products/machine';
import type { Product } from './products/product';

export interface ProductPhase {
  /** 0..1 while the illustration assembles. */
  enter: number;
  /** 0..1 while it folds away. */
  exit: number;
}

export interface ProductsState {
  time: number;
  phases: ProductPhase[];
  pointer: THREE.Vector2;
}

const ease = (t: number) => 1 - Math.pow(1 - THREE.MathUtils.clamp(t, 0, 1), 3);
const smooth = (t: number) => {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

export class ProductsLayer {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 1, 60);
  readonly products: Product[] = [new MachineProduct(), new CrmProduct(), new AgentsProduct()];
  private readonly labelEls: HTMLElement[][];
  private width = 1;
  private height = 1;
  private fit = 1;
  private offsetY = 0.9;
  private readonly v = new THREE.Vector3();

  constructor(labelRoot: HTMLElement) {
    this.camera.position.set(0, 0, 12);
    for (const p of this.products) this.scene.add(p.root);
    this.labelEls = this.products.map((p) =>
      p.labels.map((l) => {
        const el = document.createElement('span');
        el.className = `wf-label${l.tone === 'bright' ? ' wf-label--bright' : ''}${l.side === 'right' ? ' wf-label--right' : ''}`;
        el.textContent = l.text;
        labelRoot.appendChild(el);
        return el;
      }),
    );
  }

  resize(width: number, height: number, dpr: number): void {
    this.width = width;
    this.height = height;
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    const visH = 2 * this.camera.position.z * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const visW = visH * aspect;
    const narrow = aspect < 0.9;
    this.fit = Math.min(((narrow ? 0.98 : 0.64) * visW) / 6.3, ((narrow ? 0.42 : 0.5) * visH) / 3.1);
    this.offsetY = visH * (narrow ? 0.1 : 0.085);
    for (const p of this.products) p.setResolution(width * dpr, height * dpr);
  }

  /** True when any product is on screen. */
  active(state: ProductsState): boolean {
    return state.phases.some((ph) => ph.enter > 0 && ph.exit < 1);
  }

  render(renderer: THREE.WebGLRenderer, s: ProductsState): void {
    this.products.forEach((p, i) => {
      const { enter, exit } = s.phases[i];
      const e = ease(enter);
      const x = smooth(exit);
      const alpha = smooth(enter * 1.6) * (1 - x);
      p.apply(enter, alpha);
      if (!p.root.visible) return;

      p.root.scale.setScalar(this.fit * (0.94 + 0.06 * e));
      p.root.position.set(0, this.offsetY - (1 - e) * 0.25 + x * 0.35, 0);
      p.root.rotation.set(
        0.07 - s.pointer.y * 0.04 + (1 - e) * 0.12,
        -0.74 + (1 - e) * 0.5 - x * 0.5 + s.pointer.x * 0.06 + Math.sin(s.time * 0.21 + i) * 0.025,
        0.02,
      );
      p.stack.scale.z = 0.05 + 0.95 * e * (1 - 0.92 * x);
      p.tick(s.time);
      p.applyFades();
    });

    renderer.render(this.scene, this.camera);
    this.placeLabels(s);
  }

  private placeLabels(s: ProductsState): void {
    this.scene.updateMatrixWorld();
    this.products.forEach((p, i) => {
      const els = this.labelEls[i];
      const { enter, exit } = s.phases[i];
      const fade = 1 - smooth(exit * 1.8);
      p.labels.forEach((l, k) => {
        const el = els[k];
        const o = p.root.visible ? THREE.MathUtils.clamp((enter - l.delay) / 0.12, 0, 1) * fade : 0;
        if (o <= 0.001) {
          if (el.style.opacity !== '0') el.style.opacity = '0';
          return;
        }
        this.v.set(...l.at).applyMatrix4(p.stack.matrixWorld).project(this.camera);
        const sx = (this.v.x * 0.5 + 0.5) * this.width;
        const sy = (-this.v.y * 0.5 + 0.5) * this.height;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
      });
    });
  }

  hideLabels(): void {
    for (const els of this.labelEls) for (const el of els) el.style.opacity = '0';
  }
}

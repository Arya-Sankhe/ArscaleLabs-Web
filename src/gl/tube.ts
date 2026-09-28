import * as THREE from 'three';

/** One cross-section of a tube: an ellipse around `center`, oriented by `up`. */
export interface Ring {
  center: THREE.Vector3;
  tangent: THREE.Vector3;
  up: THREE.Vector3;
  /** Semi-axis along `up` (thickness). */
  a: number;
  /** Semi-axis along tangent × up (width). */
  b: number;
  /** -1..1, bends normals toward the tangent on end caps. */
  tilt: number;
  /** Arc length at this ring, drives wireframe ring spacing. */
  u: number;
}

const _n = new THREE.Vector3();
const _b = new THREE.Vector3();
const _p = new THREE.Vector3();
const _r = new THREE.Vector3();

/**
 * A tube with fixed topology whose rings are rewritten every frame, so a
 * limb can be re-posed without reallocating buffers.
 */
export class Tube {
  readonly geometry = new THREE.BufferGeometry();
  private readonly position: THREE.BufferAttribute;
  private readonly normal: THREE.BufferAttribute;
  private readonly uv: THREE.BufferAttribute;

  constructor(
    readonly ringCount: number,
    readonly radial: number,
  ) {
    const stride = radial + 1;
    const count = ringCount * stride;
    this.position = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
    this.normal = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
    this.uv = new THREE.BufferAttribute(new Float32Array(count * 2), 2);
    this.position.setUsage(THREE.DynamicDrawUsage);
    this.normal.setUsage(THREE.DynamicDrawUsage);
    this.uv.setUsage(THREE.DynamicDrawUsage);

    const index: number[] = [];
    for (let i = 0; i < ringCount - 1; i++) {
      for (let j = 0; j < radial; j++) {
        const a = i * stride + j;
        const b = a + stride;
        index.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    this.geometry.setIndex(index);
    this.geometry.setAttribute('position', this.position);
    this.geometry.setAttribute('normal', this.normal);
    this.geometry.setAttribute('uv', this.uv);
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
  }

  update(rings: Ring[]): void {
    const { radial } = this;
    const pos = this.position.array as Float32Array;
    const nor = this.normal.array as Float32Array;
    const uv = this.uv.array as Float32Array;
    let k = 0;
    for (let i = 0; i < this.ringCount; i++) {
      const ring = rings[Math.min(i, rings.length - 1)];
      _n.copy(ring.up).addScaledVector(ring.tangent, -ring.up.dot(ring.tangent)).normalize();
      _b.crossVectors(ring.tangent, _n).normalize();
      const tiltCos = Math.sqrt(Math.max(0, 1 - ring.tilt * ring.tilt));
      for (let j = 0; j <= radial; j++) {
        const ang = (j / radial) * Math.PI * 2;
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        _p.copy(ring.center).addScaledVector(_n, c * ring.a).addScaledVector(_b, s * ring.b);
        _r.copy(_n)
          .multiplyScalar(c / Math.max(ring.a, 1e-4))
          .addScaledVector(_b, s / Math.max(ring.b, 1e-4))
          .normalize()
          .multiplyScalar(tiltCos)
          .addScaledVector(ring.tangent, ring.tilt)
          .normalize();
        pos[k * 3] = _p.x;
        pos[k * 3 + 1] = _p.y;
        pos[k * 3 + 2] = _p.z;
        nor[k * 3] = _r.x;
        nor[k * 3 + 1] = _r.y;
        nor[k * 3 + 2] = _r.z;
        uv[k * 2] = ring.u;
        uv[k * 2 + 1] = j / radial;
        k++;
      }
    }
    this.position.needsUpdate = true;
    this.normal.needsUpdate = true;
    this.uv.needsUpdate = true;
  }
}

/** Appends a rounded end cap to `rings`, continuing from the last ring. */
export function appendCap(rings: Ring[], steps: number, length: number): void {
  const last = rings[rings.length - 1];
  for (let k = 1; k <= steps; k++) {
    const phi = (k / steps) * (Math.PI / 2);
    const shrink = Math.max(Math.cos(phi), 0.02);
    rings.push({
      center: last.center.clone().addScaledVector(last.tangent, Math.sin(phi) * length),
      tangent: last.tangent.clone(),
      up: last.up.clone(),
      a: last.a * shrink,
      b: last.b * shrink,
      tilt: Math.sin(phi),
      u: last.u + Math.sin(phi) * length,
    });
  }
}

import * as THREE from 'three';
import { Tube, appendCap, type Ring } from './tube';

/*
 * Hand-local frame: origin at the wrist, +X toward the fingertips,
 * +Y out of the back of the hand, +Z toward the thumb.
 */

type V3 = [number, number, number];

export interface DigitSpec {
  base: V3;
  /** Euler (x = roll, y = yaw, z = pitch) of the first segment, order YZX. */
  orient: V3;
  lens: [number, number, number];
  radii: [number, number, number, number];
  curl: [number, number, number];
  /** Thickness / width of the cross-section. */
  flat: number;
  phase: number;
}

export interface HandSpec {
  digits: DigitSpec[];
  /** Unit direction from the wrist toward the elbow. */
  forearm: V3;
  forearmLength: number;
  /** Idle finger motion amplitude in radians. */
  sway: number;
  speed: number;
}

const FINGER_RINGS = 30;
const FINGER_CAP = 6;
const ARM_RINGS = 74;
const ARM_CAP = 6;

const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

const _q = new THREE.Quaternion();
const _qk = new THREE.Quaternion();
const _e = new THREE.Euler();

function lerpKeys(keys: number[], values: number[], s: number): number {
  if (s <= keys[0]) return values[0];
  for (let i = 1; i < keys.length; i++) {
    if (s <= keys[i]) {
      const t = (s - keys[i - 1]) / (keys[i] - keys[i - 1]);
      const e = t * t * (3 - 2 * t);
      return values[i - 1] + (values[i] - values[i - 1]) * e;
    }
  }
  return values[values.length - 1];
}

export class Hand {
  readonly group = new THREE.Group();
  private readonly arm = new Tube(ARM_RINGS + ARM_CAP, 30);
  private readonly digitTubes: Tube[];
  private readonly armCurve: THREE.CatmullRomCurve3;
  private readonly armKeys: number[];

  constructor(
    private readonly spec: HandSpec,
    material: THREE.Material,
  ) {
    this.digitTubes = spec.digits.map(() => new Tube(FINGER_RINGS + FINGER_CAP, 22));
    for (const tube of [this.arm, ...this.digitTubes]) {
      const mesh = new THREE.Mesh(tube.geometry, material);
      mesh.frustumCulled = false;
      this.group.add(mesh);
    }

    const f = new THREE.Vector3(...spec.forearm).normalize();
    const L = spec.forearmLength;
    this.armCurve = new THREE.CatmullRomCurve3(
      [
        f.clone().multiplyScalar(L),
        f.clone().multiplyScalar(L * 0.45),
        f.clone().multiplyScalar(0.3),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.4, 0.015, 0),
        new THREE.Vector3(0.76, 0, 0),
      ],
      false,
      'centripetal',
    );
    const total = this.armCurve.getLength();
    const toWrist = total - 0.76 - 0.02;
    this.armKeys = [-toWrist, -1.5, -0.4, 0, 0.3, 0.6, 0.76].map((s) => s + toWrist);
    this.updateArm();
  }

  private updateArm(): void {
    const rings: Ring[] = [];
    const total = this.armCurve.getLength();
    const keys = this.armKeys;
    const thickness = [0.34, 0.28, 0.2, 0.18, 0.165, 0.14, 0.12];
    const width = [0.4, 0.35, 0.29, 0.31, 0.4, 0.43, 0.4];
    for (let i = 0; i < ARM_RINGS; i++) {
      const t = i / (ARM_RINGS - 1);
      const s = t * total;
      const center = this.armCurve.getPointAt(t);
      rings.push({
        center,
        tangent: this.armCurve.getTangentAt(t),
        up: Y.clone(),
        a: lerpKeys(keys, thickness, s),
        b: lerpKeys(keys, width, s),
        tilt: 0,
        u: s,
      });
    }
    appendCap(rings, ARM_CAP, 0.13);
    this.arm.update(rings);
  }

  /** Index fingertip in hand-local space, refreshed by `update`. */
  readonly indexTip = new THREE.Vector3();

  update(time: number, reach: number): void {
    this.spec.digits.forEach((digit, i) => {
      const rings = this.digitRings(digit, time, reach, i === 1);
      if (i === 1) this.indexTip.copy(rings[rings.length - 1].center);
      this.digitTubes[i].update(rings);
    });
  }

  private digitRings(d: DigitSpec, time: number, reach: number, isIndex: boolean): Ring[] {
    const { sway, speed } = this.spec;
    const joints: THREE.Vector3[] = [new THREE.Vector3(...d.base)];
    const ups: THREE.Vector3[] = [];
    const dirs: THREE.Vector3[] = [];

    _e.set(d.orient[0], d.orient[1], d.orient[2], 'YZX');
    _q.setFromEuler(_e);
    for (let k = 0; k < 3; k++) {
      const breathe = Math.sin(time * speed + d.phase + k * 0.7) * sway * (0.6 + k * 0.25);
      const extend = isIndex ? reach * 0.12 : 0;
      const curl = Math.max(-0.1, d.curl[k] + breathe - extend);
      _qk.setFromAxisAngle(Z, -curl);
      _q.multiply(_qk);
      const dir = X.clone().applyQuaternion(_q);
      dirs.push(dir);
      ups.push(Y.clone().applyQuaternion(_q));
      joints.push(joints[k].clone().addScaledVector(dir, d.lens[k]));
    }

    const back = 0.14;
    const points = [joints[0].clone().addScaledVector(dirs[0], -back), ...joints];
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const total = curve.getLength();
    const cum = [0, back, back + d.lens[0], back + d.lens[0] + d.lens[1], total];
    const radii = [d.radii[0] * 1.08, ...d.radii];

    const rings: Ring[] = [];
    for (let i = 0; i < FINGER_RINGS; i++) {
      const t = i / (FINGER_RINGS - 1);
      const s = t * total;
      let r = lerpKeys(cum, radii, s);
      for (let j = 1; j <= 3; j++) {
        const dj = (s - cum[j]) / 0.045;
        r *= 1 + 0.07 * Math.exp(-dj * dj);
      }
      const seg = s < cum[2] ? 0 : s < cum[3] ? 1 : 2;
      const segT = THREE.MathUtils.clamp((s - cum[seg + 1]) / (cum[seg + 2] - cum[seg + 1] || 1), 0, 1);
      const up = ups[seg].clone().lerp(ups[Math.min(seg + 1, 2)], segT * 0.5).normalize();
      rings.push({
        center: curve.getPointAt(t),
        tangent: curve.getTangentAt(t),
        up,
        a: r * d.flat,
        b: r,
        tilt: 0,
        // Negative inside the palm, so the shader can hide those grid lines.
        u: s - back,
      });
    }
    appendCap(rings, FINGER_CAP, d.radii[3] * 0.95);
    return rings;
  }
}

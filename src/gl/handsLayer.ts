import * as THREE from 'three';
import { Hand } from './hand';
import { ADAM, CREATOR } from './poses';

const surfaceVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
varying vec2 vUv;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
  gl_Position = projectionMatrix * mv;
}
`;

/* Writes lighting, normalised depth and a mesh-wireframe mask for the composite pass. */
const surfaceFrag = /* glsl */ `
uniform vec3 uLight;
uniform float uRing;
uniform float uLong;
uniform vec2 uDepthRange;
varying vec3 vNormal;
varying vec3 vView;
varying vec2 vUv;

float gridLine(float x, float width) {
  float d = abs(fract(x - 0.5) - 0.5) / max(fwidth(x), 1e-4);
  return 1.0 - clamp(d - width, 0.0, 1.0);
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(-vView);
  vec3 L = normalize(uLight);
  float ndl = dot(N, L);
  float wrap = clamp((ndl + 0.12) / 1.12, 0.0, 1.0);
  float facing = clamp(dot(N, V), 0.0, 1.0);
  float lum = 0.62 * pow(wrap, 1.4) + 0.4 * pow(facing, 1.3);
  lum *= mix(0.45, 1.0, smoothstep(0.0, 0.45, facing));
  lum += 0.2 * pow(max(dot(reflect(-L, N), V), 0.0), 10.0);
  // Soft fill from below so the undersides of curled fingers still read.
  lum += 0.26 * clamp(dot(N, normalize(vec3(0.25, -0.7, 0.65))), 0.0, 1.0);

  float depth = clamp((-vView.z - uDepthRange.x) / (uDepthRange.y - uDepthRange.x), 0.0, 1.0);

  float rings = gridLine(vUv.x / uRing, 0.35);
  float longs = gridLine(vUv.y * uLong, 0.35) * smoothstep(0.12, 0.45, facing);
  float wire = max(rings, longs) * smoothstep(-0.07, 0.01, vUv.x);

  gl_FragColor = vec4(clamp(lum, 0.0, 1.0), depth, wire, 1.0);
}
`;

const compositeVert = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const compositeFrag = /* glsl */ `
uniform sampler2D tHands;
uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform float uMorph;
uniform float uIntro;
uniform float uHands;
uniform float uStars;
uniform vec2 uOrigin;
uniform vec2 uCell;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float diamond(vec2 q, float size, float aa) {
  float d = abs(q.x) + abs(q.y) * 1.3;
  return 1.0 - smoothstep(size - aa, size + aa, d);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 px = 1.0 / uRes;
  vec3 bg = vec3(0.0275, 0.0275, 0.031);

  vec2 cell = uCell * uDpr;
  vec2 ci = floor(frag / cell);
  vec2 cc = (ci + 0.5) * cell;
  vec4 sc = texture2D(tHands, cc * px);
  vec4 sp = texture2D(tHands, frag * px);

  // Sweep from the gap between the fingertips outward.
  vec2 d = (cc - uOrigin * uRes) / uRes.y;
  float thr = clamp(length(d * vec2(0.8, 1.0)) * 0.7, 0.0, 1.0) * 0.82 + hash(ci) * 0.18;
  float m = uMorph * 1.2 - 0.04;
  float wireMix = smoothstep(thr, thr + 0.05, m);
  float front = smoothstep(thr - 0.09, thr, m) * (1.0 - wireMix);

  // On load the matrix resolves outward from the same point.
  float im = uIntro * 1.25 - 0.05;
  float appear = smoothstep(thr, thr + 0.07, im);
  float spark = smoothstep(thr - 0.07, thr, im) * (1.0 - appear);

  // ASCII diamond matrix, glyph size quantised by luminance.
  vec2 q = (frag - cc) / cell.x;
  float aa = 1.2 / cell.x;
  float lum = sc.r;
  float flick = step(0.994, hash(ci + floor(uTime * 5.0)));
  float level = max(floor(clamp(lum + flick * 0.3, 0.0, 1.0) * 6.0 + 0.5) / 6.0, 1.0 / 6.0);
  float glyph = 0.0;
  if (level > 0.3) {
    glyph = diamond(q, mix(0.16, 0.6, (level - 0.33) / 0.67), aa);
  } else {
    glyph = (1.0 - smoothstep(0.09 - aa, 0.09 + aa, length(q))) * mix(0.55, 0.9, level * 3.0);
  }
  // Carve a dark gap wherever one finger passes in front of another.
  vec2 co = vec2(cell.x * 0.9, cell.y * 0.7) * px;
  float cR = texture2D(tHands, cc * px + vec2(co.x, 0.0)).g;
  float cL = texture2D(tHands, cc * px - vec2(co.x, 0.0)).g;
  float cU = texture2D(tHands, cc * px + vec2(0.0, co.y)).g;
  float cD = texture2D(tHands, cc * px - vec2(0.0, co.y)).g;
  float gap = smoothstep(0.03, 0.07, max(max(abs(cR - sc.g), abs(cL - sc.g)), max(abs(cU - sc.g), abs(cD - sc.g))));
  float inside = step(0.5, sc.a) * step(0.5, min(min(texture2D(tHands, cc * px + vec2(co.x, 0.0)).a, texture2D(tHands, cc * px - vec2(co.x, 0.0)).a), min(texture2D(tHands, cc * px + vec2(0.0, co.y)).a, texture2D(tHands, cc * px - vec2(0.0, co.y)).a)));
  glyph *= step(0.5, sc.a) * (1.0 - gap * inside);
  float frontGlyph = diamond(q, 0.5, aa) * step(0.5, sc.a);

  // Wireframe: mesh grid shaded by light, plus silhouette and depth edges.
  float dR = texture2D(tHands, (frag + vec2(1.0, 0.0)) * px).g;
  float dL = texture2D(tHands, (frag - vec2(1.0, 0.0)) * px).g;
  float dU = texture2D(tHands, (frag + vec2(0.0, 1.0)) * px).g;
  float dD = texture2D(tHands, (frag - vec2(0.0, 1.0)) * px).g;
  float edge = smoothstep(0.012, 0.05, length(vec2(dR - dL, dU - dD)));
  float wire = sp.b * sp.a * (0.28 + 0.72 * sp.r) + edge * 0.95;

  float hands = glyph * (1.0 - wireMix - front) + frontGlyph * front + wire * wireMix;
  hands = hands * appear + frontGlyph * spark;
  hands *= uHands;

  // Star-field: one candidate per cell, slow drift, hidden behind the hands.
  vec2 grid = vec2(92.0) * uDpr;
  vec2 sp2 = frag + vec2(uTime * 0.35, uTime * 0.12) * uDpr;
  vec2 si = floor(sp2 / grid);
  vec2 sf = sp2 - si * grid;
  float h1 = hash(si);
  float h2 = hash(si + 7.13);
  float h3 = hash(si + 3.71);
  float r = mix(0.45, 1.15, h1 * h2) * uDpr;
  float star = 1.0 - smoothstep(r * 0.4, r, length(sf - vec2(h1, h2) * grid));
  star *= step(0.5, h3) * mix(0.12, 0.5, hash(si + 1.3));
  star *= 0.7 + 0.3 * sin(uTime * (0.4 + h1) + h2 * 6.2831);
  star *= uStars * (1.0 - sp.a * uHands);

  float v = clamp(hands + star, 0.0, 1.0);
  gl_FragColor = vec4(mix(bg, vec3(1.0), v), 1.0);
}
`;

export interface HandsState {
  time: number;
  /** 0 = diamond matrix, 1 = wireframe. */
  morph: number;
  /** 0..1 load-in; the matrix resolves outward from the fingertips. */
  intro: number;
  /** Overall visibility of the hands. */
  alpha: number;
  stars: number;
  /** 0 = resting, 1 = hands pulled apart and out of frame. */
  part: number;
  /** 0 = hero framing (hands low), 1 = centred. */
  centre: number;
  pointer: THREE.Vector2;
}

export class HandsLayer {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(24, 1, 1, 60);
  private readonly rig = new THREE.Group();
  private readonly left: Hand;
  private readonly right: Hand;
  private readonly surface: THREE.ShaderMaterial;
  private readonly composite: THREE.ShaderMaterial;
  private readonly quadScene = new THREE.Scene();
  private readonly quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private target: THREE.WebGLRenderTarget;
  private halfHeight = 2.5;
  private halfWidth = 4.4;
  /** Vertical rig offset, in half-heights, for the hero and centred framings. */
  private lift = { hero: -0.3, centre: -0.02 };
  private readonly tip = new THREE.Vector3();
  private readonly tipL = new THREE.Vector3();
  private readonly tipR = new THREE.Vector3();
  private centreX: number | null = null;

  /** Resting placement of each hand inside the rig. */
  readonly pose = {
    left: { pos: new THREE.Vector3(-1.8, -0.12, 0), rot: new THREE.Euler(0.6, 0.25, -0.16) },
    right: { pos: new THREE.Vector3(1.8, 0.2, 0), rot: new THREE.Euler(0.62, -0.25, 0.24) },
  };

  constructor() {
    this.surface = new THREE.ShaderMaterial({
      vertexShader: surfaceVert,
      fragmentShader: surfaceFrag,
      side: THREE.DoubleSide,
      uniforms: {
        uLight: { value: new THREE.Vector3(-0.35, 0.85, 0.6) },
        uRing: { value: 0.055 },
        uLong: { value: 14 },
        uDepthRange: { value: new THREE.Vector2(6, 20) },
      },
    });

    this.left = new Hand(ADAM, this.surface);
    this.right = new Hand(CREATOR, this.surface);
    this.right.group.scale.x = -1;
    this.rig.add(this.left.group, this.right.group);
    this.scene.add(this.rig);

    this.target = new THREE.WebGLRenderTarget(2, 2, {
      type: THREE.HalfFloatType,
      samples: 4,
      depthBuffer: true,
    });

    this.composite = new THREE.ShaderMaterial({
      vertexShader: compositeVert,
      fragmentShader: compositeFrag,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tHands: { value: this.target.texture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uDpr: { value: 1 },
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uIntro: { value: 0 },
        uHands: { value: 1 },
        uStars: { value: 1 },
        uOrigin: { value: new THREE.Vector2(0.5, 0.35) },
        uCell: { value: new THREE.Vector2(7, 9) },
      },
    });
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    const quad = new THREE.Mesh(tri, this.composite);
    quad.frustumCulled = false;
    this.quadScene.add(quad);
  }

  resize(width: number, height: number, dpr: number): void {
    const aspect = width / height;
    this.camera.aspect = aspect;
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    // Wide screens frame both forearms; narrow ones crop in on the fingertips.
    const targetWidth = aspect >= 1.2 ? 6.8 : THREE.MathUtils.mapLinear(Math.max(aspect, 0.45), 0.45, 1.2, 3.0, 6.2);
    const dist = targetWidth / 2 / (tan * aspect);
    this.camera.position.set(0, 0, dist);
    this.camera.lookAt(0, 0, 0);
    this.camera.near = Math.max(0.5, dist - 8);
    this.camera.far = dist + 12;
    this.camera.updateProjectionMatrix();
    this.halfHeight = dist * tan;
    this.halfWidth = this.halfHeight * aspect;
    this.surface.uniforms.uDepthRange.value.set(dist - 3, dist + 3);

    const w = Math.round(width * dpr);
    const h = Math.round(height * dpr);
    this.target.setSize(w, h);
    this.composite.uniforms.uRes.value.set(w, h);
    this.composite.uniforms.uDpr.value = dpr;
    // Phones get a finer matrix so fingers still resolve at a small scale.
    const small = width < 720;
    this.composite.uniforms.uCell.value.set(small ? 3.4 : 7, small ? 4.4 : 9);
    // Tall screens have room below the copy, so sit the hands lower.
    const portrait = aspect < 0.8;
    this.lift = portrait ? { hero: -0.4, centre: -0.2 } : { hero: -0.3, centre: -0.02 };
    this.centreX = null;
  }

  render(renderer: THREE.WebGLRenderer, s: HandsState): void {
    const t = s.time;
    const part = s.part * s.part * (3 - 2 * s.part);
    const spread = part * this.halfWidth * 1.1;
    const lift = THREE.MathUtils.lerp(this.lift.hero, this.lift.centre, s.centre) * this.halfHeight;

    this.rig.position.set(0, lift, 0);
    this.rig.rotation.set(-s.pointer.y * 0.05, s.pointer.x * 0.08, 0);

    const drift = Math.sin(t * 0.33) * 0.5 + 0.5;
    const { left: L, right: R } = this.pose;
    this.left.group.position.set(
      L.pos.x - spread + drift * 0.05 + Math.sin(t * 0.41) * 0.02,
      L.pos.y + Math.sin(t * 0.53) * 0.025,
      L.pos.z,
    );
    this.left.group.rotation.set(L.rot.x, L.rot.y, L.rot.z + Math.sin(t * 0.29) * 0.018);
    this.right.group.position.set(
      R.pos.x + spread - drift * 0.04 + Math.sin(t * 0.37 + 1.4) * 0.02,
      R.pos.y + Math.sin(t * 0.47 + 0.8) * 0.03,
      R.pos.z,
    );
    this.right.group.rotation.set(R.rot.x, R.rot.y, R.rot.z + Math.sin(t * 0.31 + 2) * 0.02);

    this.left.update(t, drift);
    this.right.update(t + 3.1, 1 - drift);

    // Keep the gap between the index fingertips centred and start the sweep there.
    this.rig.updateMatrixWorld(true);
    const a = this.left.group.localToWorld(this.tipL.copy(this.left.indexTip));
    const b = this.right.group.localToWorld(this.tipR.copy(this.right.indexTip));
    this.tip.addVectors(a, b).multiplyScalar(0.5);
    if (this.centreX === null) this.centreX = this.tip.x;
    this.rig.position.x = -this.centreX;
    this.tip.x -= this.centreX;
    this.tip.project(this.camera);
    this.composite.uniforms.uOrigin.value.set(this.tip.x * 0.5 + 0.5, this.tip.y * 0.5 + 0.5);

    const u = this.composite.uniforms;
    u.uTime.value = t;
    u.uMorph.value = s.morph;
    u.uIntro.value = s.intro;
    u.uHands.value = s.alpha;
    u.uStars.value = s.stars;

    if (s.alpha > 0.001) {
      renderer.setRenderTarget(this.target);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(this.scene, this.camera);
    }
    renderer.setRenderTarget(null);
    renderer.render(this.quadScene, this.quadCamera);
  }
}

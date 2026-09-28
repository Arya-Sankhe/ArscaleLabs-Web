import type { DigitSpec, HandSpec } from './hand';

type V3 = [number, number, number];
type Curl = [number, number, number];

/* Shared anatomy: index, middle, ring, pinky. Units are roughly decimetres. */
const FINGERS: { base: V3; yaw: number; lens: Curl; radii: [number, number, number, number] }[] = [
  { base: [0.72, 0.02, 0.27], yaw: 0.06, lens: [0.47, 0.28, 0.21], radii: [0.106, 0.095, 0.088, 0.082] },
  { base: [0.75, 0.025, 0.09], yaw: 0, lens: [0.51, 0.31, 0.23], radii: [0.109, 0.098, 0.09, 0.084] },
  { base: [0.73, 0.02, -0.1], yaw: -0.06, lens: [0.48, 0.29, 0.22], radii: [0.103, 0.093, 0.086, 0.08] },
  { base: [0.67, 0.005, -0.27], yaw: -0.14, lens: [0.37, 0.22, 0.19], radii: [0.091, 0.082, 0.076, 0.071] },
];

const THUMB = {
  base: [0.16, -0.06, 0.19] as V3,
  lens: [0.4, 0.3, 0.24] as Curl,
  radii: [0.158, 0.124, 0.11, 0.1] as [number, number, number, number],
};

interface PoseInput {
  thumb: { orient: V3; curl: Curl };
  /** Per finger: first-segment pitch and per-joint curl. */
  fingers: { pitch: number; curl: Curl }[];
}

function digits(p: PoseInput): DigitSpec[] {
  return [
    { ...THUMB, orient: p.thumb.orient, curl: p.thumb.curl, flat: 0.88, phase: 0.4 },
    ...FINGERS.map((f, i) => ({
      base: f.base,
      orient: [0, f.yaw, p.fingers[i].pitch] as V3,
      lens: f.lens,
      radii: f.radii,
      curl: p.fingers[i].curl,
      flat: 0.86,
      phase: i * 0.9,
    })),
  ];
}

/** The receiving hand: limp, index barely lifted, fingers drooping. */
export const ADAM: HandSpec = {
  forearm: [-1, -0.3, -0.1],
  forearmLength: 5.2,
  sway: 0.035,
  speed: 0.55,
  digits: digits({
    thumb: { orient: [0.8, -0.62, -0.28], curl: [0.12, 0.2, 0.18] },
    fingers: [
      { pitch: -0.1, curl: [0.14, 0.22, 0.16] },
      { pitch: -0.15, curl: [0.3, 0.4, 0.28] },
      { pitch: -0.19, curl: [0.38, 0.46, 0.3] },
      { pitch: -0.23, curl: [0.46, 0.52, 0.32] },
    ],
  }),
};

/** The reaching hand: index softly curved and intent, the rest folded. */
export const CREATOR: HandSpec = {
  forearm: [-1, 0.24, -0.16],
  forearmLength: 5.2,
  sway: 0.045,
  speed: 0.7,
  digits: digits({
    thumb: { orient: [0.95, -0.56, -0.2], curl: [0.3, 0.42, 0.3] },
    fingers: [
      { pitch: -0.1, curl: [0.24, 0.34, 0.26] },
      { pitch: -0.08, curl: [0.2, 0.3, 0.24] },
      { pitch: -0.1, curl: [0.28, 0.38, 0.28] },
      { pitch: -0.12, curl: [0.36, 0.44, 0.3] },
    ],
  }),
};

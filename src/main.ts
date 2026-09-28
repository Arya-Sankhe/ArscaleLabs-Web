import * as THREE from 'three';
import { mountCompare } from './compare';
import { mountFooterMark } from './footerMark';
import { mountForge } from './forge';
import { Engine } from './gl/engine';
import { isSideLayout } from './gl/productsLayer';
import './styles.css';

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const stage = $('#stage');
const canvas = $<HTMLCanvasElement>('#gl');
const hero = $('#hero');
const statement = $('#statement');
const systems = [...document.querySelectorAll<HTMLElement>('.system')];
const index = $('.system-index');
const indexItems = [...index.querySelectorAll<HTMLElement>('li')];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/*
 * Timeline in units of 1/PACE viewport-heights scrolled into the stage. It
 * spans 1020 units, so with PACE 0.6 the stage is 100 + 612 = 712vh tall
 * (keep in sync with `.stage` in styles.css). Each system draws on as one
 * flat frame, holds, then breaks into its three planes.
 */
const PACE = 0.6;
const T = {
  heroOut: [8, 70],
  morph: [16, 125],
  centre: [30, 130],
  statementIn: [100, 140],
  statementOut: [190, 225],
  part: [195, 290],
  handsOut: [235, 295],
  stars: [200, 300],
  systems: [
    { enter: [225, 305], split: [330, 395], exit: [465, 515] },
    { enter: [500, 580], split: [605, 670], exit: [740, 790] },
    { enter: [775, 855], split: [880, 945], exit: [5000, 5001] },
  ],
  indexOut: [995, 1015],
} as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (s: number, [a, b]: readonly [number, number]) => clamp01((s - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);

let engine: Engine | null = null;
try {
  engine = new Engine(canvas, $('#labels'));
} catch {
  document.documentElement.classList.add('no-webgl');
}
if (import.meta.env.DEV) (window as unknown as { __arc: unknown }).__arc = { engine };

const pointer = new THREE.Vector2();
const pointerTarget = new THREE.Vector2();
window.addEventListener(
  'pointermove',
  (e) => {
    pointerTarget.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  },
  { passive: true },
);

let vh = window.innerHeight;
let side = false;
function resize() {
  vh = stage.querySelector<HTMLElement>('.stage__sticky')!.clientHeight;
  side = isSideLayout(canvas.clientWidth, canvas.clientHeight);
  $('#systems').classList.toggle('is-side', side);
  engine?.resize(canvas.clientWidth, canvas.clientHeight);
}
window.addEventListener('resize', resize);
resize();

function scrolledVh(): number {
  return (-stage.getBoundingClientRect().top / vh) * (100 / PACE);
}

let glide = 0;
const stopGlide = () => cancelAnimationFrame(glide);
for (const ev of ['wheel', 'touchstart', 'keydown'] as const) window.addEventListener(ev, stopGlide, { passive: true });

/** An eased scroll slow enough for the story in between to play out. */
function glideTo(top: number) {
  stopGlide();
  const from = window.scrollY;
  const dist = top - from;
  if (reduceMotion.matches || Math.abs(dist) < 2) {
    window.scrollTo(0, top);
    return;
  }
  const duration = Math.min(2600, 1200 + Math.abs(dist) * 0.3);
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    window.scrollTo(0, from + dist * e);
    if (t < 1) glide = requestAnimationFrame(step);
  };
  glide = requestAnimationFrame(step);
}

/** Scrolls so system `i` is fully split open. */
function jumpTo(i: number) {
  glideTo(stage.getBoundingClientRect().top + window.scrollY + (T.systems[i].split[1] / 100) * PACE * vh);
}
$('#cue').addEventListener('click', (e) => {
  e.preventDefault();
  jumpTo(0);
});
document.querySelectorAll<HTMLElement>('[data-jump]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    jumpTo(Number(a.dataset.jump));
  }),
);

let s = scrolledVh();
let last = performance.now();
let elapsed = 0;
let handTime = 0;
let introStart = -1;

function setLayer(el: HTMLElement, opacity: number, lift: number) {
  el.style.opacity = opacity.toFixed(3);
  el.style.visibility = opacity < 0.01 ? 'hidden' : 'visible';
  el.style.transform = `translate3d(0, ${lift.toFixed(1)}px, 0)`;
}

function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const still = reduceMotion.matches;

  const target = scrolledVh();
  s = still ? target : s + (target - s) * (1 - Math.exp(-dt * 9));
  pointer.lerp(still ? pointerTarget.set(0, 0) : pointerTarget, 1 - Math.exp(-dt * 3));

  const morph = span(s, T.morph);
  if (!still) {
    elapsed += dt;
    // The wireframe hands move with more life than the resting matrix.
    handTime += dt * (1 + 0.9 * smooth(morph));
  }

  const heroOut = smooth(span(s, T.heroOut));
  setLayer(hero, 1 - heroOut, -heroOut * 48);

  const stIn = smooth(span(s, T.statementIn));
  const stOut = smooth(span(s, T.statementOut));
  setLayer(statement, stIn * (1 - stOut), (1 - stIn) * 24 - stOut * 40);

  const phases = T.systems.map((w) => ({ enter: span(s, w.enter), split: span(s, w.split), exit: span(s, w.exit) }));
  let active = -1;
  systems.forEach((el, i) => {
    const w = T.systems[i];
    // Side by side, the copy waits for the frame to split and move over.
    const inT = smooth(span(s, side ? [w.split[0] + 28, w.split[1]] : [w.enter[1] - 45, w.enter[1] + 5]));
    const outT = smooth(span(s, [w.exit[0], w.exit[0] + 30]));
    const o = inT * (1 - outT);
    setLayer(el, o, (1 - inT) * 20 - outT * 24);
    if (o > 0.5) active = i;
  });
  const indexO = smooth(span(s, side ? [350, 395] : [290, 330])) * (1 - smooth(span(s, T.indexOut)));
  index.style.opacity = indexO.toFixed(3);
  indexItems.forEach((li, i) => li.classList.toggle('is-active', i === active));

  if (engine && stage.getBoundingClientRect().bottom > 0) {
    if (introStart < 0) introStart = now;
    const intro = still ? 1 : clamp01((now - introStart - 250) / 2200);
    const handsOut = smooth(span(s, T.handsOut));
    engine.render({
      hands: {
        time: still ? 2 : handTime,
        morph,
        intro: 1 - Math.pow(1 - intro, 2),
        alpha: 1 - handsOut,
        stars: (1 - 0.6 * smooth(span(s, T.stars))) * smooth(intro),
        part: span(s, T.part) + (1 - smooth(intro)) * 0.05,
        centre: smooth(span(s, T.centre)),
        pointer,
      },
      products: { time: still ? 2 : elapsed, phases, pointer },
    });
  }

  requestAnimationFrame(frame);
}

mountCompare($('#compare'));

new IntersectionObserver((entries) => document.documentElement.classList.toggle('at-footer', entries[entries.length - 1].isIntersecting), {
  threshold: 0.35,
}).observe($('#contact'));

try {
  mountForge($<HTMLCanvasElement>('#forge'));
  mountFooterMark($<HTMLCanvasElement>('#footer-canvas'));
} catch {
  document.documentElement.classList.add('no-canvas');
}

const BUILDS = [
  'Document intelligence',
  'Visual quality inspection',
  'Voice agents',
  'Pricing engines',
  'Knowledge copilots',
];
const ticker = $('#ticker');
let build = 0;
if (!reduceMotion.matches) {
  setInterval(() => {
    ticker.classList.add('is-out');
    setTimeout(() => {
      build = (build + 1) % BUILDS.length;
      ticker.textContent = BUILDS[build];
      ticker.classList.remove('is-out');
    }, 320);
  }, 2600);
}

document.fonts.ready.then(() => document.documentElement.classList.add('is-ready'));
setTimeout(() => document.documentElement.classList.add('is-ready'), 1200);
requestAnimationFrame(frame);

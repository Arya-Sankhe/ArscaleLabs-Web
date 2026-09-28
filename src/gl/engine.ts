import * as THREE from 'three';
import { HandsLayer, type HandsState } from './handsLayer';
import { ProductsLayer, type ProductsState } from './productsLayer';

export interface FrameState {
  hands: HandsState;
  products: ProductsState;
}

export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly hands = new HandsLayer();
  readonly products: ProductsLayer;
  width = 1;
  height = 1;
  dpr = 1;

  constructor(
    readonly canvas: HTMLCanvasElement,
    labelRoot: HTMLElement,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.autoClear = false;
    this.renderer.setClearColor(0x070708, 1);
    this.products = new ProductsLayer(labelRoot);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.dpr = Math.min(window.devicePixelRatio || 1, width < 720 ? 1.75 : 2);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(width, height, false);
    this.hands.resize(width, height, this.dpr);
    this.products.resize(width, height, this.dpr);
  }

  render(state: FrameState): void {
    this.hands.render(this.renderer, state.hands);
    if (this.products.active(state.products)) this.products.render(this.renderer, state.products);
    else this.products.hideLabels();
  }
}

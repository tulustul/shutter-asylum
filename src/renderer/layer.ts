import { Renderer } from './renderer';

export interface LayerOptions {
  canvas?: HTMLCanvasElement;
  renderWholeWorld?: boolean;
  followPlayer?: boolean;
  fill?: string;
  clear?: boolean;
}

export class Layer {

  canvas: HTMLCanvasElement = null;

  options: LayerOptions;

  followPlayer = true;

  fill: string = null;

  renderWholeWorld = false;

  clear = true;

  context: CanvasRenderingContext2D;

  constructor(name: string, private renderer: Renderer, options: LayerOptions = {}) {
    Object.assign(this, options);

    renderer.compositor.layers[name] = this;

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      if (this.renderWholeWorld) {
        this.canvas.width = renderer.engine.worldWidth;
        this.canvas.height = renderer.engine.worldHeight;
      } else {
        this.canvas.width = renderer.canvas.width;
        this.canvas.height = renderer.canvas.height;
      }
    }
    this.context = this.canvas.getContext('2d');
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  activate() {
    if (this.renderer.activeLayer) {
      this.renderer.activeLayer.context.restore();
    }

    this.renderer.activeLayer = this;
    this.renderer.context = this.context;

    if (this.clear) {
      this.clearCanvas();
    }

    if (this.fill) {
      this.context.fillStyle = this.fill;
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    if (this.followPlayer) {
      this.context.save();
      this.context.translate(this.renderer.camera.pos.x, this.renderer.camera.pos.y);
    }
  }
}

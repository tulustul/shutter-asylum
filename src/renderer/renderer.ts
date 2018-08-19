import { Layer } from './layer';
import { SystemsRenderer } from './systems-renderer';
import { Postprocessing } from './postprocessing';
import { FogOfWar } from './fog-of-war';

import { Camera } from '../camera';
import { EntityEngine } from '../systems/ecs';

export class Renderer {

  context: CanvasRenderingContext2D;

  baseLayer = new Layer(this, {
    followPlayer: false,
    fill: 'black',
  });

  checkColorsLayer: Layer;
  // DEBUG
  // checkColorsLayer = new Layer(this);

  postprocessing: Postprocessing;

  systemsRenderer: SystemsRenderer;

  fogOfWar: FogOfWar;

  activeLayer: Layer;

  texture: HTMLImageElement;

  gradientCache = new Map<number, CanvasGradient>();

  ready = false;

  constructor(
    public engine: EntityEngine,
    public camera: Camera,
    public canvas: HTMLCanvasElement,
  ) {
    this.postprocessing = new Postprocessing(this.canvas);

    this.systemsRenderer = new SystemsRenderer(this);

    this.fogOfWar = new FogOfWar(this);

    this.texture = new Image();
    this.texture.src = 'tex.png';
    this.texture.onload = () => this.ready = true;
  }

  render() {SystemsRenderer
    if (!this.ready) {
      return;
    }

    this.systemsRenderer.render();

    this.fogOfWar.render();

    this.composite();

    this.postprocessing.postprocess(this.baseLayer);

    // DEBUG
    // if (Math.round(this.engine.time) % 300 === 0) {
    //   this.checkDistinctColors();
    // }
  }

  composite() {
    this.systemsRenderer.movingPropsLayer.context.globalCompositeOperation = 'destination-in';
    this.systemsRenderer.movingPropsLayer.context.drawImage(this.fogOfWar.visibilityMaskLayer.canvas, 0, 0);
    this.systemsRenderer.movingPropsLayer.context.globalCompositeOperation = 'source-over';

    this.systemsRenderer.particlesLayer.context.globalCompositeOperation = 'destination-in';
    this.systemsRenderer.particlesLayer.context.drawImage(this.fogOfWar.visibilityMaskLayer.canvas, 0, 0);
    this.systemsRenderer.particlesLayer.context.globalCompositeOperation = 'source-over';

    this.baseLayer.activate();

    this.context.globalCompositeOperation = 'source-over'
    this.drawLayer(this.systemsRenderer.propsLayer);

    this.context.globalCompositeOperation = 'multiply'
    this.drawLayer(this.systemsRenderer.bloodLayer);

    this.context.globalCompositeOperation = 'source-over'
    this.drawLayer(this.systemsRenderer.higherPropsLayer);

    this.context.drawImage(this.systemsRenderer.movingPropsLayer.canvas, 0, 0);

    this.context.globalCompositeOperation = 'overlay';
    this.drawLayer(this.systemsRenderer.lightsLayer);

    this.context.globalCompositeOperation = 'source-over'
    this.context.drawImage(this.systemsRenderer.particlesLayer.canvas, 0, 0);

    this.context.globalCompositeOperation = 'multiply';
    this.context.drawImage(this.fogOfWar.fogOfWarLayer.canvas, 0, 0);

    this.context.globalCompositeOperation = 'destination-in';
    this.drawLayer(this.fogOfWar.revealedMaskLayer);

    this.context.globalCompositeOperation = 'source-over'
    this.context.drawImage(this.systemsRenderer.interfaceLayer.canvas, 0, 0);
  }

  drawLayer(layer: Layer) {
    this.context.drawImage(layer.canvas,
      -this.camera.pos.x, -this.camera.pos.y,
      this.canvas.width, this.canvas.height,
      0, 0,
      this.canvas.width, this.canvas.height,
    );
  }

  checkDistinctColors() {
    this.checkColorsLayer.context.drawImage(
      this.canvas, 0, 0, this.canvas.width, this.canvas.height,
    );
    const data = this.checkColorsLayer.context.getImageData(
      0, 0, this.canvas.width, this.canvas.height,
    ).data;
    const colors = new Set<string>();
    for (let i = 0; i < data.length; i += 4) {
      const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
      colors.add(color);
    }
    const text = `Number of colors: ${colors.size}`;
    colors.size > 32 ? console.error(text) : console.log(text);
  }
}

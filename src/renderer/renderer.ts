import { Layer } from './layer';
import { SystemsRenderer } from './systems-renderer';
import { Postprocessing } from './postprocessing';
import { FogOfWar } from './fog-of-war';
import { GuiRenderer } from './gui';
import { Compositor } from './compositor';

import { Camera } from '../camera';
import { EntityEngine } from '../systems/ecs';

export class Renderer {

  context: CanvasRenderingContext2D;

  baseLayer: Layer;

  checkColorsLayer: Layer;

  postprocessing: Postprocessing;

  systemsRenderer: SystemsRenderer;

  guiRenderer: GuiRenderer;

  fogOfWar: FogOfWar;

  compositor: Compositor;

  activeLayer: Layer;

  texture: HTMLImageElement;

  ready = false;

  constructor(
    public engine: EntityEngine,
    public camera: Camera,
    public canvas: HTMLCanvasElement,
  ) {
    this.compositor = new Compositor(this);

    this.postprocessing = new Postprocessing(this.canvas);

    this.systemsRenderer = new SystemsRenderer(this);

    this.guiRenderer = new GuiRenderer(this);

    this.fogOfWar = new FogOfWar(this);

    this.baseLayer = new Layer('base', this, {
      followPlayer: false,
      fill: 'black',
    });

    // DEBUG
    this.checkColorsLayer = new Layer('', this);

    this.texture = new Image();
    this.texture.src = 'tex.png';
    this.texture.onload = () => this.ready = true;
  }

  render() {
    if (!this.ready) {
      return;
    }

    this.systemsRenderer.render();

    this.fogOfWar.render();

    this.guiRenderer.render();

    this.compositor.compose();

    this.postprocessing.postprocess(this.baseLayer);

    // DEBUG
    if (Math.round(this.engine.time) % 300 === 0) {
      this.checkDistinctColors();
    }
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

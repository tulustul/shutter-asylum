import { Renderer } from './renderer';
import { Layer } from './layer';

type BlendMode = 'source-over' | 'destination-in' | 'multiply' | 'overlay';

interface CompositorEntry {
  source?: string;
  target?: string;
  blendMode?: BlendMode;
  offset?: boolean;
}

// missing fields just repeat from the last entry
const COMPOSITOR_ENTRIES: CompositorEntry[] = [
  {
    target: 'movingProps',
    source: 'visibilityMask',
    blendMode: 'destination-in',
  }, {
    target: 'particles',
  }, {
    target: 'base',
    source: 'props',
    blendMode: 'source-over',
    offset: true,
  }, {
    source: 'blood',
    blendMode: 'multiply',
  }, {
    source: 'higherProps',
    blendMode: 'source-over',
  }, {
    source: 'movingProps',
    offset: false,
  }, {
    source: 'lights',
    blendMode: 'overlay',
    offset: true,
  }, {
    source: 'particles',
    blendMode: 'source-over',
    offset: false,
  }, {
    source: 'fogOfWar',
    blendMode: 'multiply',
  }, {
    source: 'revealedMask',
    blendMode: 'destination-in',
    offset: true,
  }, {
    source: 'interface',
    blendMode: 'source-over',
    offset: false,
  },
];

export class Compositor {

  constructor(private renderer: Renderer) {}

  layers: {[key: string]: Layer} = {};

  get camera() {
    return this.renderer.camera;
  }

  get canvas() {
    return this.renderer.canvas;
  }

  compose() {
    const entry: CompositorEntry = {};

    for (const nextEntry of COMPOSITOR_ENTRIES) {
      if (nextEntry.target === 'base') {
        this.layers.base.activate();
      }

      Object.assign(entry, nextEntry);

      const target = this.layers[entry.target];
      const source = this.layers[entry.source];

      target.context.globalCompositeOperation = entry.blendMode;

      if (entry.offset) {
        this.drawLayerWithOffset(target, source);
      } else {
        target.context.drawImage(source.canvas, 0, 0);
      }
    }
  }

  drawLayerWithOffset(target: Layer, source: Layer) {
    target.context.drawImage(source.canvas,
      -this.camera.pos.x, -this.camera.pos.y,
      this.canvas.width, this.canvas.height,
      0, 0,
      this.canvas.width, this.canvas.height,
    );
  }

}

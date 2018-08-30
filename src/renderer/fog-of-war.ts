import { Layer } from './layer';
import { Renderer } from './renderer';
import { renderVisibilityMask } from './visibility-mask';

import { ColisionSystem } from '../systems/colision';
import { PlayerSystem } from '../systems/player';

export class FogOfWar {

  constructor(private renderer: Renderer) {}

  revealedMaskLayer = new Layer('revealedMask', this.renderer, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  visibilityMaskLayer = new Layer('visibilityMask', this.renderer);

  fogOfWarLayer = new Layer('fogOfWar', this.renderer, {
    fill: '#aaa',
    followPlayer: false,
  });

  get context() {
    return this.renderer.context;
  }

  get engine() {
    return this.renderer.game.engine;
  }

  get canvas() {
    return this.renderer.game.canvas;
  }

  get camera() {
    return this.renderer.game.camera;
  }

  render() {
    const colisionSystem = this.engine.getSystem<ColisionSystem>(ColisionSystem);
    const playerSystem = this.engine.getSystem<PlayerSystem>(PlayerSystem);

    if (!playerSystem.player) {
      return;
    }

    this.visibilityMaskLayer.activate();

    const playerPos = playerSystem.player.agent.posAndVel.pos;

    const maxDistance = Math.sqrt(
      Math.pow(this.canvas.width, 2) + Math.pow(this.canvas.height, 2),
    );

    this.context.fillStyle = 'white';
    renderVisibilityMask(
      this.context, colisionSystem, playerPos,
      0, Math.PI * 2, maxDistance,
    );

    this.revealedMaskLayer.context.drawImage(this.visibilityMaskLayer.canvas,
      0, 0,
      this.canvas.width, this.canvas.height,
      -this.camera.pos.x, -this.camera.pos.y,
      this.canvas.width, this.canvas.height,
    );

    this.fogOfWarLayer.activate();
    this.context.drawImage(this.visibilityMaskLayer.canvas, 0, 0);
  }

}

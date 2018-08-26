import { Layer } from './layer';
import { Renderer } from './renderer';

import { TILE_SIZE } from '../constants';
import { Vector2 } from '../vector';
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
    fill: 'grey',
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
    const widthTiles = Math.ceil(this.canvas.width / TILE_SIZE);
    const heightTiles = Math.ceil(this.canvas.height / TILE_SIZE);

    const currentPos = new Vector2(
      playerPos.x - this.canvas.width / 2,
      playerPos.y - this.canvas.height / 2
    );

    const points: Vector2[] = [];
    const toCheck: Vector2[] = [];

    for (let x = 0; x < widthTiles; x++) {
      currentPos.x += TILE_SIZE;
      toCheck.push(currentPos.copy());
    }
    for (let y = 0; y < heightTiles; y++) {
      currentPos.y += TILE_SIZE;
      toCheck.push(currentPos.copy());
    }
    for (let x = 0; x < widthTiles; x++) {
      currentPos.x -= TILE_SIZE;
      toCheck.push(currentPos.copy());
    }
    for (let y = 0; y < heightTiles; y++) {
      currentPos.y -= TILE_SIZE;
      toCheck.push(currentPos.copy());
    }

    for (const p of toCheck) {
      points.push(colisionSystem.castRay(playerPos, p) || p);
    }

    this.context.fillStyle = 'white';
    this.context.beginPath();
    this.context.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      this.context.lineTo(p.x, p.y);
    }
    this.context.closePath();
    this.context.fill();

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

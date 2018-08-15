import { Camera } from './camera.js';
import { EntityEngine } from './systems/ecs.js';
import { AgentSystem } from './systems/agent.js';
import { PropsSystem } from "./systems/props.js";
import { TILE_SIZE } from './constants.js';
import { ProjectileSystem } from './systems/projectile.js';
import { PlayerSystem } from './systems/player.js';

interface SpriteMetadata {
  x: number;
  y: number;
  width: number;
  height: number;
}

type SpriteMap = {[key: string]: SpriteMetadata};

const SPRITES_MAP: SpriteMap = {
  'floor': {x: 0, y: 0, width: 20, height: 20},
  'wall': {x: 0, y: 20, width: 20, height: 20},
}

export class Renderer {

  context: CanvasRenderingContext2D;

  texture: HTMLImageElement;

  constructor(
    private engine: EntityEngine,
    private camera: Camera,
    private canvas: HTMLCanvasElement,
  ) {
    this.context = this.canvas.getContext("2d");
    this.context.imageSmoothingEnabled = false;

    this.texture = new Image();
    // imageObj.onload = () => this.texture = imageObj;
    this.texture.src = '/assets/tex.png';

  }

  renderProps() {
    const propsSystem = this.engine.getSystem<PropsSystem>(PropsSystem);
    for (const prop of propsSystem.entities) {
      // this.context.fillStyle = prop.color;
      // this.context.fillRect(prop.pos.x, prop.pos.y, TILE_SIZE, TILE_SIZE);
      const sprite = SPRITES_MAP[prop.sprite];
      this.context.drawImage(
        this.texture,
        sprite.x, sprite.y,
        sprite.width, sprite.height,
        prop.pos.x, prop.pos.y,
        sprite.width, sprite.height,
      );
    }
  }

  renderAgents() {
    for (const agent of this.engine.getSystem<AgentSystem>(AgentSystem).entities) {
      this.context.save();
      this.context.translate(
        agent.posAndVel.pos.x,
        agent.posAndVel.pos.y,
      );
      this.context.save();

      this.context.rotate(agent.rot);
      this.context.fillStyle = 'green';
      this.context.fillRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
      this.context.restore();

      this.context.fillStyle = 'red';
      const healthBar = agent.health * 4;
      this.context.fillRect(-TILE_SIZE / 2, -TILE_SIZE / 2, healthBar, 1);

      this.context.restore();
    }
  }

  renderProjectiles() {
    this.context.fillStyle = 'orange';
    for (const projectile of this.engine.getSystem<ProjectileSystem>(ProjectileSystem).entities) {
      const pos = projectile.posAndVel.pos;
      this.context.fillRect(pos.x, pos.y, 2, 2);
    }
  }

  renderInterface() {
    const player = this.engine.getSystem<PlayerSystem>(PlayerSystem).entities[0];

    this.context.fillStyle = 'red';
    if (player) {
      const weapon = player.agent.weapon;

      if (weapon.reloading) {
        this.context.fillText('REL', 170, 220);
      }

      const text = `
  ${weapon.options.name}
  ${weapon.bulletsInMagazine} / ${weapon.options.magazineCapacity}
  (${weapon.totalBullets})
  health: ${player.agent.health / 5 * 100}%
  `;
      this.context.fillText(text, 0, 380);
    } else {
      this.context.fillText('GAME OVER', 200, 200);
    }
  }

  render() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.save();
    this.context.translate(this.camera.pos.x, this.camera.pos.y);

    this.renderProps();
    this.renderAgents();
    this.renderProjectiles();

    this.context.restore();

    this.renderInterface();
  }
}

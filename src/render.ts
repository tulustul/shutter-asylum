import { Camera } from './camera.js';
import { EntityEngine } from './systems/ecs.js';
import { AgentSystem } from './systems/agent.js';
import { PropsSystem } from "./systems/props.js";
import { TILE_SIZE } from './constants.js';
import { ProjectileSystem } from './systems/projectile.js';
import { PlayerSystem } from './systems/player.js';

export class Renderer {

  context: CanvasRenderingContext2D;

  constructor(
    private engine: EntityEngine,
    private camera: Camera,
    private canvas: HTMLCanvasElement,
  ) {
    this.context = this.canvas.getContext("2d");
    this.context.imageSmoothingEnabled = false;
  }

  renderProps() {
    const propsSystem = this.engine.getSystem<PropsSystem>(PropsSystem);
    for (const prop of propsSystem.entities) {
      this.context.fillStyle = prop.color;
      this.context.fillRect(prop.pos.x, prop.pos.y, TILE_SIZE, TILE_SIZE);
    }
  }

  renderAgents() {
    for (const agent of this.engine.getSystem<AgentSystem>(AgentSystem).entities) {
      this.context.save();
      this.context.translate(
        agent.posAndVel.pos.x,
        agent.posAndVel.pos.y,
      );
      this.context.rotate(agent.rot);
      this.context.fillStyle = 'green';
      this.context.fillRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
      // this.context.fillRect(-7, -7, 4, 15);
      // this.context.fillRect(1, -7, 4, 15);
      // this.context.fillRect(-7, -7, 10, 7);
      this.context.restore();
      // this.context.fillRect(agent.posAndVel.pos.x, agent.posAndVel.pos.y, 1, 1);
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
    const weapon = player.agent.weapon;
    const reloadingText = weapon.reloading ? 'RELOADING' : '';
    const text = `${weapon.options.name} ${weapon.bulletsInMagazine} / ${weapon.options.magazineCapacity} (${weapon.totalBullets}) ${reloadingText}`;
    this.context.fillText(text, 0, 380);
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

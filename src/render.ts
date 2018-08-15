import { Camera } from './camera';
import { EntityEngine } from './systems/ecs';
import { AgentSystem } from './systems/agent';
import { PropsSystem } from "./systems/props";
import { TILE_SIZE } from './constants';
import { ProjectileSystem } from './systems/projectile';
import { PlayerSystem } from './systems/player';
import { LightsSystem } from './systems/lighting';

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
  'agent': {x: 20, y: 0, width: 20, height: 30},
}

interface LayerOptions {
  canvas?: HTMLCanvasElement;
  followPlayer?: boolean;
  fillBlack?: boolean;
}

class Layer {

  canvas: HTMLCanvasElement = null;

  options: LayerOptions;

  followPlayer = true;

  fillBlack = true;

  context: CanvasRenderingContext2D;

  constructor(private renderer: Renderer, options: LayerOptions = {}) {
    Object.assign(this, options);

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = renderer.canvas.width;
      this.canvas.height = renderer.canvas.height;
    }
    this.context = this.canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;
  }

  activate() {
    if (this.renderer.activeLayer) {
      this.renderer.activeLayer.context.restore();
    }

    this.renderer.activeLayer = this;
    this.renderer.context = this.context;

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.fillBlack) {
      this.context.fillStyle = 'black';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    if (this.followPlayer) {
      this.context.save();
      this.context.translate(this.renderer.camera.pos.x, this.renderer.camera.pos.y);
    }
  }
}

export class Renderer {

  context: CanvasRenderingContext2D;

  lightsLayer = new Layer(this);

  propsLayer = new Layer(this);

  particlesLayer = new Layer(this, {fillBlack: false});

  interfaceLayer = new Layer(this, {followPlayer: false, fillBlack: false});

  baseLayer: Layer;

  activeLayer: Layer;

  texture: HTMLImageElement;

  constructor(
    private engine: EntityEngine,
    public camera: Camera,
    public canvas: HTMLCanvasElement,
  ) {
    this.baseLayer = new Layer(this, {canvas, followPlayer: false});

    this.texture = new Image();
    this.texture.src = 'tex.png';
  }

  renderProps() {
    const propsSystem = this.engine.getSystem<PropsSystem>(PropsSystem);
    for (const prop of propsSystem.entities) {
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
    const sprite = SPRITES_MAP.agent;
    for (const agent of this.engine.getSystem<AgentSystem>(AgentSystem).entities) {
      this.context.save();
      this.context.translate(
        agent.posAndVel.pos.x,
        agent.posAndVel.pos.y,
      );
      this.context.save();

      this.context.rotate(agent.rot);
      this.context.drawImage(
        this.texture,
        sprite.x, sprite.y,
        sprite.width, sprite.height,
        -TILE_SIZE / 2, -TILE_SIZE / 2,
        sprite.width, sprite.height,
      )
      this.context.restore();

      this.context.fillStyle = 'red';
      const healthBar = agent.health * 4;
      this.context.fillRect(-TILE_SIZE / 2, TILE_SIZE / 2 + 5, healthBar, 1);

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
        this.context.fillText('REL', 170, 230);
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

  renderLights() {
    const lightsSystem = this.engine.getSystem<LightsSystem>(LightsSystem);
    const lightSize = TILE_SIZE * 15;

    const gradient = this.context.createRadialGradient(lightSize / 2, lightSize / 2, 30, lightSize / 2, lightSize / 2, lightSize / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 100');
    gradient.addColorStop(1, 'transparent');

    this.context.fillStyle = gradient;

    for (const light of lightsSystem.entities) {
      if (light.options.enabled) {
        this.context.save()
        this.context.translate(
          light.pos.x - lightSize / 2, light.pos.y - lightSize / 2,
        )
        this.context.fillRect(0, 0, lightSize, lightSize);
        this.context.restore();
      }
    }
  }

  render() {
    this.lightsLayer.activate();
    this.renderLights();

    this.propsLayer.activate();
    this.renderProps();
    this.renderAgents();

    this.particlesLayer.activate();
    this.renderProjectiles();

    this.interfaceLayer.activate();
    this.renderInterface();

    this.composite();
  }

  composite() {
    this.baseLayer.activate();

    this.context.globalCompositeOperation = 'source-over'
    this.context.drawImage(this.propsLayer.canvas, 0, 0);

    this.context.globalCompositeOperation = 'overlay';
    this.context.drawImage(this.lightsLayer.canvas, 0, 0);

    this.context.globalCompositeOperation = 'source-over'
    this.context.drawImage(this.particlesLayer.canvas, 0, 0);

    this.context.globalCompositeOperation = 'source-over'
    this.context.drawImage(this.interfaceLayer.canvas, 0, 0);
  }
}

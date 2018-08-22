import { Layer } from './layer';
import { Renderer } from './renderer';

import { TILE_SIZE } from '../constants';
import { Vector2 } from '../vector';

import { AgentSystem } from '../systems/agent';
import { PropsSystem, PropComponent } from '../systems/props';
import { PlayerSystem } from '../systems/player';
import { LightsSystem, LightComponent } from '../systems/lighting';
import { ParticlesSystem } from '../systems/particles';
import { BloodSystem } from '../systems/blood';
import { ActionsSystem } from '../systems/actions';
import { FlashlightSystem } from '../systems/flashlight';

interface SpriteMetadata {
  x: number;
  y: number;
  w: number;
  h: number;
}

type SpriteMap = {[key: string]: SpriteMetadata};

const SPRITES_MAP: SpriteMap = {
  'stone': {x: 0, y: 0, w: 20, h: 20},
  'wood': {x: 0, y: 40, w: 20, h: 20},
  'tiles': {x: 40, y: 40, w: 20, h: 20},
  'carpet': {x: 60, y: 40, w: 20, h: 20},
  'carpetBorder': {x: 60, y: 37, w: 20, h: 3},
  'wall': {x: 0, y: 20, w: 20, h: 20},
  'agent': {x: 21, y: 0, w: 20, h: 25},
  'corpse': {x: 40, y: 0, w: 40, h: 20},
  'door': {x: 20, y: 40, w: 20, h: 20},
  'light': {x: 20, y: 30, w: 5, h: 10},
  'lightBroken': {x: 25, y: 30, w: 7, h: 10},
}

export class SystemsRenderer {

  flashlightPrerenderLayer = new Layer('', this.renderer);

  staticLightsLayer = new Layer('staticLights', this.renderer, {
    renderWholeWorld: true,
    followPlayer: false,
    fill: 'black',
  });

  flashlightLayer = new Layer('flashlight', this.renderer, {fill: 'black'});

  combinedLightsLayer = new Layer('combinedLights', this.renderer, {
    fill: 'black',
  });

  propsLayer = new Layer('props', this.renderer, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  higherPropsLayer = new Layer('higherProps', this.renderer, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  movingPropsLayer = new Layer('movingProps', this.renderer);

  particlesLayer = new Layer('particles', this.renderer);

  bloodLayer = new Layer('blood', this.renderer, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  activeLayer: Layer;

  constructor(private renderer: Renderer) { }

  get context() {
    return this.renderer.context;
  }

  get engine() {
    return this.renderer.engine;
  }

  renderLowerProps() {
    const propsSystem = this.engine.getSystem<PropsSystem>(PropsSystem);
    for (const zIndex of propsSystem.zIndexes) {
      this.renderProps(propsSystem.toRender[zIndex]);
      propsSystem.toRender[zIndex] = [];
    }
  }

  renderHigherProps() {
    const propsSystem = this.engine.getSystem<PropsSystem>(PropsSystem);
    this.renderProps(propsSystem.higherToRender);
    propsSystem.higherToRender = [];
  }

  renderChangingProps() {
    const propsSystem = this.engine.getSystem<PropsSystem>(PropsSystem);
    this.renderProps(propsSystem.entities);
  }

  renderProps(props: PropComponent[]) {
    for (const prop of props) {
      const isRot = prop.rot !== null;
      const sprite = SPRITES_MAP[prop.sprite];
      if (isRot) {
        this.context.save();
        const offset = prop.pivot.copy().rotate(prop.rot);
        this.context.translate(
          prop.pos.x - offset.x + prop.offset.x,
          prop.pos.y - offset.y + prop.offset.y,
        );
        this.context.rotate(prop.rot);
      }
      this.context.drawImage(
        this.renderer.texture,
        sprite.x, sprite.y,
        sprite.w, sprite.h,
        isRot ? 0 : prop.pos.x, isRot ? 0: prop.pos.y,
        sprite.w, sprite.h,
      );
      if (isRot) {
        this.context.restore();
      }
    }
  }

  renderAgents() {
    const sprite = SPRITES_MAP.agent;

    this.context.globalCompositeOperation = 'source-over';

    for (const agent of this.engine.getSystem<AgentSystem>(AgentSystem).entities) {
      this.context.save();
      this.context.translate(
        agent.posAndVel.pos.x,
        agent.posAndVel.pos.y,
      );
      this.context.save();

      this.context.rotate(agent.rot);
      this.context.drawImage(
        this.renderer.texture,
        sprite.x, sprite.y,
        sprite.w, sprite.h,
        -TILE_SIZE / 2, -TILE_SIZE / 2,
        sprite.w, sprite.h,
      )
      this.context.restore();

      this.context.fillStyle = 'red';
      const healthBar = (TILE_SIZE / agent.maxHealth) * agent.health;
      this.context.fillRect(-TILE_SIZE / 2, TILE_SIZE / 2 + 5, healthBar, 1);

      this.context.restore();
    }
  }

  renderParticles() {
    this.context.globalCompositeOperation = 'source-over';

    const particleSystem = this.engine.getSystem<ParticlesSystem>(ParticlesSystem);
    for (const color of Object.keys(particleSystem.byColors)) {
      this.context.strokeStyle = color;
      for (const particle of particleSystem.byColors[color]) {
        const pos = particle.posAndVel.pos;
        const vel = particle.posAndVel.vel;

        this.context.beginPath();
        this.context.moveTo(pos.x, pos.y);
        this.context.lineTo(pos.x + vel.x, pos.y + vel.y);
        this.context.stroke();
      }
    }
  }

  renderLights() {
    const lightsSystem = this.engine.getSystem<LightsSystem>(LightsSystem);

    if (!lightsSystem.needRerender) {
      return;
    }
    lightsSystem.needRerender = false;

    this.staticLightsLayer.activate();
    this.context.globalCompositeOperation = 'lighten';

    for (const light of lightsSystem.entities) {
      if (light.enabled) {
        const radius = light.radius;

        const gradient = this.context.createRadialGradient(
          radius / 2, radius / 2, 0,
          radius / 2 + (radius / 2 * light.direction.x),
          radius / 2 + (radius / 2 * light.direction.y),
          radius / 2,
        );
        gradient.addColorStop(0, light.power);
        gradient.addColorStop(1, 'transparent');

        this.context.fillStyle = gradient;

        this.context.save()
        this.context.translate(
          light.pos.x - radius / 2, light.pos.y - radius / 2,
        )
        this.context.fillRect(0, 0, radius * 2, radius * 2);
        this.context.restore();
      }
    }
    this.context.globalCompositeOperation = 'source-over';
  }

  renderBlood() {
    const bloodSystem = this.engine.getSystem<BloodSystem>(BloodSystem);

    this.context.fillStyle = 'red';
    for (const blood of bloodSystem.toRender) {
      this.context.fillRect(blood.x, blood.y, 2, 2);
    }
    for (const leak of bloodSystem.leaksToRender) {
      this.context.beginPath();
      this.context.arc(leak.pos.x, leak.pos.y, leak.size, 0, 2 * Math.PI);
      this.context.fill();
    }
    bloodSystem.toRender = [];
    bloodSystem.leaksToRender = [];
  }

  renderFlashlights() {
    this.context.globalCompositeOperation = 'lighten';
    const flashlightSystem = this.engine.getSystem<FlashlightSystem>(FlashlightSystem);
    const lightSize = 120;
    const gradient = this.context.createRadialGradient(
      0, 0, 20,
      0, 0, lightSize,
    );
    gradient.addColorStop(0, '#ddd');
    gradient.addColorStop(1, 'transparent');

    this.context.fillStyle = gradient;
    for (const flashlight of flashlightSystem.entities) {
      const pos = flashlight.agent.posAndVel.pos;
      const direction = flashlight.agent.rot;
      this.context.save();
      this.context.translate(pos.x, pos.y);
      this.context.rotate(direction + Math.PI / 4);

      this.context.fillRect(0, 0, lightSize, lightSize);
      this.context.restore();
    }
  }

  render() {
    this.renderLights();

    this.propsLayer.activate();
    this.renderLowerProps();

    this.movingPropsLayer.activate();
    this.renderAgents();
    this.renderChangingProps();

    this.bloodLayer.activate();
    this.renderBlood();

    this.higherPropsLayer.activate();
    this.renderHigherProps();

    this.particlesLayer.activate();
    this.renderParticles();

    this.flashlightLayer.activate()
    this.renderFlashlights();

    // to be filled by compositor
    this.combinedLightsLayer.activate();
  }

}

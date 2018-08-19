import { Layer } from './layer';
import { Renderer } from './renderer';

import { TILE_SIZE } from '../constants';
import { Vector2 } from '../vector';

import { AgentSystem } from '../systems/agent';
import { PropsSystem, PropComponent } from '../systems/props';
import { PlayerSystem } from '../systems/player';
import { LightsSystem } from '../systems/lighting';
import { ParticlesSystem } from '../systems/particles';
import { BloodSystem } from '../systems/blood';
import { ActionsSystem } from '../systems/actions';

interface SpriteMetadata {
  x: number;
  y: number;
  w: number;
  h: number;
}

type SpriteMap = {[key: string]: SpriteMetadata};

const SPRITES_MAP: SpriteMap = {
  'floor': {x: 0, y: 0, w: 20, h: 20},
  'wood': {x: 0, y: 40, w: 20, h: 20},
  'wall': {x: 0, y: 20, w: 20, h: 20},
  'agent': {x: 21, y: 0, w: 20, h: 25},
  'corpse': {x: 40, y: 0, w: 40, h: 20},
  'door': {x: 20, y: 40, w: 20, h: 20},
}

export class SystemsRenderer {

  lightsLayer = new Layer('lights', this.renderer, {
    renderWholeWorld: true,
    followPlayer: false,
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

  interfaceLayer = new Layer('interface', this.renderer, {followPlayer: false});

  activeLayer: Layer;

  gradientCache = new Map<number, CanvasGradient>();

  constructor(private renderer: Renderer) { }

  get context() {
    return this.renderer.context;
  }

  get engine() {
    return this.renderer.engine;
  }

  renderLowerProps() {
    const propsSystem = this.engine.getSystem<PropsSystem>(PropsSystem);
    this.renderProps(propsSystem.toRender);
    propsSystem.toRender = [];
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
        this.context.translate(prop.pos.x - offset.x, prop.pos.y - offset.y);
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
      this.context.fillStyle = color;
      for (const particle of particleSystem.byColors[color]) {
        const pos = particle.posAndVel.pos;
        this.context.fillRect(pos.x, pos.y, particle.size, particle.size);
      }
    }
  }

  renderInterface() {
    const player = this.engine.getSystem<PlayerSystem>(PlayerSystem).entities[0];
    const action = this.engine.getSystem<ActionsSystem>(ActionsSystem).action;

    this.context.fillStyle = 'red';
    this.context.font = '12px sans-serif';
    if (player) {
      const weapon = player.agent.weapon;
      let contextText = '';

      if (weapon.reloading) {
        contextText = 'REL ';
      }

      if (action) {
        contextText += `${action.text} (E)`;
      }


      this.context.fillText(contextText, 170, 230);

      const text = `
  ${weapon.options.name}
  ${weapon.bulletsInMagazine} / ${weapon.options.magazineCapacity}
  (${weapon.totalBullets})
  `;
      this.context.fillText(text, 0, 380);
    } else {
      this.context.font = '20px sans-serif';
      const gameoverText = 'YOU DIED';
      const textWidth = this.context.measureText(gameoverText).width;
      this.context.fillText(
        gameoverText, this.renderer.canvas.width / 2 - textWidth / 2, 150,
      );
    }
  }

  renderLights() {
    const lightsSystem = this.engine.getSystem<LightsSystem>(LightsSystem);

    if (!lightsSystem.needRerender) {
      return;
    }
    lightsSystem.needRerender = false;

    this.lightsLayer.activate();
    this.context.globalCompositeOperation = 'lighten';

    for (const light of lightsSystem.entities) {
      if (light.options.enabled) {
        const lightSize = light.options.size;
        const gradient = this.gradientCache.get(light.options.size)

        if (!gradient) {
          const gradient = this.context.createRadialGradient(
            lightSize / 2, lightSize / 2, lightSize / 10,
            lightSize / 2, lightSize / 2, lightSize / 2,
          );
          gradient.addColorStop(0, 'white');
          gradient.addColorStop(1, 'transparent');
          this.gradientCache.set(lightSize, gradient);
        }

        this.context.fillStyle = gradient;

        this.context.save()
        this.context.translate(
          light.pos.x - lightSize / 2, light.pos.y - lightSize / 2,
        )
        this.context.fillRect(0, 0, lightSize, lightSize);
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

    this.interfaceLayer.activate();
    this.renderInterface();
  }

}

import { Layer } from './layer';
import { Renderer } from './renderer';
import { renderVisibilityMask } from './visibility-mask';

import { TILE_SIZE } from '../constants';
import { SPRITES_MAP, SpriteMetadata } from '../sprites';

import { AgentSystem } from '../systems/agent';
import { PropsSystem, PropComponent } from '../systems/props';
import { LightsSystem } from '../systems/lighting';
import { ParticlesSystem } from '../systems/particles';
import { BloodSystem } from '../systems/blood';
import { FlashlightSystem } from '../systems/flashlight';
import { ColisionSystem } from '../systems/colision';

export class SystemsRenderer {

  flashlightPrerenderLayer = new Layer('', this.renderer);

  staticLightsLayer = new Layer('staticLights', this.renderer, {
    renderWholeWorld: true,
    followPlayer: false,
  });

  flashlightLayer = new Layer('flashlight', this.renderer);

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
    return this.renderer.game.engine;
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

  renderCharProps() {
    this.context.font = '16px sans-serif';
    this.context.fillStyle = 'white';
    this.context.textBaseline = 'top';
    const propsSystem = this.engine.getSystem<PropsSystem>(PropsSystem);
    for (const prop of propsSystem.charsToRender) {
      this.context.fillText(prop.text, prop.pos.x, prop.pos.y);
    }
    propsSystem.charsToRender = [];
  }

  renderAgents() {
    const bodySprite = SPRITES_MAP.body;
    const armsFreeSprite = SPRITES_MAP.armsFree;
    const armsGrabbingSprite = SPRITES_MAP.armsGrabbing;
    const armsFistingSprite = SPRITES_MAP.armsFisting;

    this.context.globalCompositeOperation = 'source-over';

    for (const agent of this.engine.getSystem<AgentSystem>(AgentSystem).entities) {
      let armsSprite: SpriteMetadata;
      if (agent.isFisting) {
        armsSprite = armsFistingSprite;
      } else if (agent.currentWeapon) {
        armsSprite = armsGrabbingSprite;
      } else {
        armsSprite = armsFreeSprite;
      }

      this.context.save();
      this.context.translate(
        agent.posAndVel.pos.x,
        agent.posAndVel.pos.y,
      );
      this.context.save();

      this.context.rotate(agent.rot);
      this.context.drawImage(
        this.renderer.texture,
        bodySprite.x, bodySprite.y,
        bodySprite.w, bodySprite.h,
        -TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 3,
        bodySprite.w, bodySprite.h,
      )
      this.context.drawImage(
        this.renderer.texture,
        armsSprite.x, armsSprite.y,
        armsSprite.w, armsSprite.h,
        -TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 10,
        armsSprite.w, armsSprite.h,
      )

      if (agent.currentWeapon) {
        const gunSprite = SPRITES_MAP[`gun${agent.currentWeapon.options.code}`];
        this.context.drawImage(
          this.renderer.texture,
          gunSprite.x, gunSprite.y,
          gunSprite.w, gunSprite.h,
          -3, 8,
          gunSprite.w, gunSprite.h,
        )
      }

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

        this.context.save()
        this.context.translate(light.pos.x, light.pos.y)

        let gradient: CanvasGradient;
        if (light.physical) {
          this.context.rotate(light.direction.angle());
          gradient = this.context.createRadialGradient(
            0, 0, 0,
            0, radius / 2, radius / 2,
          );
        } else {
          gradient = this.context.createRadialGradient(
            0, 0, 0,
            0, 0, radius / 2,
          );
        }
        gradient.addColorStop(0, light.power);
        gradient.addColorStop(1, 'transparent');

        this.context.fillStyle = gradient;

        if (light.physical) {
          this.context.fillRect(-radius / 2, 0, radius, radius);
        } else {
          this.context.fillRect(-radius / 2, -radius / 2, radius, radius);

        }

        this.context.restore();
      }
    }
    this.context.globalCompositeOperation = 'source-over';
  }

  renderBlood() {
    const bloodSystem = this.engine.getSystem<BloodSystem>(BloodSystem);

    this.context.strokeStyle = 'red';
    this.context.lineWidth = 1;
    for (const blood of bloodSystem.toRender) {
      this.context.beginPath();
      this.context.moveTo(blood.from.x, blood.from.y);
      this.context.lineTo(blood.to.x, blood.to.y);
      this.context.stroke();
    }

    this.context.fillStyle = 'red';
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
    const colisionSystem = this.engine.getSystem<ColisionSystem>(ColisionSystem);

    const lightSize = 120;

    for (const flashlight of flashlightSystem.entities) {
      const pos = flashlight.agent.posAndVel.pos;
      const direction = flashlight.agent.rot;

      const gradient = this.context.createRadialGradient(
        pos.x, pos.y, 20,
        pos.x, pos.y, lightSize,
      );
      gradient.addColorStop(0, '#ddd');
      gradient.addColorStop(1, 'transparent');
      this.context.fillStyle = gradient;

      renderVisibilityMask(
        this.context, colisionSystem, pos, direction, Math.PI / 2, lightSize,
      )
    }
  }

  render() {
    this.renderLights();

    this.propsLayer.activate();
    this.renderLowerProps();
    this.renderCharProps();

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

import { AgentComponent } from './agent';
import { EntitySystem, EntityEngine, Entity } from './ecs';
import { Control } from '../control';
import { Camera } from '../camera';
import { Vector2 } from '../vector';
import { Gun, pistolOptions, mgOptions, minigunOptions } from '../weapons';
import { PLAYER_MASK } from '../colisions-masks';
import { TILE_SIZE } from '../constants';

const WEAPONS = [
  pistolOptions,
  mgOptions,
  minigunOptions,
];

const FLOOR_MAP: {[key: string]: string} = {
  '.': 'stone',
  '-': 'wood',
};

const VISIBILITY_UPDATE_TIME = 350;

export class PlayerComponent extends Entity {

  agent: AgentComponent;

  // visibility is affected by lighting, ranges 0-1
  visibility: number;

  lastVisibilityUpdateTime = 0;

  constructor(public engine: EntityEngine, pos: Vector2) {
    super();
    this.agent = new AgentComponent(this.engine, pos, {
      maxHealth: 30,
      colisionMask: PLAYER_MASK,
    });
    this.agent.parent = this;
    engine.getSystem(PlayerSystem).add(this);
  }

  destroy() {
    super.destroy();
    this.agent.destroy();
  }

}

export class PlayerSystem extends EntitySystem<PlayerComponent> {

  STEPS_RATE = 270;

  STEPS_SAMPLES = ['Step1', 'Step2'];

  currentStep = 0;

  lastStepTime = 0;

  weaponIndex = 0;

  player: PlayerComponent;

  constructor(private control: Control, private camera: Camera) {
    super();
  }

  add(entity: PlayerComponent) {
    super.add(entity)
    this.player = entity;
    this.nextWeapon();
  }

  remove(entity: PlayerComponent) {
    super.remove(entity);
    this.player = null;
  }

  nextWeapon() {
    const weapon = new Gun(this.engine, WEAPONS[this.weaponIndex]);
    weapon.setOwner(this.player.agent);

    this.weaponIndex++;
    if (this.weaponIndex >= WEAPONS.length) {
      this.weaponIndex = 0;
    }
  }

  update() {
    const lightsLayer =
      this.engine.renderer.compositor.layers.combinedLights;
    const lightsCanvas = lightsLayer.canvas;

    for (const player of this.entities) {
      player.agent.rot = this.control.rot

      if (this.engine.time - player.lastVisibilityUpdateTime > VISIBILITY_UPDATE_TIME) {
        // getImageData is extremely slow operation, use with caution
        player.visibility = lightsLayer.context.getImageData(
          lightsCanvas.width / 2,
          lightsCanvas.height / 2,
          1, 1,
        ).data[0];
        player.lastVisibilityUpdateTime = this.engine.time;
      }

      if (this.control.keys.get('w')) {
        player.agent.moveToDirection(Math.PI);
      }
      if (this.control.keys.get("a")) {
        player.agent.moveToDirection(Math.PI * 0.5);
      }
      if (this.control.keys.get("s")) {
        player.agent.moveToDirection(0);
      }
      if (this.control.keys.get("d")) {
        player.agent.moveToDirection(Math.PI * 1.5);
      }
      if (this.control.mouseButtons.get(0) || this.control.keys.get(" ")) {
        player.agent.shoot();
      }

      this.camera.setOnPlayer(player);

      if (this.engine.time - this.lastStepTime > this.STEPS_RATE) {
        if (player.agent.posAndVel.vel.getLength() > 1) {
          this.lastStepTime = this.engine.time;
          this.currentStep = (this.currentStep + 1) % 2;
          const pos = player.agent.posAndVel.pos;
          const x = Math.floor(pos.x / TILE_SIZE);
          const y = Math.floor(pos.y / TILE_SIZE);
          const cell = this.engine.level[y][x];
          const floor = FLOOR_MAP[cell] || 'stone'
          this.engine.sound.play(floor + this.STEPS_SAMPLES[this.currentStep]);
        }
      }
    }
  }
}

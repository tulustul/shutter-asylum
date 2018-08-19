import { AgentComponent } from './agent';
import { EntitySystem, EntityEngine, Entity } from './ecs';
import { Control } from '../control';
import { Camera } from '../camera';
import { Vector2 } from '../vector';
import { Gun, pistolOptions, mgOptions, minigunOptions } from '../weapons';
import { PLAYER_MASK } from '../colisions-masks';
import { ColisionSystem } from './colision';
import { TILE_SIZE } from '../constants';
import { ActionsSystem } from './actions';

export class PlayerComponent extends Entity {

  agent: AgentComponent;

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

const WEAPONS = [
  pistolOptions,
  mgOptions,
  minigunOptions,
];

const FLOOR_MAP: {[key: string]: string} = {
  '.': 'stone',
  '-': 'wood',
};

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
    const actionsSystem = this.engine.getSystem<ActionsSystem>(ActionsSystem);

    super.add(entity)
    this.player = entity;
    this.nextWeapon();
    window.addEventListener('keypress', event => {
      if (event.key === 'q') {
        this.nextWeapon();
      } else if (event.key === 'r') {
        this.player.agent.weapon.reload();
      } else if (event.key === 'e') {
        if (actionsSystem.action) {
          actionsSystem.action.trigger();
        }
      }
    });
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
    for (const player of this.entities) {
      player.agent.rot = this.control.rot

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

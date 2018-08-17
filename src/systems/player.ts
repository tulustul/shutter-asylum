import { AgentComponent } from './agent';
import { EntitySystem, EntityEngine, Entity } from './ecs';
import { Control } from '../control';
import { Camera } from '../camera';
import { Vector2 } from '../vector';
import { Gun, pistolOptions, mgOptions, minigunOptions, flamethrowerOptions } from '../weapons';
import { PLAYER_MASK } from '../colisions-masks';

export class PlayerComponent extends Entity {

  agent: AgentComponent;

  constructor(public engine: EntityEngine, pos: Vector2) {
    super();
    this.agent = new AgentComponent(this.engine, pos, {
      maxHealth: 30,
      colisionMask: PLAYER_MASK,
    });
    this.agent.posAndVel.friction = 1.1;
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
  flamethrowerOptions,
];


export class PlayerSystem extends EntitySystem<PlayerComponent> {

  weaponIndex = 0;

  player: PlayerComponent;

  constructor(private control: Control, private camera: Camera) {
    super();
  }

  add(entity: PlayerComponent) {
    super.add(entity)
    this.player = entity;
    this.nextWeapon();
    window.addEventListener('keypress', event => {
      if (event.key === 'q') {
        this.nextWeapon();
      } else if (event.key === 'r') {
        this.player.agent.weapon.reload();
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
        player.agent.moveTop();
      }
      if (this.control.keys.get("a")) {
        player.agent.moveLeft();
      }
      if (this.control.keys.get("s")) {
        player.agent.moveDown();
      }
      if (this.control.keys.get("d")) {
        player.agent.moveRight();
      }
      if (this.control.mouseButtons.get(0) || this.control.keys.get(" ")) {
        player.agent.shoot();
      }

      this.camera.setOnPlayer(player);
    }
  }
}

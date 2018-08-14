import { AgentComponent } from './agent.js';
import { EntitySystem, EntityEngine } from './ecs.js';
import { Control } from '../control.js';
import { Camera } from '../camera.js';
import { Vector2 } from '../vector.js';
import { Gun, pistolOptions, mgOptions, minigunOptions, flamethrowerOptions } from '../weapons.js';

export class PlayerComponent {

  agent: AgentComponent;

  constructor(private engine: EntityEngine, pos: Vector2) {
    this.agent = new AgentComponent(this.engine, pos);
    this.agent.posAndVel.friction = 1.1;
    engine.getSystem(PlayerSystem).add(this);
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

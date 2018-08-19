import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { PosAndVel } from './velocity';
import { ColisionSystem, Shape, Collidable } from "./colision";
import { PropComponent } from "./props";
import { BloodSystem } from "./blood";
import { Vector2 } from "../vector";
import { TILE_SIZE } from "../constants";
import { Gun } from "../weapons";
import { BARRIER_MASK } from "../colisions-masks";

interface AgentOptions {
  maxHealth?: number;
  colisionMask: number;
}

export class AgentComponent extends Entity {

  MAX_SPEED = 3;

  ACCELERATION = 0.2;

  posAndVel: PosAndVel;

  collidable: Collidable;

  rot = 0;

  weapon: Gun;

  maxHealth = 5;

  health: number;

  onHit: () => void;

  constructor(private engine: EntityEngine, pos: Vector2, options: AgentOptions) {
    super();
    if (options) {
      Object.assign(this, options);
    }
    this.health = this.maxHealth;

    this.engine.getSystem(AgentSystem).add(this);
    this.posAndVel = new PosAndVel(this.engine, pos, 1.1);
    this.collidable = this.engine.getSystem<ColisionSystem>(ColisionSystem)
    .makeCollidable({
      pos: this.posAndVel.pos,
      shape: Shape.circle,
      radius: TILE_SIZE / 2,
      shouldDecouple: true,
      parent: this,
      mask: options.colisionMask,
      canHit: BARRIER_MASK,
    });
  }

  destroy() {
    const bloodSystem = this.engine.getSystem<BloodSystem>(BloodSystem);
    bloodSystem.leakFromCorpse(this.posAndVel.pos);
    new PropComponent(this.engine, {
      sprite: 'corpse',
      pos: this.posAndVel.pos,
      rot: Math.random() * Math.PI * 2,
      aboveLevel: true,
      pivot: new Vector2(20, 10),
    });
    this.engine.getSystem<ColisionSystem>(ColisionSystem).remove(this.collidable);
    this.posAndVel.destroy();
    super.destroy();
  }

  moveToDirection(direction: number) {
    const acc = new Vector2(0, this.ACCELERATION).rotate(direction);
    this.updateVelocity(acc);
  }

  shoot() {
    if (this.weapon) {
      this.weapon.shoot();
    }
  }

  hit() {
    this.health--;
    if (!this.health) {
      this.getTopParent().destroy();
    }
    if (this.onHit) {
      this.onHit();
    }
  }

  private updateVelocity(acc: Vector2) {
    this.posAndVel.vel.x =
      Math.max(-this.MAX_SPEED, this.posAndVel.vel.x + acc.x);
    this.posAndVel.vel.y =
      Math.max(-this.MAX_SPEED, this.posAndVel.vel.y + acc.y);
  }

}

export class AgentSystem extends EntitySystem<AgentComponent> {

  update() {

  }

}

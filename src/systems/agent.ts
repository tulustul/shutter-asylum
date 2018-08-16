import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { PosAndVel } from './velocity';
import { ColisionSystem, Shape, Collidable } from "./colision";
import { PropComponent } from "./props";
import { Vector2 } from "../vector";
import { TILE_SIZE } from "../constants";
import { Gun } from "../weapons";

interface AgentOptions {
  maxHealth?: number;
}

export class AgentComponent extends Entity {

  MAX_SPEED = 3;

  ACCELERATION = 0.2;

  posAndVel: PosAndVel;

  collidable: Collidable;

  rot: number;

  weapon: Gun;

  maxHealth = 5;

  health: number;

  constructor(private engine: EntityEngine, pos: Vector2, options?: AgentOptions) {
    super();
    if (options) {
      Object.assign(this, options);
    }
    this.health = this.maxHealth;

    this.engine.getSystem(AgentSystem).add(this);
    this.posAndVel = new PosAndVel(this.engine, pos);
    this.collidable = this.engine.getSystem<ColisionSystem>(ColisionSystem)
    .makeCollidable({
      pos: this.posAndVel.pos,
      shape: Shape.circle,
      radius: TILE_SIZE / 2,
      canHit: true,
      canReceive: true,
      shouldDecouple: true,
      parent: this,
    });
  }

  destroy() {
    new PropComponent(this.engine, {
      sprite: 'corpse',
      pos: this.posAndVel.pos,
      rot: Math.random() * Math.PI * 2,
    });
    this.engine.getSystem<ColisionSystem>(ColisionSystem).remove(this.collidable);
    super.destroy();
  }

  moveTop() {
    const acc = new Vector2(0, -this.ACCELERATION);
    this.updateVelocity(acc);
  }

  moveDown() {
    const acc = new Vector2(0, this.ACCELERATION);
    this.updateVelocity(acc);
  }

  moveRight() {
    const acc = new Vector2(this.ACCELERATION, 0);
    this.updateVelocity(acc);
  }

  moveLeft() {
    const acc = new Vector2(-this.ACCELERATION, 0);
    this.updateVelocity(acc);
  }

  shoot() {
    if (this.weapon) {
      this.weapon.shoot();
    }
  }

  shootAt(pos: Vector2) {
    const thisPos = this.posAndVel.pos;

    this.rot = Math.PI - Math.atan2(
      thisPos.x - pos.x,
      thisPos.y - pos.y,
    )

    this.shoot();
  }

  hit() {
    this.health--;
    if (!this.health) {
      this.getTopParent().destroy();
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

  init() {
    const colisionSystem = this.engine.getSystem<ColisionSystem>(ColisionSystem);

    // colisionSystem.listenColisions<AgentComponent, any>(AgentComponent, colision => {

    // });
  }

  update() {

  }

}

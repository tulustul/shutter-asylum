import { EntitySystem, EntityEngine, Entity } from "./ecs.js";
import { PosAndVel } from './velocity.js';
import { ColisionSystem, Shape, Collidable } from "./colision.js";
import { ProjectileSystem } from "./projectile.js";
import { Vector2 } from "../vector.js";
import { TILE_SIZE } from "../constants.js";
import { Gun, flamethrowerOptions, pistolOptions, mgOptions, minigunOptions } from "../weapons.js";

export class AgentComponent extends Entity {

  MAX_SPEED = 3;

  ACCELERATION = 0.2;

  posAndVel: PosAndVel;

  collidable: Collidable;

  rot: number;

  weapon: Gun;

  constructor(private engine: EntityEngine, pos: Vector2) {
    super();
    this.engine.getSystem(AgentSystem).add(this);
    this.posAndVel = new PosAndVel(this.engine, pos);
    this.collidable = this.engine.getSystem<ColisionSystem>(ColisionSystem).makeCollidable({
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
    super.destroy();
    this.engine.getSystem<ColisionSystem>(ColisionSystem).remove(this.collidable);
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

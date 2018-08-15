import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { PosAndVel } from './velocity';
import { ColisionSystem, Shape, Collidable } from "./colision";
import { Vector2 } from "../vector";
import { TILE_SIZE } from "../constants";
import { Gun } from "../weapons";

export class AgentComponent extends Entity {

  MAX_SPEED = 3;

  ACCELERATION = 0.2;

  posAndVel: PosAndVel;

  collidable: Collidable;

  rot: number;

  weapon: Gun;

  health = 5;

  constructor(private engine: EntityEngine, pos: Vector2) {
    super();
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

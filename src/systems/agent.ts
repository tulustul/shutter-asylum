import { EntitySystem, EntityEngine, Entity } from "./ecs.js";
import { PosAndVel } from './velocity.js';
import { ColisionSystem } from "./colision.js";
import { ProjectileSystem } from "./projectile.js";
import { Vector2 } from "../vector.js";
import { TILE_SIZE } from "../constants.js";

export class AgentComponent extends Entity {

  MAX_SPEED = 3;

  ACCELERATION = 0.2;

  posAndVel: PosAndVel;

  rot: number;

  constructor(private engine: EntityEngine, pos: Vector2) {
    super();
    this.engine.getSystem(AgentSystem).add(this);
    this.posAndVel = new PosAndVel(this.engine, pos);
    this.engine.getSystem<ColisionSystem>(ColisionSystem).makeCollidable({
      pos: this.posAndVel.pos,
      radius: TILE_SIZE / 2,
      canHit: true,
      canReceive: true,
      shouldDecouple: true,
      parent: this,
    });
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
    const offset = new Vector2(-5, 11).rotate(this.rot);
    const vel = new Vector2(0, 5).rotate(this.rot);
    this.engine.getSystem<ProjectileSystem>(ProjectileSystem).makeProjectile(
      this.posAndVel.pos.copy().add(offset), vel,
    );
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

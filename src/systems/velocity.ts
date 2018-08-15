import { EntitySystem, EntityEngine, Entity } from './ecs';
import { Vector2 } from '../vector';

export class PosAndVel extends Entity {
  vel = new Vector2();

  floatPos: Vector2;

  friction = 1;

  constructor(engine: EntityEngine, public pos: Vector2) {
    super();
    engine.getSystem(VelocitySystem).add(this);
    this.floatPos = pos.copy();
  }
}

export class VelocitySystem extends EntitySystem<PosAndVel> {
  update() {
    // const colisionSystem = this.engine.getSystem<ColisionSystem>(ColisionSystem);

    for (const posAndVel of this.entities) {
      // colisionSystem.
      // colisionSystem.staticGrid
      posAndVel.floatPos.add(posAndVel.vel);

      posAndVel.pos.x = Math.round(posAndVel.floatPos.x);
      posAndVel.pos.y = Math.round(posAndVel.floatPos.y);

      posAndVel.vel.x /= posAndVel.friction;
      posAndVel.vel.y /= posAndVel.friction;
    }
  }
}

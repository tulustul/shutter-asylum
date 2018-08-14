import { EntitySystem, EntityEngine, Entity } from "./ecs.js";
import { PropComponent } from "./props.js";
import { Vector2 } from "../vector.js";
import { ColisionSystem, Collidable, Shape } from "./colision.js";
import { PosAndVel } from "./velocity.js";
import { AgentComponent } from "./agent.js";

export class ProjectileComponent extends Entity {

  posAndVel: PosAndVel;

  collidable: Collidable;

  bornAt: number;

  constructor(
    private engine: EntityEngine,
    pos: Vector2,
    vel: Vector2,
    public maxLifetime: number,
  ) {
    super();

    const posCopy = pos.copy();

    this.posAndVel = new PosAndVel(this.engine, posCopy);
    this.posAndVel.vel = vel;

    this.collidable = {
      pos: posCopy,
      shape: Shape.point,
      radius: 0,
      canHit: true,
      canReceive: false,
      shouldDecouple: false,
      parent: this,
    }

    this.bornAt = this.engine.time;

    this.engine.getSystem<ColisionSystem>(ColisionSystem).makeCollidable(this.collidable);
  }

  destroy() {
    super.destroy();
    this.posAndVel.destroy();
    this.engine.getSystem<ColisionSystem>(ColisionSystem).remove(this.collidable);
  }
}

export class ProjectileSystem extends EntitySystem<ProjectileComponent> {

  init() {
    const colisionSystem = this.engine.getSystem<ColisionSystem>(ColisionSystem);

    colisionSystem.listenColisions<ProjectileComponent, any>(ProjectileComponent, colision => {
      colision.hitter.destroy();
      if (colision.receiver instanceof AgentComponent) {
        colision.receiver.hit();
      }
    });
  }

  makeProjectile(pos: Vector2, vel: Vector2, maxLifetime: number) {
    this.add(new ProjectileComponent(this.engine, pos, vel, maxLifetime));
  }

  update() {
    for (const projectile of this.entities) {
      if (this.engine.time > projectile.bornAt + projectile.maxLifetime) {
        this.remove(projectile);
      }
    }
    // if (this.entities.length) {
    //   console.log(this.entities)
    // }
  }
}

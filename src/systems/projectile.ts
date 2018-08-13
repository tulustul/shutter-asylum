import { EntitySystem, EntityEngine, Entity } from "./ecs.js";
import { PropComponent } from "./props.js";
import { Vector2 } from "../vector.js";
import { ColisionSystem, Collidable } from "./colision.js";
import { PosAndVel } from "./velocity.js";
import { AgentComponent } from "./agent.js";

export class ProjectileComponent extends Entity {

  posAndVel: PosAndVel;

  collidable: Collidable;

  constructor(private engine: EntityEngine, pos: Vector2, vel: Vector2) {
    super();

    const posCopy = pos.copy();

    this.posAndVel = new PosAndVel(this.engine, posCopy);
    this.posAndVel.vel = vel;

    this.collidable = {
      pos: posCopy,
      radius: 1,
      canHit: true,
      canReceive: false,
      shouldDecouple: false,
      parent: this,
    }

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
        colision.receiver.destroy();
      }
    });
  }

  makeProjectile(pos: Vector2, vel: Vector2) {
    this.add(new ProjectileComponent(this.engine, pos, vel));
  }

  update() {
    // if (this.entities.length) {
    //   console.log(this.entities)
    // }
  }
}

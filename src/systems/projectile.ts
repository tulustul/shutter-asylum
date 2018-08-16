import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { Vector2 } from "../vector";
import { ColisionSystem } from "./colision";
import { AgentComponent } from "./agent";
import {  ParticleComponent } from "./particles";

export class ProjectileComponent extends Entity {

  particle: ParticleComponent;

  constructor(
    private engine: EntityEngine,
    pos: Vector2,
    vel: Vector2,
    public maxLifetime: number,
  ) {
    super();

    this.particle = new ParticleComponent(this.engine, {
      pos, vel, color: 'red', lifetime: maxLifetime,
    });
    this.particle.parent = this;
  }

  destroy() {
    super.destroy();
    this.particle.destroy();
  }
}

export class ProjectileSystem extends EntitySystem<ProjectileComponent> {

  init() {
    const colisionSystem = this.engine.getSystem<ColisionSystem>(ColisionSystem);

    colisionSystem.listenColisions<ProjectileComponent, any>(ProjectileComponent, colision => {
      if (colision.receiver instanceof AgentComponent) {
        colision.receiver.hit();
      }
    });
  }

  makeProjectile(pos: Vector2, vel: Vector2, maxLifetime: number) {
    this.add(new ProjectileComponent(this.engine, pos, vel, maxLifetime));
  }

  update() {
  }
}

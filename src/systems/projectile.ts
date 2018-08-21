import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { ColisionSystem } from "./colision";
import { AgentComponent } from "./agent";
import { ParticleComponent } from "./particles";
import { BarrierComponent, BarrierSystem } from "./barrier";
import { BloodSystem, } from "./blood";
import { Vector2 } from "../vector";

export class ProjectileComponent extends Entity {

  particle: ParticleComponent;

  constructor(
    private engine: EntityEngine,
    pos: Vector2,
    vel: Vector2,
    public maxLifetime: number,
    canHit: number,
  ) {
    super();

    this.particle = new ParticleComponent(this.engine, {
      pos, vel,
      color: 'red',
      lifetime: maxLifetime,
      canHitDynamic: true,
      canHit: canHit,
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
    const bloodSystem = this.engine.getSystem<BloodSystem>(BloodSystem);
    const barrierSystem = this.engine.getSystem<BarrierSystem>(BarrierSystem);

    colisionSystem.listenColisions<ProjectileComponent, any>(ProjectileComponent, colision => {
      if (colision.receiver instanceof AgentComponent) {
        colision.receiver.hit();
        bloodSystem.emitBlood(
          colision.hitter.particle.posAndVel.pos,
          colision.hitter.particle.posAndVel.vel,
        );
      } else if (colision.receiver instanceof BarrierComponent) {
        barrierSystem.emitDebris(
          colision.hitter.particle.posAndVel.pos,
          colision.hitter.particle.posAndVel.vel,
        );
      }
    });
  }

  makeProjectile(pos: Vector2, vel: Vector2, maxLifetime: number, canHit: number) {
    this.add(new ProjectileComponent(this.engine, pos, vel, maxLifetime, canHit));
  }

  update() {
  }
}

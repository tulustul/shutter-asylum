import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { Vector2 } from "../vector";
import { ColisionSystem, Shape, Collidable } from "./colision";
import { PosAndVel } from "./velocity";

interface ParticleOptions {
  pos: Vector2;
  vel?: Vector2;
  color: string;
  lifetime: number;
  canHitDynamic: boolean;
  canHit: number;
  onDeath?: (pos: Vector2) => void;
}

interface EmitOptions {
  direction: Vector2;
  count: number;
  spread: number;
  speedSpread: number;
  lifetimeSpread: number;
}

export class ParticleComponent extends Entity {

  collidable: Collidable;

  posAndVel: PosAndVel;

  lifetime: number;

  bornAt: number;

  color: string;

  onDeath: (pos: Vector2) => void;

  constructor(private engine: EntityEngine, options: ParticleOptions) {
    super();
    Object.assign(this, options);

    this.bornAt = this.engine.time;
    const pos = options.pos.copy();
    this.posAndVel = new PosAndVel(this.engine, pos);
    this.posAndVel.vel = options.vel;

    this.collidable = this.engine.getSystem<ColisionSystem>(ColisionSystem).makeCollidable({
      pos: pos,
      shape: Shape.point,
      radius: 0,
      shouldDecouple: false,
      parent: this,
      canHit: options.canHit,
    });

    engine.getSystem(ParticlesSystem).add(this);
  }

  destroy() {
    this.posAndVel.destroy();
    this.engine.getSystem<ColisionSystem>(ColisionSystem).remove(this.collidable);
    super.destroy();

    if (this.onDeath) {
      this.onDeath(this.collidable.pos);
    }
  }
}

export class ParticlesSystem extends EntitySystem<ParticleComponent> {

  byColors: {[key: string]: ParticleComponent[]} = {
    red: [],
    orange: [],
  }


  init() {
    const colisionSystem = this.engine.getSystem<ColisionSystem>(ColisionSystem);

    colisionSystem.listenColisions<ParticleComponent, any>(ParticleComponent, colision => {
      colision.hitter.destroy();
    });
  }

  update() {
    for (const particle of this.entities) {
      if (this.engine.time > particle.bornAt + particle.lifetime) {
        particle.destroy();
      }
    }
  }

  add(entity: ParticleComponent) {
    super.add(entity);
    this.byColors[entity.color].push(entity);
  }

  remove(entity: ParticleComponent) {
    super.remove(entity);
    const colorList = this.byColors[entity.color];
    const index = colorList.indexOf(entity);
    colorList.splice(index, 1);
  }

  emit(particleOptions: ParticleOptions, emitOptions: EmitOptions) {
    for (let i = 0; i < emitOptions.count; i++) {
      const particle = new ParticleComponent(this.engine, particleOptions);
      particle.posAndVel.vel = emitOptions.direction.copy().rotate(
        (Math.random() - 0.5) * emitOptions.spread,
      ).mul((Math.random() + 0.5) * emitOptions.speedSpread);
      particle.lifetime *= (Math.random() + 0.5) * emitOptions.lifetimeSpread;
    }
  }
}

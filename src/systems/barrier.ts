import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { PropComponent } from "./props";
import { ColisionSystem, Shape, Collidable } from "./colision";
import { ParticlesSystem } from "./particles";

import { Vector2 } from "../vector";
import { BARRIER_MASK } from "../colisions-masks";

interface BarrierOptions {
  pos: Vector2;
  sprite?: string;
  colisionMask?: number;
  zIndex?: number;
}

export class BarrierComponent extends Entity {

  pos: Vector2;

  sprite = 'wall';

  colisionMask = BARRIER_MASK;

  collidable: Collidable;

  prop: PropComponent;

  constructor(private engine: EntityEngine, options: BarrierOptions) {
    super();

    Object.assign(this, options);

    this.collidable = this.engine.getSystem<ColisionSystem>(ColisionSystem).makeCollidable({
      pos: this.pos,
      shape: Shape.gridCell,
      parent: this,
      mask: this.colisionMask,
    });

    this.prop = new PropComponent(
      this.engine, {
        pos: this.pos,
        sprite: this.sprite,
        zIndex: options.zIndex || 0,
      },
    );
    engine.getSystem(BarrierSystem).add(this);
  }
}

export class BarrierSystem extends EntitySystem<BarrierComponent> {
  update() {}

  emitDebris(pos: Vector2, vel: Vector2) {
    const particlesSystem = this.engine.getSystem<ParticlesSystem>(ParticlesSystem);

    particlesSystem.emit({
      pos: pos.copy(),
      color: 'gray',
      lifetime: 300,
      canHitDynamic: false,
      canHit: 0,
    }, {
      count: Math.ceil(Math.random() * 25),
      direction: vel.copy().mul(-0.3),
      spread: Math.PI,
      speedSpread: 0.5,
      lifetimeSpread: 0.5,
    });
  }
}

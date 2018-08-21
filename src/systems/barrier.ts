import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { PropComponent } from "./props";
import { ColisionSystem, Shape } from "./colision";
import { ParticlesSystem } from "./particles";

import { Vector2 } from "../vector";
import { BARRIER_MASK } from "../colisions-masks";

export class BarrierComponent extends Entity {

  colision = this.engine.getSystem<ColisionSystem>(ColisionSystem).makeCollidable({
    pos: this.pos,
    shape: Shape.gridCell,
    radius: 0,
    shouldDecouple: false,
    parent: this,
    mask: BARRIER_MASK,
  });

  prop = new PropComponent(this.engine, {pos: this.pos, sprite: 'wall'});

  constructor(private engine: EntityEngine, public pos: Vector2) {
    super();
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

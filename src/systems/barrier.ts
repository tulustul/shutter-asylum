import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { PropComponent } from "./props";
import { ColisionSystem, Shape } from "./colision";
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
}

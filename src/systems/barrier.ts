import { EntitySystem, EntityEngine, Entity } from "./ecs.js";
import { PropComponent } from "./props.js";
import { Vector2 } from "../vector.js";
import { ColisionSystem, Shape } from "./colision.js";

export class BarrierComponent extends Entity {

  colision = this.engine.getSystem<ColisionSystem>(ColisionSystem).makeCollidable({
    pos: this.pos,
    shape: Shape.gridCell,
    radius: 0,
    canHit: false,
    canReceive: true,
    shouldDecouple: false,
    parent: this,
  });

  prop = new PropComponent(this.engine, this.pos, this.color);

  constructor(private engine: EntityEngine, public pos: Vector2, public color: string) {
    super();
    engine.getSystem(BarrierSystem).add(this);
  }
}

export class BarrierSystem extends EntitySystem<BarrierComponent> {
  update() {}
}

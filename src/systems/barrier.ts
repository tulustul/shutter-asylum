import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { PropComponent } from "./props";
import { Vector2 } from "../vector";
import { ColisionSystem, Shape } from "./colision";

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

  prop = new PropComponent(this.engine, {pos: this.pos, sprite: 'wall'});

  constructor(private engine: EntityEngine, public pos: Vector2) {
    super();
    engine.getSystem(BarrierSystem).add(this);
  }
}

export class BarrierSystem extends EntitySystem<BarrierComponent> {
  update() {}
}

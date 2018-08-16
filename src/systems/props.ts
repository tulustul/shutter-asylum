import { EntitySystem, EntityEngine, Entity } from './ecs';
import { Vector2 } from '../vector';

interface PropOptions {
  sprite: string;
  pos: Vector2;
  rot?: number;
}

export class PropComponent {

  sprite: string;

  pos: Vector2;

  rot = 0;

  needRerender = false;

  constructor(engine: EntityEngine, options: PropOptions) {
    Object.assign(this, options);
    engine.getSystem(PropsSystem).add(this);
  }
}

export class PropsSystem extends EntitySystem<PropComponent> {

  toRender: PropComponent[] = [];

  add(entity: PropComponent) {
    super.add(entity);
    this.toRender.push(entity);
  }

  markAsRendered() {
    this.toRender = [];
  }

  update() {

  }
}

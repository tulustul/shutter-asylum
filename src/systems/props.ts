import { EntitySystem, EntityEngine, Entity } from './ecs';
import { Vector2 } from '../vector';

interface PropOptions {
  sprite: string;
  pos: Vector2;
  rot?: number;
  aboveLevel?: boolean;
  changing?: boolean;
  pivot?: Vector2;
  offset?: Vector2;
}

export class PropComponent {

  sprite: string;

  pos: Vector2;

  rot: number = null;

  needRerender = false;

  aboveLevel = false;

  changing = false;

  pivot = new Vector2();

  offset = new Vector2();

  constructor(engine: EntityEngine, options: PropOptions) {
    Object.assign(this, options);
    engine.getSystem(PropsSystem).add(this);
  }
}

export class PropsSystem extends EntitySystem<PropComponent> {

  toRender: PropComponent[] = [];

  higherToRender: PropComponent[] = [];

  add(entity: PropComponent) {
    if (entity.changing) {
      super.add(entity);
    } else if (entity.aboveLevel) {
      this.higherToRender.push(entity);
    } else {
      this.toRender.push(entity);
    }
  }

  update() { }
}

import { EntitySystem, EntityEngine, Entity } from './ecs';
import { Vector2 } from '../vector';

interface PropOptions {
  sprite: string;
  pos: Vector2;
  rot?: number;
  aboveLevel?: boolean
}

export class PropComponent {

  sprite: string;

  pos: Vector2;

  rot = 0;

  needRerender = false;

  aboveLevel = false;

  constructor(engine: EntityEngine, options: PropOptions) {
    Object.assign(this, options);
    engine.getSystem(PropsSystem).add(this);
  }
}

export class PropsSystem extends EntitySystem<PropComponent> {

  toRender: PropComponent[] = [];

  higherToRender: PropComponent[] = [];

  add(entity: PropComponent) {
    super.add(entity);
    if (entity.aboveLevel) {
      this.higherToRender.push(entity);
    } else {
      this.toRender.push(entity);
    }
  }


  update() {

  }
}

import { EntitySystem, EntityEngine } from './ecs';
import { Vector2 } from '../vector';

export class PropComponent {
  constructor(engine: EntityEngine, public pos: Vector2, public sprite: string) {
    engine.getSystem(PropsSystem).add(this);
  }
}

export class PropsSystem extends EntitySystem<PropComponent> {
  update() {

  }
}

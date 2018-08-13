import { EntitySystem, EntityEngine } from './ecs.js';
import { Vector2 } from '../vector.js';

export class PropComponent {
  constructor(engine: EntityEngine, public pos: Vector2, public color: string) {
    engine.getSystem(PropsSystem).add(this);
  }
}

export class PropsSystem extends EntitySystem<PropComponent> {
  update() {

  }
}

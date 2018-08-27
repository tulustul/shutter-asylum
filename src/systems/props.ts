import { EntitySystem, EntityEngine, Entity } from './ecs';
import { Vector2 } from '../vector';

interface PropOptions {
  pos: Vector2;
  sprite?: string;
  text?: string;
  rot?: number;
  changing?: boolean;
  pivot?: Vector2;
  offset?: Vector2;
  aboveLevel?: boolean;
  zIndex?: number;
}

export class PropComponent extends Entity {

  pos: Vector2;

  sprite: string;

  text: string;

  rot: number = null;

  needRerender = false;

  changing = false;

  pivot = new Vector2();

  offset = new Vector2();

  aboveLevel = false;

  zIndex = 0;

  constructor(engine: EntityEngine, options: PropOptions) {
    super();

    Object.assign(this, options);
    engine.getSystem(PropsSystem).add(this);
  }

  queueRender() {
    if (!this.changing) {
      this.system.add(this);
    }
  }
}

export class PropsSystem extends EntitySystem<PropComponent> {

  charsToRender: PropComponent[] = [];

  toRender: {[zIndex: number]: PropComponent[]} = {};

  higherToRender: PropComponent[] = [];

  zIndexes: number[] = [];

  add(entity: PropComponent) {
    entity.system = this;
    if (entity.changing) {
      super.add(entity);
    } else if (entity.aboveLevel) {
      this.higherToRender.push(entity);
    } else if (entity.text) {
      this.charsToRender.push(entity);
    } else {
      this.updateZIndexes(entity.zIndex);
      this.toRender[entity.zIndex].push(entity);
    }
  }

  updateZIndexes(zIndex: number) {
    if (!this.toRender[zIndex]) {
      this.toRender[zIndex] = [];
      this.zIndexes.push(zIndex);
      this.zIndexes = this.zIndexes.sort();
    }
  }

  update() { }
}

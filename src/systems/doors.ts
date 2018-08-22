import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { PropComponent } from "./props";
import { ColisionSystem, Shape, Collidable } from "./colision";
import { Vector2 } from "../vector";
import { BARRIER_MASK } from "../colisions-masks";
import { ActionComponent } from "./actions";
import { TILE_SIZE } from "../constants";

export enum DoorOrientation {
  vertical,
  horizontal,
}

interface DoorOptions {
  pos: Vector2;
  orientation: DoorOrientation,
  opened?: boolean;
}

export class DoorComponent extends Entity {

  pos: Vector2;

  orientation: DoorOrientation;

  opened = false;

  collidable: Collidable;

  prop: PropComponent;

  action: ActionComponent;

  constructor(private engine: EntityEngine, options: DoorOptions) {
    super();

    Object.assign(this, options);

    this.collidable = this.engine.getSystem<ColisionSystem>(ColisionSystem).makeCollidable({
      pos: this.pos,
      shape: Shape.gridCell,
      radius: 0,
      shouldDecouple: false,
      parent: this,
      mask: BARRIER_MASK,
    });

    this.prop = new PropComponent(this.engine, {
      pos: this.pos,
      rot: this.orientation === DoorOrientation.horizontal ? 0 : Math.PI / 2,
      sprite: 'door',
      changing: true,
      pivot: new Vector2(0, TILE_SIZE / 2),
      offset: this.orientation === DoorOrientation.horizontal ?
        new Vector2(0, TILE_SIZE / 2) : new Vector2(TILE_SIZE / 2, 0),
    });

    this.action = new ActionComponent(this.engine, {
      collidable: this.collidable,
      text: 'open',
      action: entity => this.open(),
    });

    engine.getSystem(DoorsSystem).add(this);
  }

  open() {
    const colisionSystem = this.engine.getSystem<ColisionSystem>(ColisionSystem);

    this.prop.rot += Math.PI / 2;
    colisionSystem.remove(this.collidable);
    this.action.destroy();

  }

}

export class DoorsSystem extends EntitySystem<DoorComponent> {
  update() {
  }
}

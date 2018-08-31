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

  propA: PropComponent;

  propB: PropComponent;

  action: ActionComponent;

  constructor(private engine: EntityEngine, options: DoorOptions) {
    super();

    Object.assign(this, options);

    this.collidable = this.engine.getSystem<ColisionSystem>(ColisionSystem).makeCollidable({
      pos: this.pos,
      shape: Shape.gridCell,
      parent: this,
      mask: BARRIER_MASK,
    });

    const isHor = this.orientation === DoorOrientation.horizontal;
    const xOffset = isHor ? 0 : TILE_SIZE / 2 + 1;
    const yOffset = isHor ? TILE_SIZE / 2 + 1 : 0;

    this.propA = new PropComponent(this.engine, {
      pos: this.pos.copy().add(new Vector2(xOffset, yOffset)),
      rot: isHor ? 0 : Math.PI / 2,
      sprite: 'door',
      changing: true,
      pivot: new Vector2(0, TILE_SIZE / 2),
      offset: isHor ?
        new Vector2(0, TILE_SIZE / 2) : new Vector2(TILE_SIZE / 2, 0),
    });

    this.propB = new PropComponent(this.engine, {
      pos: this.pos.copy().add(new Vector2(-xOffset, -yOffset)),
      rot: isHor ? 0 : Math.PI / 2,
      sprite: 'door',
      changing: true,
      pivot: new Vector2(0, TILE_SIZE / 2),
      offset: isHor ?
        new Vector2(0, TILE_SIZE / 2) : new Vector2(TILE_SIZE / 2, 0),
    });

    this.action = new ActionComponent(this.engine, {
      collidable: this.collidable,
      text: 'open',
      priority: 5,
      action: () => this.open(),
    });

    engine.getSystem(DoorsSystem).add(this);
  }

  open() {
    const colisionSystem = this.engine.getSystem<ColisionSystem>(ColisionSystem);

    this.propA.pos = this.pos;
    this.propA.rot += Math.PI / 2;
    this.propB.destroy();
    colisionSystem.remove(this.collidable);
    this.action.destroy();
  }
}

export class DoorsSystem extends EntitySystem<DoorComponent> {
  update() {
  }
}

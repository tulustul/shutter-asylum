import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { PropComponent } from "./props";
import { Collidable, Shape } from "./colision";
import { PlayerSystem } from "./player";

import { Vector2 } from "../vector";
import { TILE_SIZE } from "../constants";

interface ActionOptions {
  collidable: Collidable;
  text: string;
  priority: number;
  action: (entity: Entity) => void;
}

export class ActionComponent extends Entity {

  collidable: Collidable;

  pos: Vector2;

  prop: PropComponent;

  text: string;

  priority: number;

  action: (entity: Entity) => void;

  constructor(engine: EntityEngine, options: ActionOptions) {
    super();

    Object.assign(this, options);

    this.pos = this.collidable.pos;

    if (this.collidable.shape === Shape.gridCell) {
      this.pos = this.pos.copy().add(new Vector2(TILE_SIZE / 2, TILE_SIZE / 2));
    }

    engine.getSystem(ActionsSystem).add(this);
  }

  trigger() {
    this.action(this.collidable.parent);
  }
}

export class ActionsSystem extends EntitySystem<ActionComponent> {

  action: ActionComponent;

  update() {
    const player = this.engine.getSystem<PlayerSystem>(PlayerSystem).player;
    if (!player) {
      return;
    }
    const playerPos = player.agent.posAndVel.pos;

    let minDistance = 25;
    let minPriority = 0;

    this.action = null;

    for (const action of this.entities) {
      const distance = playerPos.distanceTo(action.pos);
      if (distance < minDistance) {
        if (action.priority >= minPriority) {
          minDistance = distance;
          minPriority = action.priority;
          this.action = action;
        }
      }
    }
  }
}

import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { PropComponent } from "./props";
import { Collidable } from "./colision";
import { PlayerSystem } from "./player";

interface ActionOptions {
  collidable: Collidable;
  text: string;
  action: (entity: Entity) => void;
}

export class ActionComponent extends Entity {

  collidable: Collidable;

  prop: PropComponent;

  text: string;

  action: (entity: Entity) => void;

  constructor(private engine: EntityEngine, options: ActionOptions) {
    super();

    Object.assign(this, options);

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

    let minDistance = 40;

    this.action = null;

    for (const entity of this.entities) {
      const distance = playerPos.distanceTo(entity.collidable.pos);
      if (distance < minDistance) {
        minDistance = distance;
        this.action = entity;
      }
    }
  }
}

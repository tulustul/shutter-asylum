import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { PropComponent } from "./props";

import { Vector2 } from "../vector";
import { Gun } from "../weapons";
import { PlayerSystem } from "./player";

interface PickableOptions {
  pos: Vector2;
  gun: Gun;
}

export class PickableComponent extends Entity {

  pos: Vector2;

  prop: PropComponent;

  gun: Gun;

  constructor(private engine: EntityEngine, options: PickableOptions) {
    super();

    Object.assign(this, options);

    this.prop = new PropComponent(
      this.engine, {
        pos: this.pos,
        changing: true,
        sprite: `pickable${this.gun.options.code}`,
        pivot: new Vector2(8, 3),
      },
    );
    engine.getSystem(PickableSystem).add(this);
  }

  destroy() {
    this.prop.destroy();
    super.destroy();
  }
}

export class PickableSystem extends EntitySystem<PickableComponent> {

  update() {
    const playerSystem = this.engine.getSystem<PlayerSystem>(PlayerSystem);
    if (!playerSystem.player) {
      return;
    }

    const playerAgent = playerSystem.player.agent;
    for (const entity of this.entities) {
      entity.prop.rot += 0.03;
      if (playerAgent.posAndVel.pos.distanceTo(entity.pos) < 10) {
        if (!playerAgent.weaponsMap.has(entity.gun.options.code)) {
          this.engine.game.notifyNewWeapon(entity.gun);
        }
        playerAgent.addWeapon(entity.gun, 0.4);
        entity.destroy();
        this.engine.sound.play('collect');
      }
    }
  }

}

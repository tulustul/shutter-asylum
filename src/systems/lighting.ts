import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { PropComponent } from "./props";
import { ColisionSystem, Collidable, Shape } from "./colision";
import { ParticlesSystem } from "./particles";

import { Vector2 } from "../vector";
import { AGENTS_MASK } from "../colisions-masks";
import { TILE_SIZE } from "../constants";
import { ActionComponent } from "./actions";

type Direction = 'up' | 'right' | 'down' | 'left';

interface LightOptions {
  pos: Vector2;
  physical?: boolean;
  enabled?: boolean;
  broken?: boolean;
  radius?: number;
  power?: string;
  wallDirection?: Vector2;
}

const updateFrequency = 0;

export class LightComponent extends Entity {

  collidable: Collidable;

  prop: PropComponent;

  physical = false;

  enabled = true;

  broken = false;

  lastUpdated = 0;

  radius = 250;

  power = 'white';

  pos: Vector2;

  wallDirection: Direction;

  direction = new Vector2();

  action: ActionComponent;

  constructor(
    private engine: EntityEngine,
    options: LightOptions,
  ) {
    super();

    Object.assign(this, options);

    if (this.physical) {
      let rot = 0;
      if (this.wallDirection === 'up') {
        rot = Math.PI / 2;
        this.pos.add(new Vector2(TILE_SIZE / 2, 0));
        this.direction = new Vector2(0, 1);
      } else if (this.wallDirection === 'right') {
        rot = Math.PI;
        this.pos.add(new Vector2(TILE_SIZE, TILE_SIZE / 2));
        this.direction = new Vector2(-1, 0);
      } else if (this.wallDirection === 'down') {
        rot = -Math.PI / 2;
        this.pos.add(new Vector2(TILE_SIZE / 2, TILE_SIZE));
        this.direction = new Vector2(0, -1);
      } else if (this.wallDirection === 'left') {
        this.pos.add(new Vector2(0, TILE_SIZE / 2));
        this.direction = new Vector2(1, 0);
      }

      this.collidable = this.engine.getSystem<ColisionSystem>(ColisionSystem).makeCollidable({
        pos: this.pos,
        shape: Shape.circle,
        radius: 5,
        parent: this,
        mask: AGENTS_MASK,
      });

      this.prop = new PropComponent(this.engine, {
        pos: this.pos,
        sprite: 'light',
        aboveLevel: true,
        pivot: new Vector2(0, 5),
        rot,
      });

      if (!this.broken) {
        this.action = new ActionComponent(this.engine, {
          collidable: this.collidable,
          text: 'toggle',
          priority: 1,
          action: () => this.toggle(),
        })
      }
    }

    engine.getSystem(LightsSystem).add(this);
  }

  broke() {
    if (this.enabled && !this.broken) {
      this.action.destroy();
      this.action = null;
      if (Math.random() > 0.7) {
        this.broken = true;
        this.radius /= 2;
        this.power = '#aaa';
      }
      this.toggle();
      this.emitSparks(2);
    }
  }

  toggle() {
    (this.system as LightsSystem).needRerender = true;
    this.enabled = !this.enabled;
    this.lastUpdated = this.engine.time;
    this.prop.sprite = this.enabled ? 'light' : 'lightBroken';
    this.prop.queueRender();

    if (this.broken && this.direction) {
      this.emitSparks();
    }
  }

  emitSparks(multiplier = 1) {
    const particlesSystem = this.engine.getSystem<ParticlesSystem>(ParticlesSystem);

    particlesSystem.emit({
      pos: this.pos.copy(),
      color: 'white',
      lifetime: 400,
      canHitDynamic: false,
      canHit: 0,
      friction: 1.1,
    }, {
      count: Math.ceil(Math.random() * 10 * multiplier),
      direction: this.direction.copy().mul(5 * multiplier),
      spread: Math.PI,
      speedSpread: 0.5,
      lifetimeSpread: 0.5,
    });
  }

}

export class LightsSystem extends EntitySystem<LightComponent> {

  needRerender = true;

  add(entity: LightComponent) {
    super.add(entity);
    this.needRerender = true;
  }

  remove(entity: LightComponent) {
    super.remove(entity);
    this.needRerender = true;
  }

  update() {
    for (const light of this.entities) {
      if (light.broken) {
        if (this.engine.time - light.lastUpdated > updateFrequency) {
          if (Math.random() > 0.9) {
            light.toggle();
          }
        }
      }
    }
  }
}

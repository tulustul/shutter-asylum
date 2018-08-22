import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { PosAndVel } from './velocity';
import { ColisionSystem, Shape, Collidable } from "./colision";
import { PropComponent } from "./props";
import { BloodSystem } from "./blood";
import { Vector2 } from "../vector";
import { TILE_SIZE } from "../constants";
import { Gun } from "../weapons";
import { BARRIER_MASK, OBSTACLE_MASK } from "../colisions-masks";
import { FlashlightComponent } from "./flashlight";

interface AgentOptions {
  maxHealth?: number;
  colisionMask: number;
}

export class AgentComponent extends Entity {

  maxSpeed = 3;

  ACCELERATION = 0.2;

  posAndVel: PosAndVel;

  collidable: Collidable;

  rot = 0;

  weapon: Gun;

  maxHealth = 5;

  health: number;

  flashlight: FlashlightComponent;

  onHit: () => void;

  constructor(public engine: EntityEngine, pos: Vector2, options: AgentOptions) {
    super();
    if (options) {
      Object.assign(this, options);
    }
    this.health = this.maxHealth;

    this.engine.getSystem(AgentSystem).add(this);
    this.posAndVel = new PosAndVel(this.engine, pos, 1.1);
    const colisionSystem = this.engine.getSystem<ColisionSystem>(ColisionSystem);

    this.collidable = colisionSystem.makeCollidable({
      pos: this.posAndVel.pos,
      shape: Shape.circle,
      radius: TILE_SIZE / 2,
      shouldDecouple: true,
      parent: this,
      mask: options.colisionMask,
      canHit: BARRIER_MASK | OBSTACLE_MASK,
    });
  }

  destroy() {
    const bloodSystem = this.engine.getSystem<BloodSystem>(BloodSystem);
    bloodSystem.leakFromCorpse(this.posAndVel.pos);
    new PropComponent(this.engine, {
      sprite: 'corpse',
      pos: this.posAndVel.pos,
      rot: Math.random() * Math.PI * 2,
      aboveLevel: true,
      pivot: new Vector2(20, 10),
    });
    this.engine.getSystem<ColisionSystem>(ColisionSystem).remove(this.collidable);
    this.posAndVel.destroy();

    if (this.flashlight && Math.random() > 0.5) {
      this.flashlight.destroy();
    }

    super.destroy();
  }

  moveToDirection(direction: number) {
    const acc = new Vector2(0, this.ACCELERATION).rotate(direction);
    this.updateVelocity(acc);
  }

  shoot() {
    if (this.weapon) {
      this.weapon.shoot();
    }
  }

  hit() {
    this.health--;
    if (!this.health) {
      this.getTopParent().destroy();
    }
    if (this.onHit) {
      this.onHit();
    }
  }

  private updateVelocity(acc: Vector2) {
    this.posAndVel.vel.x = Math.min(
      this.maxSpeed,
      Math.max(-this.maxSpeed, this.posAndVel.vel.x + acc.x),
    );
    this.posAndVel.vel.y = Math.min(
      this.maxSpeed,
      Math.max(-this.maxSpeed, this.posAndVel.vel.y + acc.y),
    );
  }

  toggleFlashlight() {
    if (this.flashlight) {
      this.flashlight.destroy();
      this.flashlight = null;
    } else {
      this.flashlight = new FlashlightComponent(this);
    }
  }

}

export class AgentSystem extends EntitySystem<AgentComponent> {

  update() {

  }

}

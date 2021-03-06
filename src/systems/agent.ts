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
import { PickableComponent } from "./pickable";

export interface AgentOptions {
  maxHealth?: number;
  colisionMask: number;
}

export class AgentComponent extends Entity {

  FISTS_COOLDOWN = 600;

  isFisting = false;

  lastFistHit = 0;

  maxRunSpeed = 3;

  maxWalkSpeed = 0.5;

  maxSpeed = this.maxRunSpeed;

  weight = 1;

  ACCELERATION = 0.5;

  posAndVel: PosAndVel;

  collidable: Collidable;

  rot = 0;

  weaponsMap = new Map<string, Gun>();

  weapons: Gun[] = [];

  weaponIndex = 0;

  currentWeapon: Gun;

  maxHealth = 5;

  health: number;

  flashlight: FlashlightComponent;

  isRunning = true;

  onHit: () => void;

  constructor(public engine: EntityEngine, pos: Vector2, options: AgentOptions) {
    super();
    if (options) {
      Object.assign(this, options);
    }
    this.health = this.maxHealth;

    this.engine.getSystem(AgentSystem).add(this);
    this.posAndVel = new PosAndVel(this.engine, pos, 1.3);
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

    if (this.flashlight) {
      this.flashlight.destroy();
    }

    if (this.currentWeapon) {
      new PickableComponent(this.engine, {
        pos: this.posAndVel.pos.copy(),
        gun: this.currentWeapon,
      });
    }

    super.destroy();
  }

  moveToDirection(direction: number) {
    const acc = new Vector2(0, this.ACCELERATION).rotate(direction);
    this.updateVelocity(acc);
  }

  shoot() {
    if (this.currentWeapon) {
      return this.currentWeapon.shoot();
    }
    return this.hitWithFists();
  }

  decreaseHealth() {
    this.health--;
    if (this.health <= 0) {
      this.getTopParent().destroy();
    }
    if (this.onHit) {
      this.onHit();
    }
  }

  private updateVelocity(acc: Vector2) {
    const speed = this.maxSpeed / this.weight;
    this.posAndVel.vel.x = Math.min(
      speed, Math.max(-speed, this.posAndVel.vel.x + acc.x),
    );
    this.posAndVel.vel.y = Math.min(
      speed, Math.max(-speed, this.posAndVel.vel.y + acc.y),
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

  toggleWalkRun() {
    this.isRunning ? this.walk() : this.run();
  }

  run() {
    this.maxSpeed = this.maxRunSpeed;
    this.isRunning = true;
  }

  walk() {
    this.maxSpeed = this.maxWalkSpeed;
    this.isRunning = false;
  }

  addWeapon(weapon: Gun, ammoMultiplier = 1) {
    const ammo = Math.round(weapon.totalBullets * ammoMultiplier);
    if (!this.weaponsMap.has(weapon.options.code)) {
      // add new weapon
      this.weaponsMap.set(weapon.options.code, weapon);
      this.weapons.push(weapon);
      weapon.setOwner(this);
      weapon.totalBullets = ammo;
      weapon.bulletsInMagazine = Math.min(
        weapon.bulletsInMagazine, weapon.totalBullets,
      );

      const currentWeaponPriority =
        this.currentWeapon ? this.currentWeapon.options.priority : 0;

      if (weapon.options.priority > currentWeaponPriority) {
        this.setWeapon(weapon);
        this.weaponIndex = this.weapons.length - 1;
      }
    } else {
      // collect ammo
      const possesedWeapon = this.weaponsMap.get(weapon.options.code);
      possesedWeapon.totalBullets += ammo;
    }
  }

  nextWeapon() {
    if (this.weapons.length) {
      this.weaponIndex++;
      if (this.weaponIndex >= this.weapons.length) {
        this.weaponIndex = -1;
        this.setWeapon(null);
      } else {
        this.setWeapon(this.weapons[this.weaponIndex]);
      }
    }
  }

  setWeapon(weapon: Gun) {
    this.currentWeapon = weapon;
    if (weapon) {
      this.weight = weapon.options.weight;
    } else {
      this.weight = 1;
    }
  }

  hitWithFists() {
    if (this.engine.time - this.lastFistHit > this.FISTS_COOLDOWN) {
      this.lastFistHit = this.engine.time;
      this.isFisting = true;
      setTimeout(() => this.isFisting = false, 300);
      this.engine.sound.play('fist');

      const pos = this.posAndVel.pos;
      for (const agent of this.system.entities) {
        if (pos.distanceTo(agent.posAndVel.pos) > 25) {
          continue;
        }

        // Quick mask comparison so that ai don't hit ai, and player don't
        // hit himself.
        if (this.collidable.mask === agent.collidable.mask) {
          continue
        }

        const rot = this.rot > 0 ? this.rot : 2 * Math.PI + this.rot;

        const angleDiff = Math.abs(pos.directionTo(agent.posAndVel.pos) - rot);
        if (angleDiff < 1 || angleDiff > 5) {
          agent.decreaseHealth();
          this.engine.sound.play('fistHitA');
          this.engine.sound.play('fistHitB');
          const bloodSystem = this.engine.getSystem<BloodSystem>(BloodSystem);
          bloodSystem.emitBlood(
            agent.posAndVel.pos,
            new Vector2((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5),
          );
        }
      }
    }
  }

}

export class AgentSystem extends EntitySystem<AgentComponent> {

  update() {

  }

}

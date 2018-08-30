import { ProjectileSystem } from './systems/projectile';
import { AgentComponent } from './systems/agent';
import { EntityEngine } from './systems/ecs';
import { Vector2 } from './vector';
import { LightComponent } from './systems/lighting';
import { PlayerComponent } from './systems/player';
import {
  BARRIER_OR_PLAYER_MASK,
  BARRIER_OR_ENEMY_MASK,
} from './colisions-masks';

export type GunType = 'pistol' | 'mg' | 'minigun';

export interface GunOptions {
  code: string;
  name: string;
  shootSpeed: number;
  bulletSpeed: number;
  magazineCapacity: number;
  reloadTime: number;
  bulletLifetime: number;
  spread: number;
  defaultAmmo: number;
  priority: number;
  weight: number;
}

export const GUNS: {[key: string]: GunOptions} = {
  pistol: {
    code: 'Pistol',
    name: 'Pistol',
    magazineCapacity: 6,
    reloadTime: 2000,
    shootSpeed: 250,
    bulletSpeed: 6,
    bulletLifetime: 10000,
    spread: 0,
    defaultAmmo: 36,
    priority: 1,
    weight: 1,
  },
  mg: {
    code: 'MG',
    name: 'Machine gun',
    magazineCapacity: 30,
    reloadTime: 3000,
    shootSpeed: 80,
    bulletSpeed: 8,
    bulletLifetime: 15000,
    spread: Math.PI / 20,
    defaultAmmo: 120,
    priority: 2,
    weight: 1,
  },
  minigun: {
    code: 'Minigun',
    name: 'Minigun',
    magazineCapacity: 500,
    reloadTime: 5000,
    shootSpeed: 20,
    bulletSpeed: 10,
    bulletLifetime: 15000,
    spread: Math.PI / 15,
    defaultAmmo: 500,
    priority: 3,
    weight: 2.5,
  },
}

export class Gun {

  bulletsInMagazine: number;

  projectileSystem: ProjectileSystem;

  owner: AgentComponent;

  lastShootTime = 0;

  totalBullets: number;

  reloading = false;

  canHit: number;

  constructor(private engine: EntityEngine, public options: GunOptions) {
    this.totalBullets = options.defaultAmmo;
    this.bulletsInMagazine = this.options.magazineCapacity;
    this.projectileSystem = engine.getSystem<ProjectileSystem>(ProjectileSystem);
  }

  shoot() {
    const onCooldown =
      this.engine.time - this.lastShootTime < this.options.shootSpeed;

    if (onCooldown) {
      return false;
    }

    if (this.bulletsInMagazine === 0) {
      this.lastShootTime = this.engine.time;
      this.engine.sound.play('noAmmoA');
      this.engine.sound.play('noAmmoB');
      return false;
    }

    const rotation = this.owner.rot + (Math.random() - 0.5) * this.options.spread;
    const offset = new Vector2(0, 11).rotate(this.owner.rot);
    const vel = new Vector2(0, this.options.bulletSpeed).rotate(rotation);
    this.projectileSystem.makeProjectile(
      this.owner.posAndVel.pos.copy().add(offset),
      vel,
      this.options.bulletLifetime,
      this.canHit,
    );

    this.bulletsInMagazine--;
    this.totalBullets--;
    this.lastShootTime = this.engine.time;

    this.makeLight();
    this.engine.sound.play('shoot' + this.options.code);

    if (this.bulletsInMagazine === 0) {
      this.reload();
    }

    return true;
  }

  reload() {
    this.reloading = true;
    setTimeout(() => {
      this.bulletsInMagazine = Math.min(
        this.options.magazineCapacity, this.totalBullets,
      );
      this.reloading = false;
    }, this.options.reloadTime);
  }

  setOwner(agent: AgentComponent) {
    const isPlayer = agent.parent instanceof PlayerComponent;
    this.canHit = isPlayer ? BARRIER_OR_ENEMY_MASK : BARRIER_OR_PLAYER_MASK;
    this.owner = agent;
  }

  makeLight() {
    const offset = new Vector2(0, 13).rotate(this.owner.rot);
    const pos = this.owner.posAndVel.pos.copy().add(offset);
    const light = new LightComponent(this.engine, {
      pos,
      enabled: true,
      radius: 50,
    });

    setTimeout(() => light.destroy());
  }
}

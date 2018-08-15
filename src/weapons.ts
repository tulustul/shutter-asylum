import { ProjectileSystem } from './systems/projectile';
import { AgentComponent } from './systems/agent';
import { EntityEngine } from './systems/ecs';
import { Vector2 } from './vector';
import { LightComponent } from './systems/lighting';

interface GunOptions {
  name: string;
  shootSpeed: number;
  bulletSpeed: number;
  magazineCapacity: number;
  reloadTime: number;
  bulletLifetime: number;
  spread: number;
}

export const pistolOptions: GunOptions = {
  name: 'pistol',
  magazineCapacity: 6,
  reloadTime: 2000,
  shootSpeed: 250,
  bulletSpeed: 6,
  bulletLifetime: 10000,
  spread: Math.PI / 25,
}

export const mgOptions: GunOptions = {
  name: 'MG',
  magazineCapacity: 30,
  reloadTime: 3000,
  shootSpeed: 80,
  bulletSpeed: 8,
  bulletLifetime: 15000,
  spread: Math.PI / 20,
}

export const minigunOptions: GunOptions = {
  name: 'minigun',
  magazineCapacity: 500,
  reloadTime: 5000,
  shootSpeed: 0,
  bulletSpeed: 10,
  bulletLifetime: 15000,
  spread: Math.PI / 15,
}

export const flamethrowerOptions: GunOptions = {
  name: 'flamethrower',
  magazineCapacity: 30000,
  reloadTime: 1,
  shootSpeed: 0,
  bulletSpeed: 3.5,
  bulletLifetime: 600,
  spread: Math.PI / 6,
}

export class Gun {

  bulletsInMagazine: number;

  projectileSystem: ProjectileSystem;

  owner: AgentComponent;

  lastShootTime = 0;

  totalBullets = 1000;

  reloading = false;

  constructor(private engine: EntityEngine, public options: GunOptions) {
    this.bulletsInMagazine = this.options.magazineCapacity;
    this.projectileSystem = engine.getSystem<ProjectileSystem>(ProjectileSystem);
  }

  shoot() {
    const onCooldown =
      this.engine.time - this.lastShootTime < this.options.shootSpeed;

    if (onCooldown || this.bulletsInMagazine === 0 || this.reloading) {
      return;
    }

    const rotation = this.owner.rot + Math.random() * this.options.spread;
    const offset = new Vector2(0, 11).rotate(this.owner.rot);
    const vel = new Vector2(0, this.options.bulletSpeed).rotate(rotation);
    this.projectileSystem.makeProjectile(
      this.owner.posAndVel.pos.copy().add(offset), vel, this.options.bulletLifetime
    );

    this.bulletsInMagazine--;
    this.totalBullets--;
    this.lastShootTime = this.engine.time;

    this.makeLight();

    if (this.bulletsInMagazine === 0) {
      this.reload();
    }
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
    this.owner = agent;
    agent.weapon = this;
  }

  makeLight() {
    const offset = new Vector2(0, 13).rotate(this.owner.rot);
    const pos = this.owner.posAndVel.pos.copy().add(offset);
    const light = new LightComponent(this.engine, pos, {
      enabled: true,
      size: 50,
    });

    setTimeout(() => light.destroy(), 0);
  }
}

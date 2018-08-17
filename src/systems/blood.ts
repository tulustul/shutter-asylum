import { EntitySystem } from "./ecs";
import { ParticlesSystem } from "./particles";
import { BARRIER_MASK } from "../colisions-masks";
import { Vector2 } from "../vector";

interface BloodLeak {
  pos: Vector2;
  lastLeak: number;
  size: number;
  maxSize: number;
}

const LEAK_SPEED = 300;

export class BloodSystem extends EntitySystem<void> {

  toRender: Vector2[] = [];

  leaks: BloodLeak[] = [];

  leaksToRender: BloodLeak[] = [];

  emitBlood(pos: Vector2, vel: Vector2) {
    const particlesSystem = this.engine.getSystem<ParticlesSystem>(ParticlesSystem);

    particlesSystem.emit({
      pos,
      color: 'red',
      lifetime: 800,
      canHitDynamic: false,
      size: 1,
      canHit: BARRIER_MASK,
      onDeath: pos => this.toRender.push(pos),
    }, {
      count: Math.ceil(Math.random() * 50),
      direction: vel.copy().mul(0.2),
      spread: 0.9,
      speedSpread: 0.5,
      lifetimeSpread: 0.5,
    });
  }

  leakFromCorpse(pos: Vector2) {
    for (let i = 0; i < 3; i++) {
      const offset = new Vector2(6 - Math.random() * 12, 6 - Math.random() * 12);
      const leak = {
        pos: pos.copy().add(offset),
        lastLeak: 0,
        size: 0,
        maxSize: Math.random() * 5 + 3,
      };
      this.leaks.push(leak);
    }
  }

  update() {
    for (const leak of this.leaks) {
      if (this.engine.time - leak.lastLeak > LEAK_SPEED) {
        leak.lastLeak = this.engine.time;
        leak.size += 1;
        this.leaksToRender.push(leak);
        if (leak.size > leak.maxSize) {
          const index = this.leaks.indexOf(leak);
          this.leaks.splice(index, 1);
        }
      }
    }
  }
}

import { EntitySystem } from "./ecs";
import { ParticlesSystem } from "./particles";
import { BARRIER_MASK } from "../colisions-masks";
import { Vector2 } from "../vector";

interface Line {
  from: Vector2;
  to: Vector2;
}

interface BloodLeak {
  pos: Vector2;
  lastLeak: number;
  size: number;
  maxSize: number;
}

const LEAK_SPEED = 300;

export class BloodSystem extends EntitySystem<void> {

  toRender: Line[] = [];

  leaks: BloodLeak[] = [];

  leaksToRender: BloodLeak[] = [];

  emitBlood(pos: Vector2, vel: Vector2) {
    const particlesSystem = this.engine.getSystem<ParticlesSystem>(ParticlesSystem);

    particlesSystem.emit({
      pos,
      color: 'red',
      lifetime: 150,
      canHitDynamic: false,
      canHit: BARRIER_MASK,
      onDeath: bloodPos => {
        const bloodVel = new Vector2(0, vel.getLength() * 0.6).rotate(bloodPos.directionTo(pos));
        this.toRender.push({
          from: bloodPos, to:
          bloodPos.copy().add(bloodVel),
        });
      },
    }, {
      count: Math.ceil(Math.random() * 50) + 5,
      direction: vel.copy().mul(0.35),
      spread: 1.2,
      speedSpread: 0.8,
      lifetimeSpread: 0.9,
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

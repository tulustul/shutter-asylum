import { EntitySystem } from "./ecs";
import { Vector2 } from "../vector";
import { ParticlesSystem } from "./particles";

interface BloodLeak {
  pos: Vector2;
  lastLeak: number;
  progress: number;
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
    this.leaks.push({
      pos, lastLeak: 0, progress: 0,
    });
  }

  update() {
    for (const leak of this.leaks) {
      if (this.engine.time - leak.lastLeak > LEAK_SPEED) {
        leak.lastLeak = this.engine.time;
        leak.progress += 1;
        this.leaksToRender.push(leak);
        if (leak.progress === 9) {
          const index = this.leaks.indexOf(leak);
          this.leaks.splice(index, 1);
        }
      }
    }
  }
}

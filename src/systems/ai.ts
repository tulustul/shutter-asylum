import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { AgentComponent } from "./agent";
import { PlayerSystem } from "./player";
import { ColisionSystem } from "./colision";
import { Vector2 } from "../vector";
import { Gun, GUNS, GunType } from "../weapons";
import { difficulty } from "../difficulty";

import { ENEMY_MASK } from "../colisions-masks";
import { PosAndVel } from "./velocity";
import { ActionComponent } from "./actions";

const ALERT_TIME = 7000;

const ALERT_CHANGE_TARGET_TIME = 1500;

const IDLE_CHANGE_ROT_TIME = 3000;

enum AIState {
  idle,
  patroling,
  alerted,
  hiding,
  chasing,
  fighting,
}

interface AIOptions {
  pos: Vector2;
  canPatrol?: boolean;
  weapon?: GunType;
  maxHealth?: number;
  canBeAssasinated?: boolean;
}

export class AIComponent extends Entity {

  system: AISystem;

  agent: AgentComponent;

  lastThinking = this.engine.time + difficulty.aiReactionTime * Math.random();

  lastRotChange = 0;

  rotTarget = 0;

  rotSpeed = 2;

  pos: Vector2;

  canPatrol = false;

  playerInRange = false;

  seePlayer = false;

  hearPlayer = false;

  state: AIState;

  playerPos: Vector2;

  playerVel: Vector2;

  isShooting = false;

  moveTarget: Vector2;

  alertedAt: number;

  changedTargetAt: number;

  pointsVisitCount = new Map<Vector2, number>();

  action: ActionComponent;

  canBeAssasinated = true;

  constructor(private engine: EntityEngine, options: AIOptions) {
    super();

    Object.assign(this, options);

    this.agent = new AgentComponent(engine, options.pos, {
      colisionMask: ENEMY_MASK,
      maxHealth: (options.maxHealth || 5) * difficulty.enemyHealthMultiplier,
    });
    this.agent.parent = this;
    this.agent.onHit = () => this.state = AIState.alerted;
    if (options.weapon) {
      this.agent.addWeapon(new Gun(this.engine, GUNS[options.weapon]));
    }

    if (this.canPatrol) {
      this.agent.toggleFlashlight();
    }

    this.goIdle();

    engine.getSystem(AISystem).add(this);
  }

  destroy() {
    super.destroy();
    this.agent.destroy();
    this.destroyAction();
  }

  shootAt(pos: Vector2) {
    this.agent.rot = this.agent.posAndVel.pos.directionTo(pos);
    const weapon = this.agent.currentWeapon;
    if (!weapon || !weapon.reloading) {
      this.agent.shoot();
    }
  }

  shootAtPlayer() {
    const weapon = this.agent.currentWeapon;
    if (weapon && weapon.totalBullets === 0) {
      this.agent.currentWeapon = null;
    }

    const posAndVel = this.agent.posAndVel;
    const targetPos = this.playerPos.copy();

    const distance = posAndVel.pos.distanceTo(this.playerPos);
    if (weapon) {
      const bulletTravelTime = distance / weapon.options.bulletSpeed;
      targetPos.add(this.playerVel.copy().mul(bulletTravelTime));
      this.shootAt(targetPos);
    } else if (distance > 25) {
      this.moveTarget = targetPos;
    } else {
      this.shootAt(targetPos);
    }
  }

  think(playerPosAndVel: PosAndVel) {
    if (this.playerInRange) {
      this.playerPos = playerPosAndVel.pos.copy();
      this.playerVel = playerPosAndVel.vel.copy();
    }

    const playerSystem = this.engine.getSystem<PlayerSystem>(PlayerSystem);
    const isPlayerVisible = playerSystem.player.isVisible;
    this.isShooting = this.seePlayer && isPlayerVisible;

    switch (this.state) {
      case AIState.idle:
        this.whenIdle();
        break;
      case AIState.patroling:
        this.whenPatroling();
        break;
      case AIState.fighting:
        this.whenFighting();
        break;
      case AIState.hiding:
        this.whenHiding();
        break;
      case AIState.chasing:
        this.whenChasing();
        break;
      case AIState.alerted:
        this.whenAlerted();
        break;
    }
  }

  whenIdle() {
    if (this.engine.time - this.lastRotChange > IDLE_CHANGE_ROT_TIME) {
      this.rotTarget = Math.random() * Math.PI * 2;
      this.lastRotChange = this.engine.time;
    }

    if (this.seePlayer || this.hearPlayer) {
      this.goFighting();
      this.moveTarget = null;
      this.destroyAction();
      this.notifyNeighbours(this.playerPos);
    } else if (this.canPatrol) {
      this.state = AIState.patroling;
      this.agent.walk();
    }
  }

  whenPatroling() {
    this.whenIdle();
    if (!this.moveTarget) {

      const patrolPoints = this.system.getVisiblePatrolPoints(this.agentPos);
      if (!patrolPoints.length) {
        return;
      }

      let leastVisitedCount = Number.MAX_SAFE_INTEGER;
      let leastVisited = [];
      for (const point of patrolPoints) {
        const visitCount = this.pointsVisitCount.get(point) || 0;
        if (visitCount < leastVisitedCount) {
          leastVisitedCount = visitCount;
          leastVisited = [];
        }
        if (visitCount === leastVisitedCount) {
          leastVisited.push(point);
        }
      }

      let closestDistance = 1000;
      for (const point of leastVisited) {
        const distance = point.distanceTo(this.agentPos);
        if (distance < closestDistance) {
          closestDistance = distance;
          this.moveTarget = point;
        }
      }
      if (this.moveTarget) {
        const currentVisits = this.pointsVisitCount.get(this.moveTarget) || 0;
        this.pointsVisitCount.set(this.moveTarget, currentVisits + 1);
      }
    }
    if (this.moveTarget) {
      this.rotTarget = this.agentPos.directionTo(this.moveTarget);
    }
  }

  whenFighting() {
    this.agent.run();
    if (this.playerInRange) {
      this.isShooting = true;
    } else {
      this.state = AIState.chasing;
      this.moveTarget = this.playerPos;
    }
  }

  whenHiding() {

  }

  whenChasing() {
    if (this.playerInRange) {
      this.goFighting();
    } else if (!this.moveTarget) {
      this.goAlerted();
    }
  }

  whenAlerted() {
    this.rotTarget = Math.random() * Math.PI * 2;
    if (this.seePlayer || this.hearPlayer) {
      this.goFighting();
    }
    if (this.engine.time - this.alertedAt > ALERT_TIME) {
      this.goIdle();
    }
    if (this.engine.time - this.changedTargetAt > ALERT_CHANGE_TARGET_TIME) {
      const newTarget = new Vector2(
        (0.5 - Math.random()) * 200,
        (0.5 - Math.random()) * 200,
      );
      this.moveTarget = newTarget.add(this.agentPos);
      this.changedTargetAt = this.engine.time;
    }
  }

  goAlerted() {
    this.state = AIState.alerted;
    this.rotSpeed = 10;
    this.alertedAt = this.engine.time;
    this.changedTargetAt = this.engine.time;
    this.destroyAction();
  }

  goIdle() {
    this.state = AIState.idle;
    this.rotSpeed = 0.02;
    if (this.canBeAssasinated) {
      this.action = new ActionComponent(this.engine, {
        collidable: this.agent.collidable,
        text: 'kill',
        action: () => this.destroy(),
      });
    }
  }

  goFighting() {
    this.state = AIState.fighting;
    this.rotSpeed = 0.1;
  }

  notifyNeighbours(playerPos: Vector2) {
    for (const ai of this.system.entities) {
      if (ai.state === AIState.idle || ai.state === AIState.patroling) {
        const distance = this.agentPos.distanceTo(ai.pos);
        if (distance < 80) {
          ai.goAlerted();
          ai.moveTarget = playerPos;
        }
      }
    }
  }

  destroyAction() {
    if (this.action) {
      this.action.destroy();
      this.action = null;
    }
  }

  get agentPos() {
    return this.agent.posAndVel.pos;
  }

}

export class AISystem extends EntitySystem<AIComponent> {

  playerSystem: PlayerSystem;

  colisionSystem: ColisionSystem;

  patrolPoints: Vector2[] = [];

  init() {
    this.playerSystem = this.engine.getSystem<PlayerSystem>(PlayerSystem);
    this.colisionSystem = this.engine.getSystem<ColisionSystem>(ColisionSystem);
  }

  update() {
    if (!this.playerSystem.player) {
      return;
    }

    for (const entity of this.entities) {
      if (this.engine.time - entity.lastThinking > difficulty.aiReactionTime) {
        this.process(entity);
        entity.lastThinking = this.engine.time;
      }
      if (entity.isShooting) {
        entity.playerPos = this.playerPosAndVel.pos;
        entity.shootAtPlayer();
      }
      if (entity.moveTarget) {
        const dir = entity.agent.posAndVel.pos.directionTo(entity.moveTarget);
        entity.agent.moveToDirection(dir);
        const distance = entity.agent.posAndVel.pos.distanceTo(entity.moveTarget);
        if (distance < 20) {
          entity.moveTarget = null;
        }
      }
      if (entity.rotTarget !== entity.agent.rot) {
        const diff = entity.rotTarget - entity.agent.rot;
        const d1 = Math.abs(diff) > Math.PI ? -1 : 1;
        const d2 = entity.rotTarget > entity.agent.rot ? 1 : -1;
        entity.agent.rot += entity.rotSpeed * d1 * d2;
        if (entity.agent.rot >= Math.PI * 2) {
          entity.agent.rot -= Math.PI * 2;
        } else if (entity.agent.rot < 0) {
          entity.agent.rot += Math.PI * 2;
        }
        if (Math.abs(entity.agent.rot - entity.rotTarget) < 0.05) {
          entity.agent.rot = entity.rotTarget;
        }
      }
    }
  }

  process(ai: AIComponent) {
    ai.playerInRange = this.isPlayerInRange(ai);
    ai.hearPlayer = ai.playerInRange && this.player.isNoisy;

    let angleDiff: number;
    if (ai.playerInRange) {
      const agentPos = ai.agent.posAndVel.pos;
      const playerPos = this.playerPosAndVel.pos;
      const direction = agentPos.directionTo(playerPos);
      angleDiff = Math.min(
        (2 * Math.PI) - Math.abs(direction - ai.agent.rot),
        Math.abs(direction - ai.agent.rot),
      );
    }

    ai.seePlayer =
      ai.playerInRange && angleDiff < 1.2 && this.player.isVisible;

    ai.think(this.playerPosAndVel);
  }

  isPlayerInRange(entity: AIComponent) {
    return !this.colisionSystem.castRay(
      entity.agent.posAndVel.pos,
      this.playerPosAndVel.pos,
    );
  }

  get player() {
    return this.playerSystem.player;
  }

  get playerPosAndVel() {
    return this.player.agent.posAndVel;
  }

  addPatrolPoint(pos: Vector2) {
    this.patrolPoints.push(pos);
  }

  getVisiblePatrolPoints(pos: Vector2) {
    return this.patrolPoints.filter(p => !this.colisionSystem.castRay(pos, p));
  }

}

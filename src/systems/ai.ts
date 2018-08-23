import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { AgentComponent } from "./agent";
import { PlayerSystem } from "./player";
import { ColisionSystem } from "./colision";
import { Vector2 } from "../vector";
import { Gun, mgOptions } from "../weapons";
import { ENEMY_MASK } from "../colisions-masks";
import { PosAndVel } from "./velocity";
import { ActionComponent } from "./actions";

const AVERAGE_REACTION_TIME = 300;

const ALERT_TIME = 10000;

const ALERT_CHANGE_TARGET_TIME = 1500;

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
}

export class AIComponent extends Entity {

  system: AISystem;

  agent: AgentComponent;

  lastThinking = AVERAGE_REACTION_TIME * Math.random();

  pos: Vector2;

  canPatrol = false;

  weapon: Gun;

  playerInRange = false;

  playerInSight = false;

  state: AIState;

  playerPos: Vector2;

  playerVel: Vector2;

  isShooting = false;

  moveTarget: Vector2;

  alertedAt: number;

  changedTargetAt: number;

  pointsVisitCount = new Map<Vector2, number>();

  action: ActionComponent;

  constructor(private engine: EntityEngine, options: AIOptions) {
    super();

    Object.assign(this, options);

    this.agent = new AgentComponent(engine, options.pos, {colisionMask: ENEMY_MASK});
    this.agent.parent = this;
    this.agent.onHit = () => this.state = AIState.alerted;
    this.weapon = new Gun(this.engine, mgOptions);
    this.weapon.setOwner(this.agent);

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
    this.agent.shoot();
  }

  shootAtPlayer() {
    const posAndVel = this.agent.posAndVel;
    const targetPos = this.playerPos.copy();
    const distance = posAndVel.pos.distanceTo(this.playerPos);
    const bulletTravelTime = distance / this.weapon.options.bulletSpeed;

    targetPos.add(this.playerVel.copy().mul(bulletTravelTime));

    this.shootAt(targetPos);
  }


  think(playerPosAndVel: PosAndVel) {
    if (this.playerInSight) {
      this.playerPos = playerPosAndVel.pos.copy();
      this.playerVel = playerPosAndVel.vel.copy();
    }

    const playerSystem = this.engine.getSystem<PlayerSystem>(PlayerSystem);
    const visibility = playerSystem.player.visibility;
    this.isShooting = this.playerInSight && visibility > 100;3

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
    this.agent.rot = Math.random() * Math.PI * 2;
    const playerSystem = this.engine.getSystem<PlayerSystem>(PlayerSystem);
    const visibility = playerSystem.player.visibility;

    if (this.playerInSight && visibility > 100) {
      this.state = AIState.fighting;
      this.moveTarget = null;
      this.destroyAction();
      this.notifyNeighbours(this.playerPos);
    } else if (this.canPatrol) {
      this.state = AIState.patroling;
      this.agent.maxSpeed = 0.5;
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
      this.agent.rot = this.agentPos.directionTo(this.moveTarget);
    }
  }

  whenFighting() {
    this.agent.maxSpeed = 3;
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
      this.state = AIState.fighting;
    } else if (!this.moveTarget) {
      this.goAlerted();
    }
  }

  whenAlerted() {
    this.agent.rot = Math.random() * Math.PI * 2;
    if (this.playerInSight) {
      this.state = AIState.fighting;
    }
    if (this.engine.time - this.alertedAt > ALERT_TIME) {
      this.state = AIState.idle;
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
    this.alertedAt = this.engine.time;
    this.changedTargetAt = this.engine.time;
    this.destroyAction();
  }

  goIdle() {
    this.state = AIState.idle;
    this.action = new ActionComponent(this.engine, {
      collidable: this.agent.collidable,
      text: 'kill',
      action: () => this.destroy(),
    });
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
      if (this.engine.time - entity.lastThinking > AVERAGE_REACTION_TIME) {
        this.process(entity);
        entity.lastThinking = this.engine.time;
      }
      if (entity.isShooting) {
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
    }
  }

  process(entity: AIComponent) {
    entity.playerInRange = this.isPlayerInRange(entity);

    let angleDiff: number;
    if (entity.playerInRange) {
      const agentPos = entity.agent.posAndVel.pos;
      const playerPos = this.playerPosAndVel.pos;
      const direction = agentPos.directionTo(playerPos);
      angleDiff = Math.min(
        (2 * Math.PI) - Math.abs(direction - entity.agent.rot),
        Math.abs(direction - entity.agent.rot),
      );
    }

    entity.playerInSight = entity.playerInRange && angleDiff < 1.2;

    entity.think(this.playerPosAndVel);
  }

  isPlayerInRange(entity: AIComponent) {
    return !this.colisionSystem.castRay(
      entity.agent.posAndVel.pos,
      this.playerPosAndVel.pos,
    );
  }

  get playerPosAndVel() {
    return this.playerSystem.player.agent.posAndVel;
  }

  addPatrolPoint(pos: Vector2) {
    this.patrolPoints.push(pos);
  }

  getVisiblePatrolPoints(pos: Vector2) {
    return this.patrolPoints.filter(p => !this.colisionSystem.castRay(pos, p));
  }

}

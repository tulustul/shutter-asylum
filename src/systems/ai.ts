import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { AgentComponent } from "./agent";
import { PlayerSystem } from "./player";
import { ColisionSystem } from "./colision";
import { Vector2 } from "../vector";
import { Gun, mgOptions } from "../weapons";
import { ENEMY_MASK } from "../colisions-masks";
import { PosAndVel } from "./velocity";

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

export class AIComponent extends Entity {

  system: AISystem;

  agent: AgentComponent;

  lastThinking = AVERAGE_REACTION_TIME * Math.random();

  weapon: Gun;

  playerInRange = false;

  playerInSight = false;

  state = AIState.idle;

  playerPos: Vector2;

  playerVel: Vector2;

  isShooting = false;

  moveTarget: Vector2;

  alertedAt: number;

  changedTargetAt: number;

  constructor(private engine: EntityEngine, pos: Vector2) {
    super();
    this.agent = new AgentComponent(engine, pos, {colisionMask: ENEMY_MASK});
    this.agent.parent = this;
    this.agent.onHit = () => this.state = AIState.alerted;
    this.weapon = new Gun(this.engine, mgOptions);
    this.weapon.setOwner(this.agent);

    engine.getSystem(AISystem).add(this);
  }

  destroy() {
    super.destroy();
    this.agent.destroy();
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
    this.isShooting = this.playerInSight;
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
    if (this.playerInSight) {
      this.state = AIState.fighting;
      this.notifyNeighbours(this.playerPos);
    }
  }

  whenPatroling() {

  }

  whenFighting() {
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
      this.moveTarget = newTarget.add(this.pos);
      this.changedTargetAt = this.engine.time;
    }
  }

  goAlerted() {
    this.state = AIState.alerted;
    this.alertedAt = this.engine.time;
    this.changedTargetAt = this.engine.time;
  }

  notifyNeighbours(playerPos: Vector2) {
    for (const ai of this.system.entities) {
      if (ai.state === AIState.idle || ai.state === AIState.patroling) {
        const distance = this.pos.distanceTo(ai.pos);
        if (distance < 100) {
          ai.goAlerted();
          ai.moveTarget = playerPos;
        }
      }
    }
  }

  get pos() {
    return this.agent.posAndVel.pos;
  }

}

export class AISystem extends EntitySystem<AIComponent> {

  playerSystem: PlayerSystem;

  colisionSystem: ColisionSystem;

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
        if (distance < 10) {
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

}

import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { AgentComponent } from "./agent";
import { PlayerSystem } from "./player";
import { ColisionSystem } from "./colision";
import { Vector2 } from "../vector";
import { Gun, mgOptions } from "../weapons";

const THINKING_FREQ = 300;

export class AIComponent extends Entity {

  agent: AgentComponent;

  lastThinking = 0;

  weapon: Gun;

  constructor(private engine: EntityEngine, pos: Vector2) {
    super();
    this.agent = new AgentComponent(engine, pos);
    this.agent.parent = this;
    this.weapon = new Gun(this.engine, mgOptions);
    this.weapon.setOwner(this.agent);

    engine.getSystem(AISystem).add(this);
  }

  destroy() {
    super.destroy();
    this.agent.destroy();
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
      if (this.engine.time - entity.lastThinking > THINKING_FREQ) {
        this.process(entity);
      }
    }
  }

  process(entity: AIComponent) {
    if (this.canSeePlayer(entity)) {
      entity.agent.shootAt(this.playerSystem.player.agent.posAndVel.pos);
    }
  }

  canSeePlayer(entity: AIComponent) {
    return !this.colisionSystem.castRay(
      entity.agent.posAndVel.pos,
      this.playerSystem.player.agent.posAndVel.pos,
      entity.agent.collidable,
    );
  }

}

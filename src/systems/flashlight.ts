import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { AgentComponent } from "./agent";

export class FlashlightComponent extends Entity {

  constructor(public agent: AgentComponent) {
    super();
    agent.engine.getSystem(FlashlightSystem).add(this);
  }
}

export class FlashlightSystem extends EntitySystem<FlashlightComponent> {
  update() {}

}

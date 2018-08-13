import { AgentComponent } from './agent.js';
import { EntitySystem, EntityEngine } from './ecs.js';
import { Control } from '../control.js';
import { Camera } from '../camera.js';
import { Vector2 } from '../vector.js';

export class PlayerComponent {

  agent: AgentComponent;

  constructor(private engine: EntityEngine, pos: Vector2) {
    engine.getSystem(PlayerSystem).add(this);
    this.agent = new AgentComponent(this.engine, pos);
    this.agent.posAndVel.friction = 1.1;
  }

}

export class PlayerSystem extends EntitySystem<PlayerComponent> {

  constructor(private control: Control, private camera: Camera) {
    super();
  }

  update() {
    for (const player of this.entities) {
      player.agent.rot = this.control.rot

      if (this.control.keys.get('w')) {
        player.agent.moveTop();
      }
      if (this.control.keys.get("a")) {
        player.agent.moveLeft();
      }
      if (this.control.keys.get("s")) {
        player.agent.moveDown();
      }
      if (this.control.keys.get("d")) {
        player.agent.moveRight();
      }
      if (this.control.mouseButtons.get(0) || this.control.keys.get(" ")) {
        player.agent.shoot();
      }

      this.camera.setOnPlayer(player);
    }
  }
}

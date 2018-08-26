import { Vector2 } from './vector';
import { AgentComponent } from './systems/agent';

export class Camera {

  pos = new Vector2();

  agent: AgentComponent;

  constructor(private canvas: HTMLCanvasElement) {}

  connectWithAgent(agent: AgentComponent) {
    this.agent = agent;
  }

  update() {
    this.pos.x = -this.agent.posAndVel.pos.x + this.canvas.width / 2;
    this.pos.y = -this.agent.posAndVel.pos.y + this.canvas.height / 2;
    this.pos.quantify();
  }
}

import { Vector2 } from './vector';
import { PlayerComponent } from './systems/player';

export class Camera {

  pos = new Vector2();

  constructor(private canvas: HTMLCanvasElement) {}

  setOnPlayer(player: PlayerComponent) {
    // if (player) {
      this.pos.x = -player.agent.posAndVel.pos.x + this.canvas.width / 2;
      this.pos.y = -player.agent.posAndVel.pos.y + this.canvas.height / 2;
      this.pos.quantify();
    // }
  }
}

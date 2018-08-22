import { Vector2 } from "./vector";

import { EntityEngine } from "./systems/ecs";
import { PlayerSystem } from "./systems/player";
import { ActionsSystem } from "./systems/actions";

export class Control {

  keys = new Map<string, boolean>();

  mouseButtons = new Map<number, boolean>();

  mousePos = new Vector2();

  rot = 0;

  constructor(private engine: EntityEngine,  private canvas: HTMLCanvasElement) {}

  init() {
    const playerSystem = this.engine.getSystem<PlayerSystem>(PlayerSystem);
    const actionsSystem = this.engine.getSystem<ActionsSystem>(ActionsSystem);

    window.addEventListener('keydown', event => this.keys.set(event.key, true));

    window.addEventListener('keyup', event => this.keys.set(event.key, false));

    window.addEventListener('keypress', event => {
      if (event.key === 'q') {
        playerSystem.nextWeapon();
      } else if (event.key === 'r') {
        playerSystem.player.agent.weapon.reload();
      } else if (event.key === 'e') {
        if (actionsSystem.action) {
          actionsSystem.action.trigger();
        }
      } else if (event.key === 'f') {
        playerSystem.player.agent.toggleFlashlight();
      }
    });

    window.addEventListener('mousemove', event => {
      this.mousePos.x = Math.round(this.canvas.width * event.clientX / window.innerWidth);
      this.mousePos.y = Math.round(this.canvas.height * event.clientY / window.innerHeight);

      this.rot = Math.atan2(
        this.canvas.height / 2 - this.mousePos.y,
        this.canvas.width / 2 - this.mousePos.x,
      ) + Math.PI / 2;
    });

    window.addEventListener('mousedown', event => {
      this.mouseButtons.set(event.button, true);
      if (event.button === 1) {
        playerSystem.player.agent.toggleFlashlight();
      }
    });

    window.addEventListener('mouseup', event => {
      this.mouseButtons.set(event.button, false);
    });
  }
}

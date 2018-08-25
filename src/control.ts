import { Vector2 } from "./vector";

import { EntityEngine } from "./systems/ecs";
import { PlayerSystem } from "./systems/player";
import { ActionsSystem } from "./systems/actions";
import { Menu } from "./menu";

export class Control {

  keys = new Map<string, boolean>();

  mouseButtons = new Map<number, boolean>();

  mousePos = new Vector2();

  rot = 0;

  constructor(
    private engine: EntityEngine,
    private canvas: HTMLCanvasElement,
    private menu: Menu,
  ) {}

  init() {
    window.addEventListener('keydown', event => {
      const playerSystem = this.engine.getSystem<PlayerSystem>(PlayerSystem);

      this.keys.set(event.code, true);

      if (event.key === 'Escape') {
        this.engine.paused = !this.engine.paused;
        this.menu.active = this.engine.paused;
      } else if (event.code === 'KeyC' || event.key === 'Shift') {
        playerSystem.player.agent.toggleWalkRun();
      }

    });

    window.addEventListener('keyup', event => {
      const playerSystem = this.engine.getSystem<PlayerSystem>(PlayerSystem);
      this.keys.set(event.code, false);

      if (event.key === 'Shift') {
        playerSystem.player.agent.toggleWalkRun();
      }
    });

    window.addEventListener('keypress', event => {
      if (this.engine.paused) {
        return;
      }

      const playerSystem = this.engine.getSystem<PlayerSystem>(PlayerSystem);
      const actionsSystem = this.engine.getSystem<ActionsSystem>(ActionsSystem);

      if (event.code === 'KeyQ') {
        playerSystem.nextWeapon();
      } else if (event.code === 'KeyR') {
        playerSystem.player.agent.weapon.reload();
      } else if (event.code === 'KeyE') {
        if (actionsSystem.action) {
          actionsSystem.action.trigger();
        }
      } else if (event.code === 'KeyF') {
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
      if (this.engine.paused) {
        return;
      }

      const playerSystem = this.engine.getSystem<PlayerSystem>(PlayerSystem);

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

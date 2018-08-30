import { Vector2 } from "./vector";

import { EntityEngine } from "./systems/ecs";
import { PlayerSystem } from "./systems/player";
import { ActionsSystem } from "./systems/actions";
import { Menu } from "./menu";
import { Game } from "./game";

export class Control {

  keys = new Map<string, boolean>();

  mouseButtons = new Map<number, boolean>();

  mousePos = new Vector2();

  rot = 0;

  constructor(private game: Game) {}

  init() {
    window.addEventListener('keydown', event => {
      const playerSystem = this.game.engine.getSystem<PlayerSystem>(PlayerSystem);

      this.keys.set(event.code, true);

      if (event.key === 'Escape') {
        if (this.game.isStarted) {
          this.game.paused = !this.game.paused;
          this.game.mainMenu.menu.active = this.game.paused;
          this.game.mainMenu.menu.activeMenu.backToParent();
        }
      } else if (event.code === 'KeyC' || event.key === 'Shift') {
        if (playerSystem.player) {
          playerSystem.player.agent.toggleWalkRun();
        }
      } else if (event.key === 'Enter' && !this.game.paused) {
        if (this.game.stageCompleted) {
          this.game.loadNextLevel();
        } else if (this.game.isPlayerDead) {
          this.game.restartLevel();
        }
      } else if (event.key === 'z') {
        this.game.engine.sound.play('emptyMagazine');
      }

      if (this.game.mainMenu.menu.active) {
        if (event.code === 'KeyW' || event.key === 'ArrowUp') {
          this.game.mainMenu.menu.movePointer(-1);
        } else if (event.code === 'KeyS' || event.key === 'ArrowDown') {
          this.game.mainMenu.menu.movePointer(1);
        } else if (event.key === 'Enter' || event.key === ' ' || event.code === 'KeyE') {
          this.game.mainMenu.menu.select();
        }
      }
    });

    window.addEventListener('keyup', event => {
      const playerSystem = this.game.engine.getSystem<PlayerSystem>(PlayerSystem);
      this.keys.set(event.code, false);

      if (event.key === 'Shift') {
        if (playerSystem.player) {
          playerSystem.player.agent.toggleWalkRun();
        }
      }
    });

    window.addEventListener('keypress', event => {
      if (this.game.paused) {
        return;
      }

      const playerSystem = this.game.engine.getSystem<PlayerSystem>(PlayerSystem);
      const actionsSystem = this.game.engine.getSystem<ActionsSystem>(ActionsSystem);

      if (!playerSystem.player) {
        return;
      }

      if (event.code === 'KeyQ') {
        playerSystem.player.agent.nextWeapon();
      } else if (event.code === 'KeyR') {
        if (playerSystem.player.agent.currentWeapon) {
          playerSystem.player.agent.currentWeapon.reload();
        }
      } else if (event.code === 'KeyE') {
        if (actionsSystem.action) {
          actionsSystem.action.trigger();
        }
      } else if (event.code === 'KeyF') {
        playerSystem.player.agent.toggleFlashlight();
      }
    });

    window.addEventListener('mousemove', event => {
      this.mousePos.x = Math.round(this.game.canvas.width * event.clientX / window.innerWidth);
      this.mousePos.y = Math.round(this.game.canvas.height * event.clientY / window.innerHeight);

      this.rot = Math.atan2(
        this.game.canvas.height / 2 - this.mousePos.y,
        this.game.canvas.width / 2 - this.mousePos.x,
      ) + Math.PI / 2;
    });

    window.addEventListener('mousedown', event => {
      if (this.game.paused) {
        return;
      }

      const playerSystem = this.game.engine.getSystem<PlayerSystem>(PlayerSystem);

      this.mouseButtons.set(event.button, true);
      if (event.button === 1 && playerSystem.player) {
        playerSystem.player.agent.toggleFlashlight();
      }
    });

    window.addEventListener('mouseup', event => {
      this.mouseButtons.set(event.button, false);
    });
  }
}

import { Layer } from './layer';

import { PlayerSystem, PlayerComponent } from '../systems/player';
import { ActionsSystem } from '../systems/actions';

import { Game } from '../game';
import { SPRITES_MAP } from '../sprites';

const NOTIFICATION_DISPLAY_TIME = 1500;

export class GuiRenderer {

  interfaceLayer = new Layer('interface', this.game.renderer, {
    followPlayer: false,
    clear: true,
  });

  constructor(private game: Game) { }

  get context() {
    return this.game.renderer.context;
  }

  get engine() {
    return this.game.engine;
  }

  get canvas() {
    return this.game.canvas;
  }

  render() {
    this.interfaceLayer.activate();

    this.context.textBaseline = 'top';
    this.context.shadowColor = 'black';
    this.context.shadowBlur = 4;

    if (this.game.paused) {
      this.renderMenu();
    } else {
      this.renderGameGui();
    }
  }

  renderMenu() {
    this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBloodyText('Shutter Asylum', 26, 20);

    this.context.fillStyle = 'white';
    this.context.font = '15px sans-serif';

    const menu = this.game.mainMenu.menu;

    let y = 60;
    for (const option of menu.activeMenu.options) {
      let text: string;
      if (typeof option.text === 'string') {
        text = option.text as string;
      } else {
        text = (option.text as Function)();
      }

      this.drawTextCentered(text, 15, y);
      const optionWidth = this.context.measureText(text).width;
      const x = (this.canvas.width - optionWidth) / 2;
      this.context.fillText(text, x, y);
      if (menu.selectedOption === option) {
        this.context.beginPath();
        this.context.arc(x - 10, y + 8, 5, 0, Math.PI * 2);
        this.context.fill();
      }
      y += 20;
    }

    this.context.fillStyle = 'grey';
    for (const option of menu.activeMenu.staticOptions) {
      this.drawTextCentered(option, 15, y);
      y += 20;
    }
  }

  renderGameGui() {
    const player = this.engine.getSystem<PlayerSystem>(PlayerSystem).entities[0];

    this.context.fillStyle = 'white';

    let y = 50;

    if (this.game.stageCompleted) {
      const duration = (this.game.levelFinishDuration / 1000).toFixed(1);
      this.drawTextCentered(`STAGE CLEARED in ${duration}s`, 20, y);
      if (this.game.newBestTime) {
        this.drawTextCentered('New best time!', 18, y += 20);
      }
      if (!this.game.gameCompleted) {
        this.drawTextCentered('Press <enter> to proceed', 14, y += 20);
      }
    }

    if (this.game.gameCompleted) {
      this.drawTextCentered('THAT\'S ALL', 20, y += 40);
      this.drawTextCentered('This was the last level', 14, y += 20);
      this.drawTextCentered('Try harder difficulty for more challenges', 14, y += 20);
    }

    this.context.font = '12px sans-serif';
    if (player) {
      this.renderPlayerContext(player);
      this.renderBottomBar(player);
    } else if (!this.game.isLoading) {
      this.drawBloodyText('YOU DIED', 26, y += 20);
      if (!this.game.stageCompleted) {
        this.drawTextCentered('Press <enter> to try again', 14, y += 40);
      }
    }

    if (this.game.notification) {
      const timeDiff = this.engine.time - this.game.notification.timestamp;
      const progress = timeDiff / NOTIFICATION_DISPLAY_TIME;
      const fontSize = 22;
      const y = this.game.canvas.height / 2 - fontSize * 1.5;
      this.context.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
      this.drawTextCentered(this.game.notification.text, fontSize, y);

      if (timeDiff > NOTIFICATION_DISPLAY_TIME) {
        this.game.notification = null;
      }
    }
  }

  renderPlayerContext(player: PlayerComponent) {
    const action = this.engine.getSystem<ActionsSystem>(ActionsSystem).action;
    const weapon = player.agent.currentWeapon;
    let contextText = '';

    let iconOffset = -8;
    if (weapon && weapon.reloading) {
      this.drawContextIcon('reload', iconOffset);
      iconOffset += 8;
    }

    if (!player.agent.isRunning) {
      if (player.isVisible) {
        this.drawContextIcon('visible', iconOffset);
      } else {
        this.drawContextIcon('hidden', iconOffset);
      }
    }

    if (action) {
      contextText += `${action.text} (E)`;
    }
    const contextTextWidth = this.context.measureText(contextText).width;
    this.context.fillText(
      contextText,
      this.canvas.width / 2 - contextTextWidth / 2,
      this.canvas.height / 2 + 20,
    );
  }

  renderBottomBar(player: PlayerComponent) {
    const weapon = player.agent.currentWeapon;

    const y = this.canvas.height - 20;

    if (weapon) {
      const weaponName = weapon.options.name;
      const bullets = weapon.bulletsInMagazine;
      const capacity = weapon.options.magazineCapacity;
      const total = weapon.totalBullets;
      const text = `${weaponName} ${bullets} / ${capacity} (${total})`;
      this.context.fillText(text, 10, y);
    } else {
      this.context.fillText('NO WEAPON', 10, y);
    }
  }

  drawContextIcon(iconName: string, offset: number) {
    const sprite = SPRITES_MAP[iconName];
    this.context.drawImage(
      this.game.renderer.texture,
      sprite.x, sprite.y,
      sprite.w, sprite.h,
      this.canvas.width / 2 + offset,
      this.canvas.height / 2 + 18,
      sprite.w, sprite.h,
    );
  }

  drawTextCentered(text: string, fontSize: number, y: number) {
    this.context.font = `${fontSize}px sans-serif`;
    const textWidth = this.context.measureText(text).width;
    const x = this.game.canvas.width / 2 - textWidth / 2;
    this.context.fillText(text, x, y);
    return [x, textWidth];
  }

  drawBloodyText(text: string, fontSize: number, y: number) {
    this.context.font = `${fontSize}px sans-serif`;
    this.context.fillStyle = 'red';

    this.drawTextCentered(text, fontSize, y);

    this.context.fillStyle = 'white';
  }

}

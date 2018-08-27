import { Layer } from './layer';

import { PlayerSystem, PlayerComponent } from '../systems/player';
import { ActionsSystem } from '../systems/actions';

import { Game } from '../game';
import { SPRITES_MAP } from '../sprites';

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

    this.context.fillStyle = 'red';
    this.context.font = '22px sans-serif';

    const title = 'Welcome to Shutter Asylum'
    const titleWidth = this.context.measureText(title).width;
    this.context.fillText(title, (this.canvas.width - titleWidth) / 2, 20);

    this.context.fillStyle = 'white';
    this.context.font = '15px sans-serif';

    let y = 60;
    for (const option of this.game.menu.options) {
      let text: string;
      if (typeof option.text === 'string') {
        text = option.text as string;
      } else {
        text = (option.text as Function)();
      }
      const optionWidth = this.context.measureText(text).width;
      const x = (this.canvas.width - optionWidth) / 2;
      this.context.fillText(text, x, y);
      if (this.game.menu.selectedOption === option) {
        this.context.beginPath();
        this.context.arc(x - 10, y + 8, 5, 0, Math.PI * 2);
        this.context.fill();
      }
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
      this.drawTextCentered('Press <enter> to proceed', 14, y += 20);
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
      this.drawTextCentered('YOU DIED', 20, y += 20);
      if (!this.game.stageCompleted) {
        this.drawTextCentered('Press <enter> to try again', 14, y += 20);
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

    if (weapon) {
      const weaponName = weapon.options.name;
      const bullets = weapon.bulletsInMagazine;
      const capacity = weapon.options.magazineCapacity;
      const total = weapon.totalBullets;
      const text = `${weaponName} ${bullets} / ${capacity} (${total})`;
      this.context.fillText(text, 10, 380);
    } else {
      this.context.fillText('NO WEAPON', 10, 380);
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
      this.context.fillText(
        text, this.game.canvas.width / 2 - textWidth / 2, y,
      );
  }

}

import { Layer } from './layer';
import { Renderer } from './renderer';

import { PlayerSystem } from '../systems/player';
import { ActionsSystem } from '../systems/actions';

import { Menu } from '../menu';
import { SPRITES_MAP } from '../sprites';
import { mgOptions } from '../weapons';

export class GuiRenderer {

  interfaceLayer = new Layer('interface', this.renderer, {
    followPlayer: false,
    clear: true,
  });

  constructor(private renderer: Renderer, private menu: Menu) { }

  get context() {
    return this.renderer.context;
  }

  get engine() {
    return this.renderer.engine;
  }

  get canvas() {
    return this.renderer.canvas;
  }

  render() {
    this.interfaceLayer.activate();
    if (this.engine.paused) {
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
    this.context.fillText(title, (this.canvas.width - titleWidth) / 2, 50);

    this.context.font = '15px sans-serif';

    let y = 100;
    for (const option of this.menu.options) {
      let text: string;
      if (typeof option.text === 'string') {
        text = option.text as string;
      } else {
        text = (option.text as Function)();
      }
      const optionWidth = this.context.measureText(text).width;
      const x = (this.canvas.width - optionWidth) / 2;
      this.context.fillText(text, x, y);
      if (this.menu.selectedOption === option) {
        this.context.beginPath();
        this.context.arc(x - 10, y - 5, 5, 0, Math.PI * 2);
        this.context.fill();
      }
      y += 20;
    }
  }

  renderGameGui() {
    const player = this.engine.getSystem<PlayerSystem>(PlayerSystem).entities[0];
    const action = this.engine.getSystem<ActionsSystem>(ActionsSystem).action;

    this.context.fillStyle = 'red';
    this.context.font = '12px sans-serif';
    if (player) {
      const weapon = player.agent.weapon;
      let contextText = '';

      let iconOffset = -8;
      if (weapon.reloading) {
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
        this.canvas.height / 2 + 33,
      );

      const text = `
  ${weapon.options.name}
  ${weapon.bulletsInMagazine} / ${weapon.options.magazineCapacity}
  (${weapon.totalBullets})
  `;
      this.context.fillText(text, 0, 380);
    } else {
      this.context.font = '20px sans-serif';
      const gameoverText = 'YOU DIED';
      const textWidth = this.context.measureText(gameoverText).width;
      this.context.fillText(
        gameoverText, this.renderer.canvas.width / 2 - textWidth / 2, 150,
      );
    }
  }

  drawContextIcon(iconName: string, offset: number) {
    const sprite = SPRITES_MAP[iconName];
    this.context.drawImage(
      this.renderer.texture,
      sprite.x, sprite.y,
      sprite.w, sprite.h,
      this.canvas.width / 2 + offset,
      this.canvas.height / 2 + 18,
      sprite.w, sprite.h,
    );
  }

}

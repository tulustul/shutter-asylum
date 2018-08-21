import { Layer } from './layer';
import { Renderer } from './renderer';

import { PlayerSystem } from '../systems/player';
import { ActionsSystem } from '../systems/actions';

export class GuiRenderer {

  interfaceLayer = new Layer('interface', this.renderer, {followPlayer: false});

  constructor(private renderer: Renderer) { }

  get context() {
    return this.renderer.context;
  }

  get engine() {
    return this.renderer.engine;
  }

  render() {
    this.interfaceLayer.activate();
    this.renderInterface();
  }

  renderInterface() {
    const player = this.engine.getSystem<PlayerSystem>(PlayerSystem).entities[0];
    const action = this.engine.getSystem<ActionsSystem>(ActionsSystem).action;

    this.context.fillStyle = 'red';
    this.context.font = '12px sans-serif';
    if (player) {
      const weapon = player.agent.weapon;
      let contextText = '';

      if (weapon.reloading) {
        contextText = 'REL ';
      }

      if (action) {
        contextText += `${action.text} (E)`;
      }


      this.context.fillText(contextText, 170, 230);

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

}

import { Menu } from "./menu";
import { Game } from "./game";
import { difficulty, setNextDifficulty } from "./difficulty";
import { LEVELS_COUNT } from "./constants";


export class MainMenu {

  menu = new Menu();

  levelsMenu = new Menu();

  controlsMenu = new Menu();

  objectiveMenu = new Menu();

  constructor(private game: Game) {
    this.menu.addOption({
      text: 'Start new game',
      callback: () => this.game.start(1),
    });

    this.menu.addSubmenu('Levels selection', this.levelsMenu);

    this.menu.addOption({
      text: () => `Difficulty: ${difficulty.name}`,
      callback: () => {
        setNextDifficulty();
        this.updateLevelsList();
        this.menu.active = true;
      }, 
    });

    this.menu.addSubmenu('Show controls', this.controlsMenu);

    this.controlsMenu.addOption({
      text: 'Back',
      callback: () => this.levelsMenu.backToParent(),
    })
    this.controlsMenu.addStaticOption('WASD - movement');
    this.controlsMenu.addStaticOption('mouse - aiming');
    this.controlsMenu.addStaticOption('SPACE, LMB - shooting');
    this.controlsMenu.addStaticOption('F, MMB - flashlight');
    this.controlsMenu.addStaticOption('Q - change weapon');
    this.controlsMenu.addStaticOption('E - use');
    this.controlsMenu.addStaticOption('C - toggle sneak/run');
    this.controlsMenu.addStaticOption('SHIFT - sneak/run');
    this.controlsMenu.addStaticOption('ESC - toggle pause and menu');

    this.menu.addSubmenu('Game objective', this.objectiveMenu);

    this.objectiveMenu.addOption({
      text: 'Back',
      callback: () => this.objectiveMenu.backToParent(),
    })

    this.objectiveMenu.addStaticOption('Fight your way back to home through the');
    this.objectiveMenu.addStaticOption('Shutter Asylum.');

    this.objectiveMenu.addStaticOption('The game\'s main objective is to kill');
    this.objectiveMenu.addStaticOption('each enemy in every stage.');

    this.objectiveMenu.addStaticOption('Additional objective is to speed run');
    this.objectiveMenu.addStaticOption('each level, best times are recorded.');

    this.objectiveMenu.addStaticOption('Use stealth, you won\'t survive on');
    this.objectiveMenu.addStaticOption('higher difficulties by being Rambo.');

    this.updateLevelsList();
  }

  updateLevelsList() {
    const levelsCount = Math.min(
      LEVELS_COUNT,
      Object.keys(this.game.scores[difficulty.name]).length + 1,
    );

    this.levelsMenu.clear();

    this.levelsMenu.addOption({
      text: 'Back',
      callback: () => this.levelsMenu.backToParent(),
    });

    for (let i = 1; i <= levelsCount; i++) {
      this.levelsMenu.addOption({
        text: () => {
          let bestTime = this.game.scores[difficulty.name][i];
          let text = `level ${i}`;
          if (bestTime) {
            text += ` (best time: ${(bestTime / 1000).toFixed(1)}s)`;
          }
          return text;
        },
        callback: () => this.game.start(i),
      });
    }

    for (let i = levelsCount + 1; i <= LEVELS_COUNT; i++) {
      this.levelsMenu.addStaticOption(`level ${i}`);
    }
  }

}

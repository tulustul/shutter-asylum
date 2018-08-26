import { loadLevel } from "./loader";
import { Renderer } from "./renderer/renderer";
import { Control } from "./control";
import { Camera } from "./camera";
import { Menu } from "./menu";
import { difficulty, setNextDifficulty } from "./difficulty";

import { EntityEngine } from "./systems/ecs";
import { AgentSystem } from "./systems/agent";
import { ColisionSystem } from "./systems/colision";
import { PlayerSystem } from "./systems/player";
import { VelocitySystem } from "./systems/velocity";
import { PropsSystem } from "./systems/props";
import { BarrierSystem } from "./systems/barrier";
import { ProjectileSystem } from "./systems/projectile";
import { AISystem } from "./systems/ai";
import { LightsSystem } from "./systems/lighting";
import { ParticlesSystem } from "./systems/particles";
import { BloodSystem } from "./systems/blood";
import { ActionsSystem } from "./systems/actions";
import { DoorsSystem } from "./systems/doors";
import { FlashlightSystem } from "./systems/flashlight";

const LEVELS_COUNT = 6;

const SCORES_KEY = 'scores';

export class Game {

  paused = true;

  stageCompleted = false;

  gameCompleted = false;

  isPlayerDead = false;

  currentLevel: number;

  isLoading = true;

  levelFinishDuration: number;

  newBestTime = false;

  scores: any;

  menu: Menu;

  engine = new EntityEngine(this);

  camera = new Camera(this.canvas);

  control = new Control(this);

  renderer = new Renderer(this);

  constructor(public canvas: HTMLCanvasElement) {
    this.control.init();

    this.scores = JSON.parse(localStorage.getItem(SCORES_KEY));
    if (!this.scores) {
      this.scores = {easy: {}, normal: {}, hard: {}};
    }

    this.menu = this.makeMainMenu();

    // just let the logic flow
    this.engine.worldWidth = 1;
    this.engine.worldHeight = 1;
    this.start(null);
    this.paused = true;
    this.menu.active = true;
  }

  async start(level: number) {
    this.stageCompleted = false;
    this.gameCompleted = false;
    this.newBestTime = false;
    this.isLoading = true;
    this.engine.clear();

    const playerSystem = new PlayerSystem();

    this.engine.register(new PropsSystem());
    this.engine.register(new BarrierSystem());
    this.engine.register(new AgentSystem());
    this.engine.register(playerSystem);
    this.engine.register(new VelocitySystem());
    this.engine.register(new ProjectileSystem());
    this.engine.register(new ColisionSystem());
    this.engine.register(new AISystem());
    this.engine.register(new LightsSystem());
    this.engine.register(new ParticlesSystem());
    this.engine.register(new BloodSystem());
    this.engine.register(new ActionsSystem());
    this.engine.register(new DoorsSystem());
    this.engine.register(new FlashlightSystem());
    this.engine.init();

    if (level) {
      await loadLevel(this.engine, `level${level}`);
      this.camera.connectWithAgent(playerSystem.player.agent);
    }

    this.renderer.init();
    this.isLoading = false;
    this.paused = false;
    this.menu.active = false;
  }

  makeMainMenu() {
    const menu = new Menu();
    menu.addOption({
      text: () => `Difficulty: ${difficulty.name}`,
      callback: () => {
        setNextDifficulty();
        this.menu = this.makeMainMenu();
        this.menu.active = true;
      }, 
    })

    const levelsCount = Math.min(
      LEVELS_COUNT,
      Object.keys(this.scores[difficulty.name]).length + 1,
    );

    for (let i = 1; i <= levelsCount; i++) {
      menu.addOption({
        text: () => {
          let bestTime = this.scores[difficulty.name][i];
          let text = `level ${i}`;
          if (bestTime) {
            text += ` (best time: ${(bestTime / 1000).toFixed(1)}s)`;
          }
          return text;
        },
        callback: () => {
          this.currentLevel = i;
          this.start(this.currentLevel);
        },
      });
    }
    return menu;
  }

  checkWinConditions() {
    const aiSystem = this.engine.getSystem<AISystem>(AISystem);
    if (!this.stageCompleted && !this.isLoading && aiSystem.entities.length === 0) {
      this.stageCompleted = true;
      this.levelFinishDuration = this.engine.time;
      const previousScore = this.scores[difficulty.name][this.currentLevel];
      if (!previousScore || this.levelFinishDuration < previousScore) {
        this.newBestTime = true;
      }
      this.saveScore();
      if (this.currentLevel === LEVELS_COUNT) {
        this.gameCompleted = true;
      }
    }
  }

  loadNextLevel() {
    if (this.gameCompleted) {
      return;
    }

    this.currentLevel++;
    this.start(this.currentLevel);
  }

  restartLevel() {
    this.start(this.currentLevel);
  }

  saveScore() {
    this.scores[difficulty.name][this.currentLevel] = this.levelFinishDuration;
    localStorage.setItem(SCORES_KEY, JSON.stringify(this.scores));
    this.menu = this.makeMainMenu();
  }

}

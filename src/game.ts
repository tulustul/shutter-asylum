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

export class Game {

  paused = true;

  stageCompleted = false;

  gameCompleted = false;

  isPlayerDead = false;

  currentLevel = 0;

  isLoading = true;

  engine = new EntityEngine(this);
  camera = new Camera(this.canvas);
  menu = this.makeMainMenu();
  control = new Control(this);
  renderer = new Renderer(this);

  constructor(public canvas: HTMLCanvasElement) {
    this.control.init();
    this.start(this.currentLevel);
  }

  async start(level: number) {
    this.stageCompleted = false;
    this.gameCompleted = false;
    this.isLoading = true;
    this.engine.clear();
    this.engine.register(new PropsSystem());
    this.engine.register(new BarrierSystem());
    this.engine.register(new AgentSystem());
    this.engine.register(new PlayerSystem());
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

    await loadLevel(this.engine, `level${level}`);
    this.renderer.init();
    this.isLoading = false;
  }

  makeMainMenu() {
    const menu = new Menu();
    menu.addOption({
      text: () => `Difficulty: ${difficulty.name}`,
      callback: setNextDifficulty, 
    })
    for (let i = 1; i <= LEVELS_COUNT; i++) {
      menu.addOption({
        text: `level ${i}`,
        callback: () => {
          this.currentLevel = i;
          this.start(this.currentLevel);
          this.paused = false;
          menu.active = false;
        },
      });
    }
    return menu;
  }

  checkWinConditions() {
    const aiSystem = this.engine.getSystem<AISystem>(AISystem);
    if (!this.isLoading && aiSystem.entities.length === 0) {
      this.stageCompleted = true;
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

}

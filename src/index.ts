import { loadLevel } from "./loader";
import { Renderer } from "./renderer/renderer";
import { Control } from "./control";
import { Camera } from "./camera";

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
import { Menu } from "./menu";

const LEVELS_COUNT = 5;

let engine: EntityEngine;
let renderer: Renderer;
let control: Control;
let camera: Camera;

let cumulativeTime = 0;
const timeStep = 1000 / 60;

async function init() {
  const canvas = document.getElementsByTagName("canvas")[0];

  engine = new EntityEngine();
  camera = new Camera(canvas);
  const menu = makeMenu();
  control = new Control(engine, canvas, menu);
  renderer = new Renderer(engine, camera, canvas, menu);
  engine.renderer = renderer;
  control.init();

  start('intro');

  requestAnimationFrame(tick);

  window.addEventListener('visibilitychange', () => {
    engine.paused = true;
    menu.active = true;
  });
}

function makeMenu() {
  const menu = new Menu();
  for (let i = 1; i <= LEVELS_COUNT; i++) {
    menu.addOption({
      text: `level ${i}`,
      callback: () => {
        start(`level${i}`);
        engine.paused = false;
        menu.active = false;
      },
    });
  }
  return menu;
}

function tick(timestamp: number) {
  const timeDiff = timestamp - cumulativeTime;
  const steps = Math.floor(timeDiff / timeStep);
  cumulativeTime += steps * timeStep;

  if (!engine.paused) {
    for (let i = 0; i < steps; i++) {
      engine.update(cumulativeTime);
    }
  }

  renderer.render();
  requestAnimationFrame(tick);
}

async function start(level: string) {
  engine.clear();
  engine.register(new PropsSystem());
  engine.register(new BarrierSystem());
  engine.register(new AgentSystem());
  engine.register(new PlayerSystem(control, camera));
  engine.register(new VelocitySystem());
  engine.register(new ProjectileSystem());
  engine.register(new ColisionSystem());
  engine.register(new AISystem());
  engine.register(new LightsSystem());
  engine.register(new ParticlesSystem());
  engine.register(new BloodSystem());
  engine.register(new ActionsSystem());
  engine.register(new DoorsSystem());
  engine.register(new FlashlightSystem());
  engine.init();

  await loadLevel(engine, level);
  renderer.init();
}

init();

import { loadLevel } from "./loader";
import { Renderer } from "./render";
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

let engine: EntityEngine;
let control: Control;
let camera: Camera;
let renderer: Renderer;

let cumulativeTime = 0;
const timeStep = 1000 / 60;

async function init() {
  const canvas = document.getElementsByTagName("canvas")[0];

  engine = new EntityEngine();
  camera = new Camera(canvas);
  renderer = new Renderer(engine, camera, canvas);
  control = new Control(canvas);

  engine.register(new PropsSystem());
  engine.register(new BarrierSystem());
  engine.register(new AgentSystem());
  engine.register(new PlayerSystem(control, camera));
  engine.register(new VelocitySystem());
  engine.register(new ProjectileSystem());
  engine.register(new ColisionSystem());
  engine.register(new AISystem());

  engine.init();

  await loadLevel(engine, "level1");

  requestAnimationFrame(tick);
}

function tick(timestamp: number) {
  const timeDiff = timestamp - cumulativeTime;
  const steps = Math.floor(timeDiff / timeStep);
  cumulativeTime += steps * timeStep;

  for (let i = 0; i < steps; i++) {
    engine.update(cumulativeTime);
  }

  renderer.render();
  requestAnimationFrame(tick);
}

init();

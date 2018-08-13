import { loadLevel } from "./loader.js";
import { Renderer } from "./render.js";
import { Level } from "./level.interface";
import { Control } from "./control.js";
import { Camera } from "./camera.js";

import { EntityEngine } from "./systems/ecs.js";
import { AgentSystem } from "./systems/agent.js";
import { ColisionSystem } from "./systems/colision.js";
import { PlayerSystem } from "./systems/player.js";
import { VelocitySystem } from "./systems/velocity.js";
import { PropsSystem } from "./systems/props.js";
import { BarrierSystem } from "./systems/barrier.js";
import { ProjectileSystem } from "./systems/projectile.js";

let engine: EntityEngine;
let control: Control;
let camera: Camera;
let renderer: Renderer;

let cumulativeTime = 0;
const timeStep = 1000 / 60;

export async function init() {
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

  engine.init();

  await loadLevel(engine, "level1");

  requestAnimationFrame(tick);
}

function tick(timestamp: number) {
  const timeDiff = timestamp - cumulativeTime;
  const steps = Math.floor(timeDiff / timeStep);
  cumulativeTime += steps * timeStep;

  for (let i = 0; i < steps; i++) {
    engine.update();
  }

  renderer.render();
  requestAnimationFrame(tick);
}

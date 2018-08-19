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

let engine: EntityEngine;
let control: Control;
let camera: Camera;
let renderer: Renderer;

let cumulativeTime = 0;
const timeStep = 1000 / 60;

async function init() {
  const canvas = document.getElementsByTagName("canvas")[0];

  camera = new Camera(canvas);
  control = new Control(canvas);

  engine = new EntityEngine();

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

  engine.init();

  await loadLevel(engine, "level1");

  renderer = new Renderer(engine, camera, canvas);

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

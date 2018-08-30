import { AgentComponent } from './agent';
import { EntitySystem, EntityEngine, Entity } from './ecs';
import { Vector2 } from '../vector';
import { PLAYER_MASK } from '../colisions-masks';
import { TILE_SIZE } from '../constants';
import { difficulty } from '../difficulty';

const FLOOR_MAP: {[key: string]: string} = {
  '.': 'stone',
  '-': 'wood',
  ';': 'carpet',
  '+': 'tiles',
};

const VISIBILITY_UPDATE_TIME = 350;

const NOISE_DURATION = 700;

export class PlayerComponent extends Entity {

  agent: AgentComponent;

  // visibility is affected by lighting, ranges 0-255
  visibility: number;

  lastVisibilityUpdateTime = 0;

  lastNoiseTime = 0;

  isNoisy = false;

  constructor(public engine: EntityEngine, pos: Vector2) {
    super();
    this.agent = new AgentComponent(this.engine, pos, {
      maxHealth: 30 * difficulty.playerHealthMultiplier,
      colisionMask: PLAYER_MASK,
    });
    this.agent.parent = this;
    this.agent.maxWalkSpeed = 1;
    engine.getSystem(PlayerSystem).add(this);
  }

  destroy() {
    super.destroy();
    this.agent.destroy();
  }

  makeNoise() {
    this.isNoisy = true;
    this.lastNoiseTime = this.engine.time;
  }

  get isVisible() {
    return this.visibility > difficulty.visibilityLevel || !!this.agent.flashlight;
  }

}

export class PlayerSystem extends EntitySystem<PlayerComponent> {

  STEPS_RATE = 270;

  currentStep = 0;

  lastStepTime = 0;

  weaponIndex = 0;

  player: PlayerComponent;

  constructor() {
    super();
  }

  add(entity: PlayerComponent) {
    super.add(entity)
    this.player = entity;
  }

  remove(entity: PlayerComponent) {
    super.remove(entity);
    this.player = null;
    this.engine.game.isPlayerDead = true;
  }

  update() {
    for (const player of this.entities) {
      if (this.engine.time - player.lastNoiseTime > NOISE_DURATION) {
        player.isNoisy = false;
      }

      player.agent.rot = this.engine.game.control.rot;

      this.updateControls(player);
      this.updateVisibility(player);
      this.makeStep(player);
    }
  }

  updateVisibility(player: PlayerComponent) {
    const lightsLayer = this.engine.game.renderer.compositor.layers.combinedLights;
    const lightsCanvas = lightsLayer.canvas;

    if (this.engine.time - player.lastVisibilityUpdateTime > VISIBILITY_UPDATE_TIME) {
      // getImageData is extremely slow operation, use with caution
      player.visibility = lightsLayer.context.getImageData(
        lightsCanvas.width / 2,
        lightsCanvas.height / 2,
        1, 1,
      ).data[0];
      player.lastVisibilityUpdateTime = this.engine.time;
    }
  }

  updateControls(player: PlayerComponent) {
    const control = this.engine.game.control;
    if (control.keys.get('KeyW')) {
      player.agent.moveToDirection(Math.PI);
    }
    if (control.keys.get("KeyA")) {
      player.agent.moveToDirection(Math.PI * 0.5);
    }
    if (control.keys.get("KeyS")) {
      player.agent.moveToDirection(0);
    }
    if (control.keys.get("KeyD")) {
      player.agent.moveToDirection(Math.PI * 1.5);
    }
    if (control.mouseButtons.get(0) || control.keys.get(" ")) {
      const shootSuccessed = player.agent.shoot();
      if (shootSuccessed) {
        player.makeNoise();
      }
    }
  }

  makeStep(player: PlayerComponent) {
    const agent = player.agent;
    const weight = Math.max(1, agent.weight / 2);
    const stepsRate = this.STEPS_RATE * weight * (agent.isRunning ? 1 : 1.6);
    if (this.engine.time - this.lastStepTime > stepsRate) {
      if (player.agent.posAndVel.vel.getLength() > 0.5) {
        this.lastStepTime = this.engine.time;
        this.currentStep = (this.currentStep + 1) % 2;
        const pos = player.agent.posAndVel.pos;
        const x = Math.floor(pos.x / TILE_SIZE);
        const y = Math.floor(pos.y / TILE_SIZE);
        const cell = this.engine.level[y][x];
        const floor = FLOOR_MAP[cell] || 'stone'
        const walkOrRun = player.agent.isRunning ? 'Run' : 'Walk';
        const sample = `${floor}${walkOrRun}${this.currentStep.toString()}`;
        this.engine.sound.play(sample);

        if (player.agent.isRunning) {
          player.makeNoise();
        }
      }
    }
  }
}

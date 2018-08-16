import { Camera } from './camera';
import { EntityEngine } from './systems/ecs';
import { AgentSystem } from './systems/agent';
import { PropsSystem } from "./systems/props";
import { TILE_SIZE } from './constants';
import { ProjectileSystem } from './systems/projectile';
import { PlayerSystem } from './systems/player';
import { LightsSystem } from './systems/lighting';

interface SpriteMetadata {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayerOptions {
  canvas?: HTMLCanvasElement;
  renderWholeWorld?: boolean;
  followPlayer?: boolean;
  fillBlack?: boolean;
  clear?: boolean;
}

type SpriteMap = {[key: string]: SpriteMetadata};

const SPRITES_MAP: SpriteMap = {
  'floor': {x: 0, y: 0, width: 20, height: 20},
  'wall': {x: 0, y: 20, width: 20, height: 20},
  'agent': {x: 21, y: 0, width: 20, height: 30},
  'corpse': {x: 40, y: 0, width: 40, height: 20},
}

const VERTEX_SHADER = `
attribute vec4 pos;
varying highp vec2 uv;

void main() {
  gl_Position = pos;
  uv = vec2(pos.x / 2.0 + 0.5, -pos.y / 2.0 + 0.5);
}`;

const FRAGMENT_SHADER = `
precision mediump float;
varying highp vec2 uv;
uniform sampler2D u_texture;

const float colors = 16.0;
float limit(float x) {
  return floor(x * 255.0 / colors) / colors;
}

void main(void) {
  vec4 color = texture2D(u_texture, uv);
  float r = limit(color.r);
  float g = limit(color.g);
  if (r != g) {
    g = 0.0;
  }
  gl_FragColor = vec4(r, g, g, 1.0);
}`;

const VERTS = new Float32Array([
  // First triangle
  -1.0,  1.0,
  1.0, 1.0,
  1.0, -1.0,
  // Second triangle
  -1.0,  1.0,
  1.0, -1.0,
  -1.0,  -1.0,
]);

class Layer {

  canvas: HTMLCanvasElement = null;

  options: LayerOptions;

  followPlayer = true;

  fillBlack = true;

  renderWholeWorld = false;

  clear = true;

  context: CanvasRenderingContext2D;

  constructor(private renderer: Renderer, options: LayerOptions = {}) {
    Object.assign(this, options);

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      if (this.renderWholeWorld) {
        this.canvas.width = renderer.engine.worldWidth;
        this.canvas.height = renderer.engine.worldHeight;
      } else {
        this.canvas.width = renderer.canvas.width;
        this.canvas.height = renderer.canvas.height;
      }
    }
    this.context = this.canvas.getContext('2d');
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  activate() {
    if (this.renderer.activeLayer) {
      this.renderer.activeLayer.context.restore();
    }

    this.renderer.activeLayer = this;
    this.renderer.context = this.context;

    if (this.clear) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    if (this.fillBlack) {
      this.context.fillStyle = 'black';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    if (this.followPlayer) {
      this.context.save();
      this.context.translate(this.renderer.camera.pos.x, this.renderer.camera.pos.y);
    }
  }
}

class Postprocessing {

  gl: WebGLRenderingContext;

  constructor(renderer: Renderer) {
    this.gl = renderer.canvas.getContext('webgl');

    this.gl.viewport(0, 0, renderer.canvas.width, renderer.canvas.height);

    const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(fragShader, FRAGMENT_SHADER);
    this.gl.compileShader(fragShader);

    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vertexShader, VERTEX_SHADER);
    this.gl.compileShader(vertexShader);

    const shaderProgram = this.gl.createProgram();
    this.gl.attachShader(shaderProgram, vertexShader);
    this.gl.attachShader(shaderProgram, fragShader);
    this.gl.linkProgram(shaderProgram);
    this.gl.useProgram(shaderProgram);

    // DEBUG
    // const compiled = this.gl.getShaderParameter(fragShader, this.gl.COMPILE_STATUS);
    // console.log('Shader compiled successfully: ' + compiled);
    // const compilationLog = this.gl.getShaderInfoLog(fragShader);
    // console.log('Shader compiler log: ' + compilationLog);

    const vertexPositionAttribute = this.gl.getAttribLocation(shaderProgram, "pos");

    const quad_vertex_buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, quad_vertex_buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, VERTS, this.gl.STATIC_DRAW);

    this.gl.vertexAttribPointer(vertexPositionAttribute, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(vertexPositionAttribute)

    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
  }

  postprocess(layer: Layer) {
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, layer.canvas);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, VERTS.length / 2);
  }
}

export class Renderer {

  context: CanvasRenderingContext2D;

  gl: WebGLRenderingContext;

  baseLayer = new Layer(this, {followPlayer: false});

  lightsLayer = new Layer(this, {
    renderWholeWorld: true,
    followPlayer: false,
  });

  propsLayer = new Layer(this, {
    renderWholeWorld: true,
    followPlayer: false,
    fillBlack: false,
    clear: false,
  });

  movingPropsLayer = new Layer(this, {fillBlack: false});

  particlesLayer = new Layer(this, {fillBlack: false});

  interfaceLayer = new Layer(this, {followPlayer: false, fillBlack: false});

  // DEBUG
  checkColorsLayer: Layer; // = new Layer(this);

  postprocessing: Postprocessing;

  activeLayer: Layer;

  texture: HTMLImageElement;

  gradientCache = new Map<number, CanvasGradient>();

  ready = false;

  constructor(
    public engine: EntityEngine,
    public camera: Camera,
    public canvas: HTMLCanvasElement,
  ) {
    this.postprocessing = new Postprocessing(this);

    this.texture = new Image();
    this.texture.src = 'tex.png';
    this.texture.onload = () => this.ready = true;
  }

  renderProps() {
    const propsSystem = this.engine.getSystem<PropsSystem>(PropsSystem);

    for (const prop of propsSystem.toRender) {
      const sprite = SPRITES_MAP[prop.sprite];
      if (prop.rot) {
        this.context.save();
        this.context.translate(prop.pos.x, prop.pos.y);
        this.context.rotate(prop.rot);
      }
      this.context.drawImage(
        this.texture,
        sprite.x, sprite.y,
        sprite.width, sprite.height,
        prop.rot ? 0 : prop.pos.x, prop.rot ? 0: prop.pos.y,
        sprite.width, sprite.height,
      );
      if (prop.rot) {
        this.context.restore();
      }
    }
    propsSystem.markAsRendered();
  }

  renderAgents() {
    const sprite = SPRITES_MAP.agent;
    for (const agent of this.engine.getSystem<AgentSystem>(AgentSystem).entities) {
      this.context.save();
      this.context.translate(
        agent.posAndVel.pos.x,
        agent.posAndVel.pos.y,
      );
      this.context.save();

      this.context.rotate(agent.rot);
      this.context.drawImage(
        this.texture,
        sprite.x, sprite.y,
        sprite.width, sprite.height,
        -TILE_SIZE / 2, -TILE_SIZE / 2,
        sprite.width, sprite.height,
      )
      this.context.restore();

      this.context.fillStyle = 'red';
      const healthBar = (TILE_SIZE / agent.maxHealth) * agent.health;
      this.context.fillRect(-TILE_SIZE / 2, TILE_SIZE / 2 + 5, healthBar, 1);

      this.context.restore();
    }
  }

  renderProjectiles() {
    this.context.fillStyle = 'orange';
    for (const projectile of this.engine.getSystem<ProjectileSystem>(ProjectileSystem).entities) {
      const pos = projectile.posAndVel.pos;
      this.context.fillRect(pos.x, pos.y, 2, 2);
    }
  }

  renderInterface() {
    const player = this.engine.getSystem<PlayerSystem>(PlayerSystem).entities[0];

    this.context.fillStyle = 'red';
    this.context.font = '12px sans-serif';
    if (player) {
      const weapon = player.agent.weapon;

      if (weapon.reloading) {
        this.context.fillText('REL', 170, 230);
      }

      const text = `
  ${weapon.options.name}
  ${weapon.bulletsInMagazine} / ${weapon.options.magazineCapacity}
  (${weapon.totalBullets})
  `;
      this.context.fillText(text, 0, 380);
    } else {
      this.context.font = '20px sans-serif';
      const gameoverText = 'GAME OVER';
      const textWidth = this.context.measureText(gameoverText).width;
      this.context.fillText(
        gameoverText, this.canvas.width / 2 - textWidth / 2, 200,
      );
    }
  }

  renderLights() {
    const lightsSystem = this.engine.getSystem<LightsSystem>(LightsSystem);

    if (!lightsSystem.needRerender) {
      return;
    }
    lightsSystem.needRerender = false;

    this.lightsLayer.activate();
    this.context.globalCompositeOperation = 'lighten';

    for (const light of lightsSystem.entities) {
      if (light.options.enabled) {
        const lightSize = light.options.size;
        const gradient = this.gradientCache.get(light.options.size)

        if (!gradient) {
          const gradient = this.context.createRadialGradient(
            lightSize / 2, lightSize / 2, lightSize / 10,
            lightSize / 2, lightSize / 2, lightSize / 2,
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 100');
          gradient.addColorStop(1, 'transparent');
          this.gradientCache.set(lightSize, gradient);
        }

        this.context.fillStyle = gradient;

        this.context.save()
        this.context.translate(
          light.pos.x - lightSize / 2, light.pos.y - lightSize / 2,
        )
        this.context.fillRect(0, 0, lightSize, lightSize);
        this.context.restore();
      }
    }
    this.context.globalCompositeOperation = 'source-over';
  }

  render() {
    if (!this.ready) {
      return;
    }

    this.renderLights();

    this.propsLayer.activate();
    this.renderProps();

    this.movingPropsLayer.activate();
    this.renderAgents();

    this.particlesLayer.activate();
    this.renderProjectiles();

    this.interfaceLayer.activate();
    this.renderInterface();

    this.baseLayer.activate();
    this.composite();

    this.postprocessing.postprocess(this.baseLayer);

    // DEBUG
    // if (Math.round(this.engine.time) % 300 === 0) {
    //   this.checkDistinctColors();
    // }
  }

  composite() {
    this.context.globalCompositeOperation = 'source-over'
    this.drawLayer(this.propsLayer);

    this.context.drawImage(this.movingPropsLayer.canvas, 0, 0);

    this.context.globalCompositeOperation = 'overlay';
    this.drawLayer(this.lightsLayer);

    this.context.globalCompositeOperation = 'source-over'
    this.context.drawImage(this.particlesLayer.canvas, 0, 0);
    this.context.drawImage(this.interfaceLayer.canvas, 0, 0);
  }

  drawLayer(layer: Layer) {
    this.context.drawImage(layer.canvas,
      -this.camera.pos.x, -this.camera.pos.y,
      this.canvas.width, this.canvas.height,
      0, 0,
      this.canvas.width, this.canvas.height,
    );
  }

  checkDistinctColors() {
    this.checkColorsLayer.context.drawImage(
      this.canvas, 0, 0, this.canvas.width, this.canvas.height,
    );
    const data = this.checkColorsLayer.context.getImageData(
      0, 0, this.canvas.width, this.canvas.height,
    ).data;
    const colors = new Set<string>();
    for (let i = 0; i < data.length; i += 4) {
      const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
      colors.add(color);
    }
    const text = `Number of colors: ${colors.size}`;
    colors.size > 32 ? console.error(text) : console.log(text);
  }
}

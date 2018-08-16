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
  followPlayer?: boolean;
  fillBlack?: boolean;
  webgl?: boolean;
}

type SpriteMap = {[key: string]: SpriteMetadata};

const SPRITES_MAP: SpriteMap = {
  'floor': {x: 0, y: 0, width: 20, height: 20},
  'wall': {x: 0, y: 20, width: 20, height: 20},
  'agent': {x: 20, y: 0, width: 20, height: 30},
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
  gl_FragColor = vec4(limit(color.r), limit(color.g), limit(color.b), 1.0);
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

  webgl = false;

  context: CanvasRenderingContext2D;

  gl: WebGLRenderingContext;

  constructor(private renderer: Renderer, options: LayerOptions = {}) {
    Object.assign(this, options);

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = renderer.canvas.width;
      this.canvas.height = renderer.canvas.height;
    }
    if (this.webgl) {
      this.gl = this.canvas.getContext('webgl');
    } else {
      this.context = this.canvas.getContext('2d');
    }
    this.context.imageSmoothingEnabled = false;
  }

  activate() {
    if (this.renderer.activeLayer) {
      this.renderer.activeLayer.context.restore();
    }

    this.renderer.activeLayer = this;
    this.renderer.context = this.context;

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

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

    const  compiled = this.gl.getShaderParameter(fragShader, this.gl.COMPILE_STATUS);
    console.log('Shader compiled successfully: ' + compiled);
    const  compilationLog = this.gl.getShaderInfoLog(fragShader);
    console.log('Shader compiler log: ' + compilationLog);

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

  lightsLayer = new Layer(this);

  propsLayer = new Layer(this);

  particlesLayer = new Layer(this, {fillBlack: false});

  interfaceLayer = new Layer(this, {followPlayer: false, fillBlack: false});

  postprocessing: Postprocessing;

  activeLayer: Layer;

  texture: HTMLImageElement;

  gradientCache = new Map<number, CanvasGradient>();

  constructor(
    private engine: EntityEngine,
    public camera: Camera,
    public canvas: HTMLCanvasElement,
  ) {
    this.postprocessing = new Postprocessing(this);

    this.texture = new Image();
    this.texture.src = 'tex.png';
  }

  renderProps() {
    const propsSystem = this.engine.getSystem<PropsSystem>(PropsSystem);
    for (const prop of propsSystem.entities) {
      const sprite = SPRITES_MAP[prop.sprite];
      this.context.drawImage(
        this.texture,
        sprite.x, sprite.y,
        sprite.width, sprite.height,
        prop.pos.x, prop.pos.y,
        sprite.width, sprite.height,
      );
    }
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
      const healthBar = agent.health * 4;
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
    if (player) {
      const weapon = player.agent.weapon;

      if (weapon.reloading) {
        this.context.fillText('REL', 170, 230);
      }

      const text = `
  ${weapon.options.name}
  ${weapon.bulletsInMagazine} / ${weapon.options.magazineCapacity}
  (${weapon.totalBullets})
  health: ${player.agent.health / 5 * 100}%
  `;
      this.context.fillText(text, 0, 380);
    } else {
      this.context.fillText('GAME OVER', 200, 200);
    }
  }

  renderLights() {
    const lightsSystem = this.engine.getSystem<LightsSystem>(LightsSystem);

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
  }

  render() {
    this.lightsLayer.activate();
    this.renderLights();

    this.propsLayer.activate();
    this.renderProps();
    this.renderAgents();

    this.particlesLayer.activate();
    this.renderProjectiles();

    this.interfaceLayer.activate();
    this.renderInterface();

    this.baseLayer.activate();
    this.composite();

    this.postprocessing.postprocess(this.baseLayer);
  }

  composite() {
    this.context.globalCompositeOperation = 'source-over'
    this.context.drawImage(this.propsLayer.canvas, 0, 0);

    this.context.globalCompositeOperation = 'overlay';
    this.context.drawImage(this.lightsLayer.canvas, 0, 0);

    this.context.globalCompositeOperation = 'source-over'
    this.context.drawImage(this.particlesLayer.canvas, 0, 0);

    this.context.globalCompositeOperation = 'source-over'
    this.context.drawImage(this.interfaceLayer.canvas, 0, 0);
  }
}

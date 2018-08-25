import { Layer } from './layer';

// The only thing postprocessing is doing is limiting color palette to 32
// colors.

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
  vec4 c = texture2D(u_texture, uv);
  float r = limit(c.r);
  float g = limit(c.g);
  if (r != g) {
    g = 0.0;
  }
  gl_FragColor = vec4(r, g, g, 1.0);
}`;

const VERTS = new Float32Array([
  -1.0,  1.0,
  1.0, 1.0,
  1.0, -1.0,

  -1.0,  1.0,
  1.0, -1.0,
  -1.0,  -1.0,
]);

export
class Postprocessing {

  gl: WebGLRenderingContext;

  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl');

    this.gl.viewport(0, 0, canvas.width, canvas.height);

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

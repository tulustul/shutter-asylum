import { Vector2 } from "./vector";

export class Control {

  keys = new Map<string, boolean>();

  mouseButtons = new Map<number, boolean>();

  mousePos = new Vector2();

  rot = 0;

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', event => this.keys.set(event.key, true));

    window.addEventListener('keyup', event => this.keys.set(event.key, false));

    window.addEventListener('mousemove', event => {
      this.mousePos.x = Math.round(canvas.width * event.clientX / window.innerWidth);
      this.mousePos.y = Math.round(canvas.height * event.clientY / window.innerHeight);

      this.rot = Math.atan2(
        canvas.height / 2 - this.mousePos.y,
        canvas.width / 2 - this.mousePos.x,
      ) + Math.PI / 2;
    });

    window.addEventListener('mousedown', event => {
      this.mouseButtons.set(event.button, true);
    });

    window.addEventListener('mouseup', event => {
      this.mouseButtons.set(event.button, false);
    });
  }
}

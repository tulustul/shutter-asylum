export class Vector2 {

  constructor(public x = 0, public y = 0) {}

  copy() {
    return new Vector2(this.x, this.y);
  }

  zero() {
    this.x = 0;
    this.y = 0;
  }

  rotate(angle: number) {
    const nx = this.x * Math.cos(angle) - this.y * Math.sin(angle);
    const ny = this.x * Math.sin(angle) + this.y * Math.cos(angle);

    this.x = nx;
    this.y = ny;

    return this;
  }

  add(vec: Vector2) {
    this.x += vec.x;
    this.y += vec.y;
    return this;
  }

  quantify() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
  }

  normalize() {
    const length = Math.sqrt(this.x * this.x + this.y * this.y);
    this.x /= length;
    this.y /= length;
    return this;
  }

  mul(scalar: number) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  getLength() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}

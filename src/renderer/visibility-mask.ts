import { ColisionSystem } from "../systems/colision";

import { Vector2 } from "../vector";

export function renderVisibilityMask(
  context: CanvasRenderingContext2D,
  colisionSystem: ColisionSystem,
  pov: Vector2,
  direction: number,
  angle: number,
  maxDistance: number,
) {
  const points: Vector2[] = [];

  for (let a = -angle / 2; a < angle / 2; a += Math.PI / 50) {
    const targetPos = new Vector2(0, maxDistance).rotate(direction + a).add(pov);
    points.push(colisionSystem.castRay(pov, targetPos) || targetPos);
  }

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    context.lineTo(p.x, p.y);
  }
  if (angle !== Math.PI * 2) {
    context.lineTo(pov.x, pov.y);
    context.lineTo(points[0].x, points[0].y);
  }
  context.closePath();
  context.fill();
}

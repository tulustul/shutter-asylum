import { Cell } from './level.interface';
import { Vector2 } from './vector';
import { TILE_SIZE } from './constants';
import { EntityEngine } from "./systems/ecs";
import { PlayerComponent } from "./systems/player";
import { PropComponent } from "./systems/props";
import { BarrierComponent } from './systems/barrier';
import { AIComponent } from './systems/ai';
import { LightComponent } from './systems/lighting';

export async function loadLevel(engine: EntityEngine, levelName: string): Promise<void> {
  const response = await fetch(`../levels/${levelName}.txt`, {});
  const data = await response.text();
  const cells = data.split('\n').map(line => Array.from(line)) as Cell[][];

  for (let y = 0; y < cells.length; y++) {
    const line = cells[y];
    for (let x = 0; x < line.length; x++) {
      const pos = new Vector2(x * TILE_SIZE, y * TILE_SIZE);
      if (line[x] === "S") {
        new PlayerComponent(engine, Object.create(pos));
        new PropComponent(engine, pos, "floor");
      } else if (line[x] === "E") {
        new AIComponent(engine, Object.create(pos));
        new PropComponent(engine, pos, "floor");
      } else if (line[x] === ".") {
        new PropComponent(engine, pos, "floor");
      } else if (line[x] === "X") {
        new BarrierComponent(engine, pos, "wall");
      } else if (line[x] === "B") {
        new LightComponent(engine, pos, {broken: true, enabled: true});
        new PropComponent(engine, pos, "floor");
      } else if (line[x] === "L") {
        new LightComponent(engine, pos, {broken: false, enabled: true});
        new PropComponent(engine, pos, "floor");
      }
    }
  }
}

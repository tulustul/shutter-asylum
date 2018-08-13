import { Cell } from './level.interface';
import { Vector2 } from './vector.js';
import { TILE_SIZE } from './constants.js';
import { EntityEngine } from "./systems/ecs.js";
import { PlayerComponent } from "./systems/player.js";
import { PropComponent } from "./systems/props.js";
import { BarrierComponent } from './systems/barrier.js';
import { AgentComponent } from './systems/agent.js';

export async function loadLevel(engine: EntityEngine, levelName: string): Promise<void> {
  const response = await fetch(`../levels/${levelName}.txt`, {});
  const data = await response.text();
  const cells = data.split('\n').map(line => Array.from(line)) as Cell[][];

  for (let y = 0; y < cells.length; y++) {
    const line = cells[y];
    for (let x = 0; x < line.length; x++) {
      const pos = new Vector2(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
      if (line[x] === "S") {
        new PlayerComponent(engine, Object.create(pos));
        new PropComponent(engine, pos, "grey");
      } else if (line[x] === "E") {
        new AgentComponent(engine, Object.create(pos));
        new PropComponent(engine, pos, "grey");
      } else if (line[x] === ".") {
        new PropComponent(engine, pos, "grey");
      } else if (line[x] === "X") {
        new BarrierComponent(engine, pos, "yellow");
      }
    }
  }
}

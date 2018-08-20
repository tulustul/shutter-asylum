import { Cell } from './level.interface';
import { Vector2 } from './vector';
import { TILE_SIZE } from './constants';
import { EntityEngine } from "./systems/ecs";
import { PlayerComponent } from "./systems/player";
import { PropComponent } from "./systems/props";
import { BarrierComponent } from './systems/barrier';
import { AIComponent } from './systems/ai';
import { LightComponent } from './systems/lighting';
import { DoorComponent, DoorOrientation } from './systems/doors';

export async function loadLevel(engine: EntityEngine, levelName: string): Promise<void> {
  const data = await fetchLevel(levelName);
  const [header, cellsData] = data.split('#');
  const cells = cellsData.split('\n').map(line => Array.from(line)) as Cell[][];

  const multiCellsMap = new Map<string, Cell[]>();
  for (const line of header.split('\n')) {
    multiCellsMap.set(line[0], Array.from(line.slice(1)) as Cell[]);
  }

  let maxWidth = 0;
  for (let y = 0; y < cells.length; y++) {
    const line = cells[y];
    for (let x = 0; x < line.length; x++) {
      maxWidth = Math.max(maxWidth, line.length);
      const cell = line[x];
      if (multiCellsMap.has(cell)) {
        const multiCells = multiCellsMap.get(cell);
        for (const multiCell of multiCells) {
          putCell(engine, x, y, multiCell);
        }
        line[x] = multiCells[multiCells.length - 1];
      } else {
        putCell(engine, x, y, cell);
      }
    }
  }
  engine.worldHeight = cells.length * TILE_SIZE;
  engine.worldWidth = maxWidth * TILE_SIZE;
  engine.level = cells;
}

async function fetchLevel(levelName: string) {
  const response = await fetch(`../levels/${levelName}.txt`, {});
  if ((window as any).LZMA) {
    const data = await response.arrayBuffer()
    const binaryData = new Uint8Array(data);

    return new Promise<string>((resolve, reject) => {
      (window as any).LZMA.decompress(
        binaryData, (result: any) => resolve(result),
      );
    });
  } else {
    return await response.text();
  }
}

function putCell(engine: EntityEngine, x: number, y: number, cell: Cell) {
  const pos = new Vector2(x * TILE_SIZE, y * TILE_SIZE);
  if (cell === "S") {
    new PlayerComponent(engine, Object.create(pos));
  } else if (cell === "E") {
    new AIComponent(engine, Object.create(pos));
  } else if (cell === ".") {
    new PropComponent(engine, {pos, sprite: "floor"});
  } else if (cell === "-") {
    new PropComponent(engine, {pos, sprite: "wood"});
  } else if (cell === "X") {
    new BarrierComponent(engine, pos);
  } else if (cell === "B") {
    new LightComponent(engine, pos, {broken: true, enabled: true, size: 300});
  } else if (cell === "L") {
    new LightComponent(engine, pos, {broken: false, enabled: true, size: 300});
  } else if (cell === "_") {
    new DoorComponent(engine, {pos, orientation: DoorOrientation.horizontal});
  } else if (cell === "|") {
    new DoorComponent(engine, {pos, orientation: DoorOrientation.vertical});
  }
}

import { Vector2 } from './vector';
import { TILE_SIZE } from './constants';
import { EntityEngine } from "./systems/ecs";
import { PlayerComponent } from "./systems/player";
import { PropComponent } from "./systems/props";
import { BarrierComponent } from './systems/barrier';
import { AIComponent, AISystem } from './systems/ai';
import { LightComponent } from './systems/lighting';
import { DoorComponent, DoorOrientation } from './systems/doors';

const FLOOR_TYPES = '.+-;';

const FLOOR_MAP: {[key: string]: string} = {
  '.': 'stone',
  '-': 'wood',
  '+': 'tiles',
  ';': 'carpet',
};

export async function loadLevel(engine: EntityEngine, levelName: string): Promise<void> {
  const data = await fetchLevel(levelName);
  const [header, cellsData] = data.split('#');
  const cells = cellsData.split('\n').map(line => Array.from(line)) as string[][];

  const multiCellsMap = new Map<string, string[]>();
  for (const line of header.split('\n')) {
    multiCellsMap.set(line[0], Array.from(line.slice(1)) as string[]);
  }

  let maxWidth = 0;
  for (let y = 0; y < cells.length; y++) {
    const line = cells[y];
    for (let x = 0; x < line.length; x++) {
      maxWidth = Math.max(maxWidth, line.length);
      const cell = line[x];
      if (cell === ' ') {
        continue;
      }
      if (multiCellsMap.has(cell)) {
        const multiCells = multiCellsMap.get(cell);
        for (const multiCell of multiCells) {
          makeCell(engine, cells, x, y, multiCell);
        }
        line[x] = multiCells[multiCells.length - 1];
      } else {
        makeCell(engine, cells, x, y, cell);
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

function makeCell(
  engine: EntityEngine,
  cells: string[][],
  x: number,
  y: number,
  cell: string,
) {
  const aiSystem = engine.getSystem<AISystem>(AISystem);
  const pos = new Vector2(x * TILE_SIZE, y * TILE_SIZE);

  if (cell === "X") {
    new BarrierComponent(engine, pos);
  } else if (FLOOR_TYPES.includes(cell)) {
    new PropComponent(engine, {pos, sprite: FLOOR_MAP[cell]});
  } else {
    const floorType = guessCellFloor(cells, x, y);
    if (floorType) {
      new PropComponent(engine, {pos: pos.copy(), sprite: FLOOR_MAP[floorType]});
    }
  }

  if (cell === "S") {
    new PlayerComponent(engine, Object.create(pos));
  } else if (cell === "E") {
    new AIComponent(engine, {pos: Object.create(pos)});
  } else if (cell === "P") {
    new AIComponent(engine, {pos: Object.create(pos), canPatrol: true});
  } else if (cell === "B") {
    const wallDirection = getWallDirection(cells, x, y);
    new LightComponent(engine, {
      pos,
      broken: true,
      physical: true,
      wallDirection: wallDirection as any,
      });
  } else if (cell === "L") {
    const wallDirection = getWallDirection(cells, x, y);
    new LightComponent(engine, {
      pos,
      physical: true,
      wallDirection: wallDirection as any,
    });
  } else if (cell === "l") {
    new LightComponent(engine, {pos});
  } else if (cell === "_") {
    new DoorComponent(engine, {pos, orientation: DoorOrientation.horizontal});
  } else if (cell === "|") {
    new DoorComponent(engine, {pos, orientation: DoorOrientation.vertical});
  } else if (cell === "p") {
    aiSystem.addPatrolPoint(pos);
  }
}

function guessCellFloor(cells: string[][], x: number, y: number) {
  for (let xDiff = -1; xDiff <= 1; xDiff++) {
    for (let yDiff = -1; yDiff <= 1; yDiff++) {
      const cell = cells[y + yDiff][x + xDiff];
      if (FLOOR_TYPES.includes(cell)) {
        return cell;
      }
    }
  }
}

function getWallDirection(cells: string[][], x: number, y: number) {
  if (cells[y][Math.max(x - 1, 0)] === 'X') {
    return 'left';
  } else if (cells[Math.max(y - 1, 0)][x] === 'X') {
    return 'up';
  } else if (cells[y][x + 1] === 'X') {
    return 'right';
  } else {
    return 'down';
  }
}

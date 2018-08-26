import { Vector2 } from './vector';
import { TILE_SIZE } from './constants';
import { SPRITES_MAP } from './sprites';

import { EntityEngine } from "./systems/ecs";
import { PlayerComponent } from "./systems/player";
import { PropComponent } from "./systems/props";
import { BarrierComponent } from './systems/barrier';
import { AIComponent, AISystem } from './systems/ai';
import { LightComponent } from './systems/lighting';
import { DoorComponent, DoorOrientation } from './systems/doors';
import { OBSTACLE_MASK } from './colisions-masks';

const FLOOR_TYPES = '.+-;[';

const FLOOR_MAP: {[key: string]: string} = {
  'X': 'wall',
  '.': 'stone',
  '-': 'wood',
  '+': 'tiles',
  ';': 'carpet',
  '[': 'table',
};

const OBSTACLES_TYPES = '[c';

const OBSTACLES_MAP: {[key: string]: string} = {
  '[': 'table',
  'c': 'chair',
};

const PROPS_WITH_BORDERS = ';[';

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
      if (PROPS_WITH_BORDERS.includes(cell)) {
        addCellBorders(engine, cells, x, y);
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
    new BarrierComponent(engine, {pos});
  } else if (OBSTACLES_TYPES.includes(cell)) {
    const barrier = new BarrierComponent(engine, {
      pos,
      colisionMask: OBSTACLE_MASK,
      sprite: OBSTACLES_MAP[cell],
      zIndex: 1,
    });
    // if (cell === 'c') {
    //   barrier.prop.rot = Math.PI * 2 * Math.random();
    //   barrier.prop.pivot = new Vector2(9, 8);
    // }
  } else if (FLOOR_TYPES.includes(cell)) {
    new PropComponent(engine, {pos, sprite: FLOOR_MAP[cell]});
  }

  if (cell !== 'X' && !FLOOR_TYPES.includes(cell)) {
    const floorType = guessCellFloor(cells, x, y);
    if (floorType) {
      new PropComponent(engine, {pos: pos.copy(), sprite: FLOOR_MAP[floorType]});
    }
  }

  if (cell === "S") {
    new PlayerComponent(engine, Object.create(pos));
  } else if (cell === "E") {
    new AIComponent(engine, {
      pos: Object.create(pos),
      weapon: 'mg',
    });
  } else if (cell === "e") {
    new AIComponent(engine, {
      pos: Object.create(pos),
      weapon: 'pistol',
    });
  } else if (cell === "M") {
    new AIComponent(engine, {
      pos: Object.create(pos),
      weapon: 'minigun',
      maxHealth: 100,
    });
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
  } else if (cell === "H") {
    const wallDirection = getWallDirection(cells, x, y);
    new LightComponent(engine, {
      pos,
      physical: false,
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

function *getNeighbours(
  cells: string[][], x: number, y: number
): Iterable<[number, number, string]> {
  let [nx, ny] = [Math.max(x - 1, 0), y];
  yield [nx, ny, cells[ny][nx]];

  [nx, ny] = [x + 1, y];
  yield [nx, ny, cells[ny][nx]];

  [nx, ny] = [x, Math.max(y - 1, 0)];
  yield [nx, ny, cells[ny][nx]];

  [nx, ny] = [x, y + 1];
  yield [nx, ny, cells[ny][nx]];
}

function guessCellFloor(cells: string[][], x: number, y: number) {
  const counts = new Map<string, number>();
  for (const [nx, ny, cell] of getNeighbours(cells, x, y)) {
    if (FLOOR_TYPES.includes(cell)) {
      const newCount = (counts.get(cell) || 0) + 1;
      counts.set(cell, newCount);
    }
  }
  let biggest: string;
  let biggestCount = 0;
  for (const [cell, count] of counts.entries()) {
    if (count > biggestCount) {
      biggestCount = count;
      biggest = cell;
    }
  }
  return biggest;
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

function addCellBorders(
  engine: EntityEngine, cells: string[][], x: number, y: number,
) {
  const pos = new Vector2(x * TILE_SIZE, y * TILE_SIZE);
  const thisCell = cells[y][x];
  const spriteName = FLOOR_MAP[thisCell] + 'Border';
  const sprite = SPRITES_MAP[spriteName];

  for (const [nx, ny, cell] of getNeighbours(cells, x, y)) {
    if (cell !== thisCell && cell !== 'X') {
      const borderPos = new Vector2(nx * TILE_SIZE, ny * TILE_SIZE);
      const rot = borderPos.directionTo(pos);

      if (nx < x) {
        borderPos.x += TILE_SIZE - sprite.h;
        borderPos.y += TILE_SIZE;
      } else if (nx > x) {
        borderPos.x += sprite.h;
      } else if (ny > y) {
        borderPos.x += TILE_SIZE;
        borderPos.y += sprite.h;
      } else if (ny < y) {
        borderPos.y += TILE_SIZE - sprite.h;
      }
      new PropComponent(engine, {
        pos: borderPos,
        rot,
        zIndex: 1,
        sprite: spriteName,
      });
    }
  }
}

import { EntitySystem } from './ecs';
import { Vector2 } from '../vector';
import { TILE_SIZE } from '../constants';

export enum Shape {
  gridCell,
  point,
  circle,
}

export interface Collidable {
  pos: Vector2;
  shape: Shape;
  radius: number;
  canHit: boolean;
  canReceive: boolean;
  shouldDecouple: boolean;
  parent: any;
}

export interface Colision<H, R> {
  hitterCol: Collidable;
  receiverCol: Collidable;
  hitter: H;
  receiver: R;
  penetration: number;
  vec: Vector2;
}

type ColisionGrid = Map<number, Collidable[]>;

type ColisionCallback<H, R> = (colision: Colision<H, R>) => void;

export class ColisionSystem extends EntitySystem<Collidable> {

  staticGrid: ColisionGrid = new Map();

  dynamicGrid: ColisionGrid = new Map();

  dynamicReceivers: Collidable[] = [];

  listeners = new Map<Function, ColisionCallback<any, any>[]>();

  makeCollidable(collidable: Collidable) {
    if (collidable.canReceive && collidable.canHit) {
      this.dynamicReceivers.push(collidable);
    } else if (collidable.canReceive && collidable.canHit) {
      this.putToGrid(this.dynamicGrid, collidable);
    } else if (collidable.canReceive) {
      this.putToGrid(this.staticGrid, collidable);
    }

    if (collidable.canHit) {
      this.entities.push(collidable);
    }

    return collidable;
  }

  remove(entity: Collidable) {
    super.remove(entity);
    if (entity.canReceive && entity.canHit) {
      const index = this.dynamicReceivers.indexOf(entity);
      if (index !== -1) {
        this.dynamicReceivers.splice(index, 1);
      }
    }
  }

  clear() {
    super.clear();
    this.staticGrid.clear();
    this.dynamicGrid.clear();
    this.dynamicReceivers = [];
  }

  update() {
    this.dynamicGrid.clear();
    for (const entity of this.dynamicReceivers) {
      this.putToGrid(this.dynamicGrid, entity);
    }

    const pairsToCheck = this.broadPhase();
    this.narrowPhase(pairsToCheck);
  }

  private broadPhase() {
    const pairsToCheck: Collidable[][] = [];

    for (const hitter of this.entities) {
      for (const cell of this.getCellsOf(hitter)) {

        if (this.staticGrid.has(cell)) {
          for (const receiver of this.staticGrid.get(cell)) {
            // staticGrid is Shape.gridCell only. No need for narrow phase
            this.onColision(hitter, receiver);
          }
        }

        if (this.dynamicGrid.has(cell)) {
          for (const receiver of this.dynamicGrid.get(cell)) {
            if (receiver !== hitter) {
              pairsToCheck.push([hitter, receiver]);
            }
          }
        }
      }
    }
    return pairsToCheck;
  }

  private narrowPhase(pairsToCheck: Collidable[][]) {
    for (const [hitter, receiver] of pairsToCheck) {
      this.checkColisions(hitter, receiver);
    }
  }

  private checkColisions(hitter: Collidable, receiver: Collidable) {
    // Receiver must be circle for now (agent)
    // Hitter must be point for now (projectile)
    const distance = hitter.pos.distanceTo(receiver.pos);
    if (distance < receiver.radius) {
      this.onColision(hitter, receiver);
    }
  }

  private onColision(hitter: Collidable, receiver: Collidable) {
    if (hitter.shouldDecouple) {
      this.decouple(hitter);
    }
    this.emitColision(hitter, receiver, null, 0);
  }

  private decouple(hitter: Collidable) {
    const pos = hitter.parent.posAndVel.floatPos;
    const vel: Vector2 = hitter.parent.posAndVel.vel;
    const originalPos = pos.copy();

    this.snapToGrid(pos, hitter);

    const cell = this.getIndexOfCell(
      Math.floor(pos.x / TILE_SIZE),
      Math.floor(pos.y / TILE_SIZE),
    );

    const xDir = vel.x > 0 ? 1 : -1;
    const x = originalPos.x + vel.x + hitter.radius * xDir;
    const cellX = this.getIndexOfPos(new Vector2(x, pos.y));
    if (this.staticGrid.has(cellX)) {
      vel.x = 0;
    } else {
      pos.x = originalPos.x;
    }


    const yDir = vel.y > 0 ? 1 : -1;
    const y = originalPos.y + vel.y + hitter.radius * yDir;
    const cellY = this.getIndexOfPos(new Vector2(pos.x, y));
    if (this.staticGrid.has(cellY)) {
      vel.y = 0;
    } else {
      pos.y = originalPos.y;
    }

    hitter.parent.posAndVel.pos.x = Math.round(hitter.parent.posAndVel.floatPos.x);
    hitter.parent.posAndVel.pos.y = Math.round(hitter.parent.posAndVel.floatPos.y);
  }

  private snapToGrid(pos: Vector2, hitter: Collidable) {
    pos.x = Math.floor(pos.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    pos.y = Math.floor(pos.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
  }

  listenColisions<H, R>(
    hitterClass: Function,
    callback: ColisionCallback<H, R>,
  ) {
    if (!this.listeners.has(hitterClass)) {
      this.listeners.set(hitterClass, []);
    }
    this.listeners.get(hitterClass).push(callback);
  }

  private putToGrid(grid: ColisionGrid, entity: Collidable) {
    if (entity.shape === Shape.circle) {
      for (const cell of this.getCellsOf(entity)) {
        this.addToGrid(grid, cell, entity);
      }
    } else {
      const cell = this.getIndexOfCell(
        Math.floor(entity.pos.x / TILE_SIZE),
        Math.floor(entity.pos.y / TILE_SIZE),
      );
      this.addToGrid(grid, cell, entity);
    }
  }

  private addToGrid(grid: ColisionGrid, cell: number, entity: Collidable) {
    if (!grid.has(cell)) {
      grid.set(cell, [entity]);
    } else {
      grid.get(cell).push(entity);
    }
  }

  private *getCellsOf(entity: Collidable) {
    if (entity.shape === Shape.point) {
      yield this.getIndexOfCell(
        Math.floor(entity.pos.x / TILE_SIZE),
        Math.floor(entity.pos.y / TILE_SIZE),
      );
      return;
    } else {
      const minX = Math.floor((entity.pos.x - entity.radius) / TILE_SIZE);
      const maxX = Math.floor((entity.pos.x + entity.radius - 1) / TILE_SIZE);

      const minY = Math.floor((entity.pos.y - entity.radius) / TILE_SIZE);
      const maxY = Math.floor((entity.pos.y + entity.radius - 1) / TILE_SIZE);

      // console.log(`${entity.pos.x}x${entity.pos.y} ${minX}-${maxX} ${minY}-${maxY}`)

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          yield this.getIndexOfCell(x, y);
        }
      }
    }
  }

  private getIndexOfCell(x: number, y: number) {
    return x * 1000 + y;
  }

  private getIndexOfPos(pos: Vector2) {
    return this.getIndexOfCell(
      Math.floor(pos.x / TILE_SIZE),
      Math.floor(pos.y / TILE_SIZE),
    );
  }

  private emitColision(hitter: Collidable, receiver: Collidable, vec: Vector2, penetration: number) {
    for (const parent of hitter.parent.getAncestors()) {
      const key = parent.constructor;
      if (this.listeners.has(key)) {
        const colision: Colision<any, any> = {
          hitterCol: hitter,
          receiverCol: receiver,
          hitter: hitter.parent,
          receiver: receiver.parent,
          penetration,
          vec,
        }
        for (const callback of this.listeners.get(key)) {
          callback(colision);
        }
      }
    }
  }

  castRay(
    from: Vector2,
    to: Vector2,
    ignore: Collidable = null,
    checkDynamicGrid = true,
  ) {
    const length = from.distanceTo(to);
    const pos = from.copy();
    const steps = length / TILE_SIZE * 2;
    const offset = new Vector2(to.x - from.x, to.y - from.y).mul(1 / steps);

    for (let i = 0; i < steps; i++) {
      pos.add(offset);
      const index = this.getIndexOfPos(pos);
      if (this.staticGrid.has(index)) {
        return true;
      }
    }
    return false;
  }
}

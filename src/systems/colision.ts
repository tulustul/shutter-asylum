import { EntitySystem } from './ecs.js';
import { Vector2 } from '../vector.js';
import { TILE_SIZE } from '../constants.js';

export interface Collidable {
  pos: Vector2;
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

    for (const hitter of this.entities) {
      for (const cell of this.getCellsOf(hitter)) {
        if (this.staticGrid.has(cell)) {
          for (const receiver of this.staticGrid.get(cell)) {
            if (receiver !== hitter) {
              this.checkColisions(hitter, receiver)
            }
          }
        }

        if (this.dynamicGrid.has(cell)) {
          for (const receiver of this.dynamicGrid.get(cell)) {
            if (receiver !== hitter) {
              this.checkColisions(hitter, receiver)
            }
          }
        }
      }
    }
  }

  private checkColisions(hitter: Collidable, receiver: Collidable) {
    // if (hitter.radius === TILE_SIZE / 2) {
      if (hitter.shouldDecouple) {
        this.decouple(hitter);
      }
      this.emitColision(hitter, receiver, null, 0);
    // } else {
    //   if (
    //     hitter.pos.x + hitter.radius >= receiver.pos.x - receiver.radius ||
    //     hitter.pos.x - hitter.radius >= receiver.pos.x + receiver.radius ||
    //     hitter.pos.y + hitter.radius >= receiver.pos.y - receiver.radius ||
    //     hitter.pos.y - hitter.radius >= receiver.pos.y + receiver.radius
    //   ) {
    //     this.emitColision(hitter, receiver, null, 0);
    //   }
    // }
  }

  private decouple(hitter: Collidable) {
    const pos = hitter.parent.posAndVel.floatPos;
    const vel = hitter.parent.posAndVel.vel;
    const originalPos = pos.copy();

    this.snapToGrid(pos, hitter);

    const cell = this.getIndexOf(
      Math.round(pos.x / TILE_SIZE),
      Math.round(pos.y / TILE_SIZE),
    );

    const x = vel.x > 0 ? 1 : -1;
    if (!this.staticGrid.has(cell + x * 1000)) {
      pos.x = originalPos.x;
    } else {
      vel.x = 0;
    }

    const y = vel.y > 0 ? 1 : -1;
    if (!this.staticGrid.has(cell + y)) {
      pos.y = originalPos.y;
    } else {
      vel.y = 0;
    }

    hitter.parent.posAndVel.pos.x = Math.round(hitter.parent.posAndVel.floatPos.x);
    hitter.parent.posAndVel.pos.y = Math.round(hitter.parent.posAndVel.floatPos.y);
  }

  private snapToGrid(pos: Vector2, hitter: Collidable) {
    pos.x = Math.round(pos.x / TILE_SIZE * TILE_SIZE);
    pos.y = Math.round(pos.y / TILE_SIZE * TILE_SIZE);
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
    // for (const cell of this.getCellsOf(entity)) {
    //   this.addToGrid(grid, cell, entity);
    // }
    const cell = this.getIndexOf(
      Math.ceil(entity.pos.x / TILE_SIZE),
      Math.ceil(entity.pos.y / TILE_SIZE),
    );
    this.addToGrid(grid, cell, entity);
  }

  private addToGrid(grid: ColisionGrid, cell: number, entity: Collidable) {
    if (!grid.has(cell)) {
      grid.set(cell, [entity]);
    } else {
      grid.get(cell).push(entity);
    }
  }

  private *getCellsOf(entity: Collidable) {
    const minX = Math.round((entity.pos.x - entity.radius) / TILE_SIZE);
    const maxX = Math.round((entity.pos.x + entity.radius) / TILE_SIZE);

    const minY = Math.round((entity.pos.y - entity.radius) / TILE_SIZE);
    const maxY = Math.round((entity.pos.y + entity.radius) / TILE_SIZE);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        yield this.getIndexOf(x, y);
      }
    }

    // const maxX = Math.ceil(entity.pos.x / TILE_SIZE);
    // const minX = Math.floor(entity.pos.x / TILE_SIZE);

    // const minY = Math.floor(entity.pos.y / TILE_SIZE);
    // const maxY = Math.ceil(entity.pos.y / TILE_SIZE);

    // yield this.getIndexOf(minX, minY);

    // if (minX !== maxX) {
    //   yield this.getIndexOf(maxX, minY);
    // }
    // if (minY !== maxY) {
    //   yield this.getIndexOf(minX, maxY);
    // }
    // if (minX !== maxX && minY !== maxY) {
    //   yield this.getIndexOf(maxX, maxY);
    // }
  }

  private getIndexOf(x: number, y: number) {
    return x * 1000 + y;
  }

  private emitColision(hitter: Collidable, receiver: Collidable, vec: Vector2, penetration: number) {
    const key = hitter.parent.constructor;
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

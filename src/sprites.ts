interface SpriteMetadata {
  x: number;
  y: number;
  w: number;
  h: number;
}

type SpriteMap = {[key: string]: SpriteMetadata};

export const SPRITES_MAP: SpriteMap = {
  stone: {x: 0, y: 0, w: 20, h: 20},
  wood: {x: 0, y: 40, w: 20, h: 20},
  tiles: {x: 40, y: 40, w: 20, h: 20},
  carpetBorder: {x: 60, y: 22, w: 20, h: 3},
  carpet: {x: 60, y: 25, w: 20, h: 20},
  tableBorder: {x: 60, y: 45, w: 20, h: 2},
  table: {x: 60, y: 47, w: 47, h: 20},
  wall: {x: 0, y: 20, w: 20, h: 20},
  agent: {x: 21, y: 0, w: 20, h: 25},
  corpse: {x: 40, y: 0, w: 40, h: 23},
  door: {x: 20, y: 40, w: 20, h: 20},
  light: {x: 20, y: 30, w: 5, h: 10},
  lightBroken: {x: 25, y: 30, w: 7, h: 10},
}

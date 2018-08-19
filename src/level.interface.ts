import { Vector2 } from "./vector";

export type Cell =
  " " |
  "." |
  "-" |
  "X" |
  "S" |
  'E' |
  'L' |
  'B' |
  '|' |
  '_';

export interface Level {
  cells: Cell[][];
  playerStartPos: Vector2;
}

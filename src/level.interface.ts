import { Vector2 } from "./vector";

export type Cell = " " | "." | "X" | "S" | 'E';

export interface Level {
  cells: Cell[][];
  playerStartPos: Vector2;
}

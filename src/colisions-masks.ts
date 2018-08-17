export const BARRIER_MASK = 1;
export const PLAYER_MASK = 1 << 1;
export const ENEMY_MASK = 1 << 2;

export const BARRIER_OR_ENEMY_MASK = BARRIER_MASK | ENEMY_MASK;
export const BARRIER_OR_PLAYER_MASK = BARRIER_MASK | PLAYER_MASK;
export const AGENTS_MASK = PLAYER_MASK | ENEMY_MASK;

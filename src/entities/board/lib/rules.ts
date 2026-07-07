import { BOARD_SIZE } from '../../../shared/config/board';
import type { Tile } from '../../../shared/types/game';
import { mapGrid } from './grid';

const LAST = BOARD_SIZE - 1;

export const highestValue = (tiles: readonly Tile[]): number =>
  tiles.reduce((max, tile) => Math.max(max, tile.value), 0);

/** Есть ли доступный ход: свободная клетка или пара равных соседей. */
export const movesAvailable = (tiles: readonly Tile[]): boolean => {
  if (tiles.length < BOARD_SIZE * BOARD_SIZE) return true;

  const values = mapGrid(tiles, (tile) => tile.value);

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const value = values[row][col];
      if (col < LAST && values[row][col + 1] === value) return true;
      if (row < LAST && values[row + 1][col] === value) return true;
    }
  }
  return false;
};

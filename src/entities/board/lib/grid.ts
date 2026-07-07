import { BOARD_SIZE } from '../../../shared/config/board';
import type { Position, Tile } from '../../../shared/types/game';

/** Сетка ячеек 4×4; каждая — значение проекции плитки или null (пусто). */
export type Grid<T> = (T | null)[][];

/**
 * Раскладывает плитки по сетке, проецируя каждую в нужное значение (id, value, саму
 * плитку). Единственное место, где строится 4×4-сетка из плиток — переиспользуется
 * ходом, правилами и спавном.
 */
export const mapGrid = <T>(tiles: readonly Tile[], project: (tile: Tile) => T): Grid<T> => {
  const grid: Grid<T> = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null),
  );
  for (const tile of tiles) {
    grid[tile.row][tile.col] = project(tile);
  }
  return grid;
};

export const emptyCells = <T>(grid: Grid<T>): Position[] => {
  const cells: Position[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (grid[row][col] === null) cells.push({ row, col });
    }
  }
  return cells;
};

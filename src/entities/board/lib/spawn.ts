import { SPAWN_FOUR_CHANCE } from '../../../shared/config/board';
import type { Tile } from '../../../shared/types/game';
import { emptyCells, mapGrid } from './grid';

/** Источник случайности [0, 1). Инъекция нужна для детерминированных тестов. */
export type Rng = () => number;

export interface SpawnResult {
  readonly tile: Tile;
  readonly nextId: number;
}

/**
 * Ставит новую плитку в случайную свободную клетку (детерминированный выбор из
 * списка свободных, без «слепого» перебора координат). null — если места нет.
 */
export const spawnTile = (
  tiles: readonly Tile[],
  nextId: number,
  rng: Rng = Math.random,
): SpawnResult | null => {
  const cells = emptyCells(mapGrid(tiles, (tile) => tile.id));
  if (cells.length === 0) return null;

  const cell = cells[Math.floor(rng() * cells.length)];
  const value = rng() < SPAWN_FOUR_CHANCE ? 4 : 2;
  return {
    tile: { id: nextId, value, row: cell.row, col: cell.col },
    nextId: nextId + 1,
  };
};

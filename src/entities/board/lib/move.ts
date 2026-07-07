import { BOARD_SIZE } from '../../../shared/config/board';
import type { Direction, Position, Tile } from '../../../shared/types/game';
import { mapGrid } from './grid';

/** Скольжение плитки из одной клетки в другую (для анимации сдвига). */
export interface Movement {
  readonly id: number;
  readonly from: Position;
  readonly to: Position;
}

/** Слияние: consumed «въезжает» в survivor, значение удваивается. */
export interface Merge {
  readonly survivorId: number;
  readonly consumedId: number;
  readonly at: Position;
  readonly value: number;
}

export interface MoveResult {
  /** Был ли реальный сдвиг/слияние — если нет, ход не засчитывается. */
  readonly moved: boolean;
  readonly movements: Movement[];
  readonly merges: Merge[];
  readonly gained: number;
  /** Итоговые плитки после слияния, но до появления новой. */
  readonly tiles: Tile[];
}

const LAST = BOARD_SIZE - 1;

/**
 * Для каждого направления — как перебирать линию так, чтобы позиция p=0 была у того
 * края, к которому едут плитки. Это единственное, что отличает направления; сам
 * алгоритм коллапса общий.
 */
const READERS: Record<Direction, (line: number, p: number) => Position> = {
  left: (line, p) => ({ row: line, col: p }),
  right: (line, p) => ({ row: line, col: LAST - p }),
  up: (line, p) => ({ row: p, col: line }),
  down: (line, p) => ({ row: LAST - p, col: line }),
};

interface Placed {
  id: number;
  value: number;
  p: number;
  merged: boolean;
}

/**
 * Планирует ход: чистая функция, без таймеров и мутаций состояния движка.
 * Возвращает итоговые плитки, список перемещений и слияний для анимации и
 * набранные очки. Появление новой плитки сюда не входит — оно случайно и живёт
 * отдельно, чтобы ход оставался детерминированным и тестируемым.
 */
export const planMove = (tiles: readonly Tile[], dir: Direction): MoveResult => {
  const grid = mapGrid(tiles, (tile) => tile);
  const read = READERS[dir];

  const movements: Movement[] = [];
  const merges: Merge[] = [];
  const nextTiles: Tile[] = [];
  let gained = 0;
  let moved = false;

  for (let line = 0; line < BOARD_SIZE; line++) {
    // Собираем непустые плитки вдоль линии в порядке движения к краю (p = 0..LAST).
    const units: { id: number; value: number; p: number }[] = [];
    for (let p = 0; p < BOARD_SIZE; p++) {
      const { row, col } = read(line, p);
      const tile = grid[row][col];
      if (tile) units.push({ id: tile.id, value: tile.value, p });
    }

    // Схлопываем к позиции p = 0, сливая соседние равные (не более одного слияния на плитку).
    const placed: Placed[] = [];
    for (const unit of units) {
      const last = placed[placed.length - 1];
      if (last && !last.merged && last.value === unit.value) {
        last.value *= 2;
        last.merged = true;
        gained += last.value;
        moved = true;
        merges.push({
          survivorId: last.id,
          consumedId: unit.id,
          at: read(line, last.p),
          value: last.value,
        });
        movements.push({ id: unit.id, from: read(line, unit.p), to: read(line, last.p) });
      } else {
        const targetP = placed.length;
        if (unit.p !== targetP) {
          moved = true;
          movements.push({ id: unit.id, from: read(line, unit.p), to: read(line, targetP) });
        }
        placed.push({ id: unit.id, value: unit.value, p: targetP, merged: false });
      }
    }

    for (const item of placed) {
      const { row, col } = read(line, item.p);
      nextTiles.push({ id: item.id, value: item.value, row, col });
    }
  }

  return { moved, movements, merges, gained, tiles: nextTiles };
};

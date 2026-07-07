import { describe, expect, it } from 'vitest';
import type { Direction, Tile } from '../../../shared/types/game';
import { planMove } from './move';

/** Строит плитки из матрицы значений (null — пусто), присваивая последовательные id. */
const tilesFrom = (matrix: (number | null)[][]): Tile[] => {
  const tiles: Tile[] = [];
  let id = 1;
  matrix.forEach((rowValues, row) =>
    rowValues.forEach((value, col) => {
      if (value !== null) tiles.push({ id: id++, value, row, col });
    }),
  );
  return tiles;
};

/** Матрица значений из плиток — для наглядных ассертов. */
const matrixOf = (tiles: readonly Tile[]): (number | null)[][] => {
  const grid: (number | null)[][] = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => null),
  );
  for (const tile of tiles) grid[tile.row][tile.col] = tile.value;
  return grid;
};

const move = (matrix: (number | null)[][], dir: Direction) => planMove(tilesFrom(matrix), dir);

const row = (a: number | null, b: number | null, c: number | null, d: number | null) => [
  a,
  b,
  c,
  d,
];
const empty = row(null, null, null, null);

describe('planMove', () => {
  it('сдвигает плитки к краю без слияния', () => {
    const result = move([row(null, null, null, 2), empty, empty, empty], 'left');
    expect(result.moved).toBe(true);
    expect(matrixOf(result.tiles)[0]).toEqual(row(2, null, null, null));
    expect(result.gained).toBe(0);
    expect(result.merges).toHaveLength(0);
  });

  it('сливает две равные плитки и начисляет очки', () => {
    const result = move([row(2, 2, null, null), empty, empty, empty], 'left');
    expect(matrixOf(result.tiles)[0]).toEqual(row(4, null, null, null));
    expect(result.gained).toBe(4);
    expect(result.merges).toHaveLength(1);
    expect(result.merges[0].value).toBe(4);
  });

  it('не сливает одну плитку дважды за ход', () => {
    const result = move([row(2, 2, 2, 2), empty, empty, empty], 'left');
    expect(matrixOf(result.tiles)[0]).toEqual(row(4, 4, null, null));
    expect(result.gained).toBe(8);
    expect(result.merges).toHaveLength(2);
  });

  it('сливает только ближнюю пару: 4 2 2 → 4 4', () => {
    const result = move([row(4, 2, 2, null), empty, empty, empty], 'left');
    expect(matrixOf(result.tiles)[0]).toEqual(row(4, 4, null, null));
    expect(result.gained).toBe(4);
  });

  it('обрабатывает несколько слияний в строке: 2 2 4 4 → 4 8', () => {
    const result = move([row(2, 2, 4, 4), empty, empty, empty], 'left');
    expect(matrixOf(result.tiles)[0]).toEqual(row(4, 8, null, null));
    expect(result.gained).toBe(12);
  });

  it('помечает ход как несостоявшийся, если ничего не двигается', () => {
    const result = move([row(2, 4, 8, 16), empty, empty, empty], 'left');
    expect(result.moved).toBe(false);
    expect(result.movements).toHaveLength(0);
  });

  it('двигает вправо', () => {
    const result = move([row(2, null, null, null), empty, empty, empty], 'right');
    expect(matrixOf(result.tiles)[0]).toEqual(row(null, null, null, 2));
  });

  it('двигает вверх и сливает по столбцу', () => {
    const result = move([row(2, null, null, null), row(2, null, null, null), empty, empty], 'up');
    expect(matrixOf(result.tiles)[0][0]).toBe(4);
    expect(result.gained).toBe(4);
  });

  it('двигает вниз', () => {
    const result = move([row(2, null, null, null), empty, empty, empty], 'down');
    expect(matrixOf(result.tiles)[3][0]).toBe(2);
  });

  it('сохраняет id пережившей плитки при слиянии', () => {
    const tiles: Tile[] = [
      { id: 10, value: 2, row: 0, col: 0 },
      { id: 20, value: 2, row: 0, col: 1 },
    ];
    const result = planMove(tiles, 'left');
    expect(result.merges[0].survivorId).toBe(10);
    expect(result.merges[0].consumedId).toBe(20);
    expect(result.tiles.find((t) => t.id === 10)?.value).toBe(4);
    expect(result.tiles.some((t) => t.id === 20)).toBe(false);
  });
});

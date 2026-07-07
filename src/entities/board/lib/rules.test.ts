import { describe, expect, it } from 'vitest';
import type { Tile } from '../../../shared/types/game';
import { highestValue, movesAvailable } from './rules';

const fullBoard = (values: number[][]): Tile[] => {
  const tiles: Tile[] = [];
  let id = 1;
  values.forEach((rowValues, row) =>
    rowValues.forEach((value, col) => tiles.push({ id: id++, value, row, col })),
  );
  return tiles;
};

describe('highestValue', () => {
  it('возвращает максимум среди плиток', () => {
    expect(highestValue([{ id: 1, value: 8, row: 0, col: 0 }])).toBe(8);
    expect(highestValue([])).toBe(0);
  });
});

describe('movesAvailable', () => {
  it('true, если есть свободная клетка', () => {
    expect(movesAvailable([{ id: 1, value: 2, row: 0, col: 0 }])).toBe(true);
  });

  it('false на заполненной доске без пар', () => {
    const board = fullBoard([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(movesAvailable(board)).toBe(false);
  });

  it('true на заполненной доске с горизонтальной парой', () => {
    const board = fullBoard([
      [2, 2, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(movesAvailable(board)).toBe(true);
  });
});

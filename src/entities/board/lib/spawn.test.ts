import { describe, expect, it } from 'vitest';
import type { Tile } from '../../../shared/types/game';
import { spawnTile } from './spawn';

/** Детерминированный источник случайности: выдаёт значения по кругу. */
const seq = (values: number[]): (() => number) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('spawnTile', () => {
  it('ставит плитку в единственную свободную клетку', () => {
    const occupied: Tile[] = [];
    let id = 1;
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 4; col++)
        if (!(row === 2 && col === 3)) occupied.push({ id: id++, value: 2, row, col });

    const result = spawnTile(occupied, id, seq([0, 0]));
    expect(result?.tile.row).toBe(2);
    expect(result?.tile.col).toBe(3);
  });

  it('выдаёт 4 при попадании в шанс, иначе 2', () => {
    const four = spawnTile([], 1, seq([0, 0.05]));
    expect(four?.tile.value).toBe(4);
    const two = spawnTile([], 1, seq([0, 0.5]));
    expect(two?.tile.value).toBe(2);
  });

  it('увеличивает nextId', () => {
    const result = spawnTile([], 7, seq([0, 0.5]));
    expect(result?.nextId).toBe(8);
  });

  it('возвращает null, если свободных клеток нет', () => {
    const full: Tile[] = [];
    let id = 1;
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 4; col++) full.push({ id: id++, value: 2, row, col });
    expect(spawnTile(full, id)).toBeNull();
  });
});

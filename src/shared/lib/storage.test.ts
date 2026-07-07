import { beforeEach, describe, expect, it } from 'vitest';
import { type GameSnapshot, loadSnapshot, saveSnapshot } from './storage';

const snapshot: GameSnapshot = {
  tiles: [{ id: 1, value: 2, row: 0, col: 0 }],
  nextId: 2,
  score: 4,
  best: 8,
  moves: 3,
  status: 'playing',
  theme: 'dark',
  lang: 'en',
};

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('сохраняет и читает снимок', () => {
    saveSnapshot(snapshot);
    expect(loadSnapshot()).toEqual(snapshot);
  });

  it('возвращает null при отсутствии данных', () => {
    expect(loadSnapshot()).toBeNull();
  });

  it('возвращает null при повреждённом JSON', () => {
    localStorage.setItem('r2048v1', '{not json');
    expect(loadSnapshot()).toBeNull();
  });

  it('возвращает null при неверной форме данных', () => {
    localStorage.setItem('r2048v1', JSON.stringify({ score: 'oops' }));
    expect(loadSnapshot()).toBeNull();
  });

  it('отбраковывает снимок с битой плиткой', () => {
    localStorage.setItem('r2048v1', JSON.stringify({ ...snapshot, tiles: [{ id: 1, value: 2 }] }));
    expect(loadSnapshot()).toBeNull();
  });
});

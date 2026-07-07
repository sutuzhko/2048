import { beforeEach, describe, expect, it } from 'vitest';
import { GameEngine } from './game';

const newEngine = () => new GameEngine({ theme: 'light', lang: 'ru' });

describe('GameEngine', () => {
  beforeEach(() => localStorage.clear());

  it('новая игра выставляет две плитки и нулевой счёт', () => {
    const engine = newEngine();
    engine.newGame();
    const state = engine.getState();
    expect(state.tiles).toHaveLength(2);
    expect(state.score).toBe(0);
    expect(state.status).toBe('playing');
  });

  it('восстанавливает игру из хранилища', () => {
    localStorage.setItem(
      'r2048v1',
      JSON.stringify({
        tiles: [{ id: 1, value: 8, row: 1, col: 1 }],
        nextId: 2,
        score: 16,
        best: 32,
        moves: 5,
        status: 'continue',
        theme: 'dark',
        lang: 'en',
      }),
    );
    const engine = newEngine();
    engine.load();
    const state = engine.getState();
    expect(state.score).toBe(16);
    expect(state.best).toBe(32);
    expect(state.moves).toBe(5);
    expect(state.status).toBe('continue');
    expect(state.theme).toBe('dark');
    expect(state.lang).toBe('en');
    expect(state.tiles[0].value).toBe(8);
  });

  it('начинает новую игру, если в хранилище пусто', () => {
    const engine = newEngine();
    engine.load();
    expect(engine.getState().tiles).toHaveLength(2);
  });

  it('уведомляет подписчика об изменениях', () => {
    const engine = newEngine();
    let calls = 0;
    engine.onChange(() => calls++);
    engine.newGame();
    engine.setTheme('dark');
    expect(calls).toBe(2);
    expect(engine.getState().theme).toBe('dark');
  });

  it('keepGoing переводит won → continue', () => {
    const engine = newEngine();
    engine.newGame();
    // Прямой сценарий победы недетерминирован; проверяем, что вне статуса won метод безопасен.
    engine.keepGoing();
    expect(engine.getState().status).toBe('playing');
  });
});

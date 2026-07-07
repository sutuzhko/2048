import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Tile } from '../../../shared/types/game';
import { GameEngine } from '../model/game';
import type { BoardRendererLike } from './board-renderer';
import { GameView } from './game-view';

/** Заглушка рендерера — вью монтируется без canvas, анимация мгновенно завершается. */
const stubRenderer = (): BoardRendererLike => ({
  resize: () => {},
  drawStatic: () => {},
  animateMove: () => Promise.resolve(),
});

const seed = (tiles: Tile[], extra: Record<string, unknown> = {}): void => {
  localStorage.setItem(
    'r2048v1',
    JSON.stringify({
      tiles,
      nextId: tiles.length + 1,
      score: 0,
      best: 0,
      moves: 0,
      status: 'playing',
      theme: 'light',
      lang: 'ru',
      ...extra,
    }),
  );
};

const mountGame = (): GameEngine => {
  const engine = new GameEngine({ theme: 'light', lang: 'ru' });
  new GameView(document.body, engine, stubRenderer);
  engine.load();
  return engine;
};

const press = (key: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }));
};

const text = (selector: string): string | undefined =>
  document.querySelector(selector)?.textContent ?? undefined;

describe('GameView (интеграция)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    // Reduce-motion → коммит хода синхронный, удобно для ассертов.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('строит структуру: бренд, три панели, скрытые оверлеи', () => {
    mountGame();
    expect(text('.brand__title')).toBe('2048');
    expect(document.querySelectorAll('.scores .panel')).toHaveLength(3);
    expect(document.querySelector('.overlay--win')?.classList.contains('is-visible')).toBe(false);
    expect(document.querySelector('.overlay--lose')?.classList.contains('is-visible')).toBe(false);
    expect(text('.scores .panel:nth-child(3) .panel__value')).toBe('0');
  });

  it('ход с клавиатуры сливает плитки и увеличивает счёт и число ходов', () => {
    seed([
      { id: 1, value: 2, row: 0, col: 0 },
      { id: 2, value: 2, row: 0, col: 1 },
    ]);
    mountGame();
    press('ArrowLeft');
    expect(text('.scores .panel:nth-child(1) .panel__value')).toBe('4');
    expect(text('.scores .panel:nth-child(3) .panel__value')).toBe('1');
  });

  it('блокирует второй ход, пока первый анимируется', async () => {
    seed([
      { id: 1, value: 2, row: 0, col: 0 },
      { id: 2, value: 2, row: 0, col: 1 },
    ]);
    mountGame();
    press('ArrowLeft');
    press('ArrowDown'); // должен быть проигнорирован — идёт анимация
    expect(text('.scores .panel:nth-child(3) .panel__value')).toBe('1');
    await Promise.resolve(); // снимаем блокировку
    press('ArrowUp');
    expect(text('.scores .panel:nth-child(3) .panel__value')).toBe('2');
  });

  it('кнопка «Новая игра» сбрасывает счёт и число ходов', () => {
    seed(
      [
        { id: 1, value: 64, row: 0, col: 0 },
        { id: 2, value: 32, row: 1, col: 1 },
      ],
      { score: 500, moves: 20 },
    );
    mountGame();
    expect(text('.scores .panel:nth-child(1) .panel__value')).toBe('500');
    (document.querySelector('.toolbar .btn') as HTMLElement).click();
    expect(text('.scores .panel:nth-child(1) .panel__value')).toBe('0');
    expect(text('.scores .panel:nth-child(3) .panel__value')).toBe('0');
  });

  it('переключатель темы меняет data-theme', () => {
    mountGame();
    const darkButton = document.querySelector('[data-theme-option="dark"]');
    (darkButton as HTMLElement).click();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('переключатель языка меняет строки на английские', () => {
    mountGame();
    const enButton = [...document.querySelectorAll('.seg__btn')].find(
      (b) => b.textContent === 'EN',
    );
    (enButton as HTMLElement).click();
    expect(text('.brand__subtitle')).toBe('Join the tiles, get to 2048!');
    expect(text('.scores .panel:nth-child(3) .panel__label')).toBe('MOVES');
  });
});

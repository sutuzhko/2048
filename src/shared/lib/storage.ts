import type { GameStatus, Lang, Theme, Tile } from '../types/game';

/** Снимок игры, который кладём в localStorage. Единственный ключ хранилища. */
export interface GameSnapshot {
  readonly tiles: Tile[];
  readonly nextId: number;
  readonly score: number;
  readonly best: number;
  readonly moves: number;
  readonly status: GameStatus;
  readonly theme: Theme;
  readonly lang: Lang;
}

const STORAGE_KEY = 'r2048v1';

const isTile = (value: unknown): value is Tile => {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === 'number' &&
    typeof t.value === 'number' &&
    typeof t.row === 'number' &&
    typeof t.col === 'number'
  );
};

const isSnapshot = (value: unknown): value is GameSnapshot => {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    Array.isArray(s.tiles) &&
    s.tiles.every(isTile) &&
    typeof s.nextId === 'number' &&
    typeof s.score === 'number' &&
    typeof s.best === 'number' &&
    typeof s.moves === 'number' &&
    (s.status === 'playing' ||
      s.status === 'won' ||
      s.status === 'continue' ||
      s.status === 'lost') &&
    (s.theme === 'light' || s.theme === 'dark') &&
    (s.lang === 'ru' || s.lang === 'en')
  );
};

/**
 * Читает сохранённую игру. Данные из localStorage считаем недоверенными:
 * при повреждении или несовпадении формы возвращаем null, а не роняем игру.
 */
export const loadSnapshot = (): GameSnapshot | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const saveSnapshot = (snapshot: GameSnapshot): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Хранилище недоступно (приватный режим/переполнение) — молча продолжаем без сохранения.
  }
};

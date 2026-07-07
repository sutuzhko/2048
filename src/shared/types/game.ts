/** Направление хода. */
export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Состояние партии:
 * - playing  — идёт игра;
 * - won       — только что собрана 2048 (показываем оверлей победы);
 * - continue  — игрок продолжил после победы;
 * - lost      — ходов не осталось.
 */
export type GameStatus = 'playing' | 'won' | 'continue' | 'lost';

export type Theme = 'light' | 'dark';
export type Lang = 'ru' | 'en';

/** Позиция на доске в координатах [строка, столбец]. */
export interface Position {
  readonly row: number;
  readonly col: number;
}

/** Плитка с устойчивым id — id нужен, чтобы анимировать перемещения между ходами. */
export interface Tile {
  readonly id: number;
  readonly value: number;
  readonly row: number;
  readonly col: number;
}

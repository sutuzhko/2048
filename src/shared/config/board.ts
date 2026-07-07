/** Размер поля: 4×4. Всё остальное считается от него, поэтому смена размера — в одном месте. */
export const BOARD_SIZE = 4;

/** Значение плитки, при котором засчитывается победа. */
export const WIN_VALUE = 2048;

/** Шанс появления «4» вместо «2» при спавне новой плитки. */
export const SPAWN_FOUR_CHANCE = 0.1;

/**
 * Геометрия доски в долях от её стороны (из дизайн-спеки).
 * padding и gutter по 2.8%, клетка — 21.5%: (1 − 2·pad − 3·gap) / 4 = 0.215.
 */
export const GEOMETRY = {
  padding: 0.028,
  gutter: 0.028,
  cell: 0.215,
  radiusBoard: 0.03, // ≈14px при ширине 460px, задаётся в CSS у контейнера
  radiusTile: 9, // px
} as const;

/** Длительности анимаций (мс) — переносятся из дизайн-спеки один-в-один. */
export const TIMING = {
  slide: 135,
  appear: 170,
  pop: 170,
  scorePop: 620,
} as const;

/** Порог свайпа в пикселях, ниже которого жест не считается ходом. */
export const SWIPE_THRESHOLD = 24;

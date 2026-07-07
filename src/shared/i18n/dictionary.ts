import type { Lang } from '../types/game';

/** Ключи всех пользовательских строк. Компоненты ссылаются на ключи, а не на литералы. */
export interface Strings {
  readonly subtitle: string;
  readonly score: string;
  readonly best: string;
  readonly moves: string;
  readonly newGame: string;
  readonly howto: string;
  readonly winTitle: string;
  readonly winSub: string;
  readonly loseTitle: string;
  readonly loseSub: string;
  readonly keep: string;
  readonly tryAgain: string;
  readonly themeLight: string;
  readonly themeDark: string;
}

export const DICTIONARY: Record<Lang, Strings> = {
  ru: {
    subtitle: 'Собери плитки до 2048!',
    score: 'СЧЁТ',
    best: 'РЕКОРД',
    moves: 'ХОДЫ',
    newGame: 'Новая игра',
    howto: 'Стрелки ← ↑ → ↓ или свайп по доске — двигай плитки. Одинаковые сливаются.',
    winTitle: 'Победа!',
    winSub: 'Ты собрал плитку 2048.',
    loseTitle: 'Игра окончена',
    loseSub: 'Ходов больше не осталось.',
    keep: 'Продолжить',
    tryAgain: 'Ещё раз',
    themeLight: 'Светлая тема',
    themeDark: 'Тёмная тема',
  },
  en: {
    subtitle: 'Join the tiles, get to 2048!',
    score: 'SCORE',
    best: 'BEST',
    moves: 'MOVES',
    newGame: 'New Game',
    howto: 'Arrow keys ← ↑ → ↓ or swipe the board to move tiles. Equal tiles merge.',
    winTitle: 'You win!',
    winSub: 'You reached the 2048 tile.',
    loseTitle: 'Game over',
    loseSub: 'No moves left.',
    keep: 'Keep going',
    tryAgain: 'Try again',
    themeLight: 'Light theme',
    themeDark: 'Dark theme',
  },
};

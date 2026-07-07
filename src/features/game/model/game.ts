import {
  highestValue,
  type Merge,
  type Movement,
  movesAvailable,
  planMove,
  spawnTile,
} from '../../../entities/board';
import { WIN_VALUE } from '../../../shared/config/board';
import { loadSnapshot, saveSnapshot } from '../../../shared/lib/storage';
import type { Direction, GameStatus, Lang, Theme, Tile } from '../../../shared/types/game';

/** Публичный снимок состояния для отрисовки. */
export interface GameState {
  readonly tiles: Tile[];
  readonly score: number;
  readonly best: number;
  readonly moves: number;
  readonly status: GameStatus;
  readonly theme: Theme;
  readonly lang: Lang;
}

/** Данные хода для анимации: что куда едет, что сливается, что появилось. */
export interface MoveOutcome {
  readonly movements: Movement[];
  readonly merges: Merge[];
  readonly spawned: Tile | null;
  readonly gained: number;
}

export interface AppliedMove {
  readonly outcome: MoveOutcome;
  readonly state: GameState;
}

type Listener = (state: GameState) => void;

const PLAYABLE: ReadonlySet<GameStatus> = new Set<GameStatus>(['playing', 'continue']);

/**
 * Движок игры: держит авторитетное состояние и применяет ходы синхронно.
 * Анимации и таймеры — забота вью; движок остаётся чистым и тестируемым.
 * Композиция вместо наследования: вью получает движок, а не наследует его.
 */
export class GameEngine {
  private tiles: Tile[] = [];
  private nextId = 1;
  private score = 0;
  private best = 0;
  private moves = 0;
  private status: GameStatus = 'playing';
  private theme: Theme;
  private lang: Lang;
  private listener: Listener | null = null;

  constructor(defaults: { theme: Theme; lang: Lang }) {
    this.theme = defaults.theme;
    this.lang = defaults.lang;
  }

  onChange(listener: Listener): void {
    this.listener = listener;
  }

  getState(): GameState {
    return {
      tiles: this.tiles.map((tile) => ({ ...tile })),
      score: this.score,
      best: this.best,
      moves: this.moves,
      status: this.status,
      theme: this.theme,
      lang: this.lang,
    };
  }

  /** Восстанавливает игру из хранилища либо начинает новую. */
  load(): void {
    const snapshot = loadSnapshot();
    if (!snapshot) {
      this.newGame();
      return;
    }
    this.theme = snapshot.theme;
    this.lang = snapshot.lang;
    this.best = snapshot.best;
    if (snapshot.tiles.length > 0) {
      this.tiles = snapshot.tiles.map((tile) => ({ ...tile }));
      this.nextId = snapshot.nextId;
      this.score = snapshot.score;
      this.moves = snapshot.moves;
      this.status = snapshot.status;
      this.emit();
      return;
    }
    this.newGame();
  }

  newGame(): void {
    this.tiles = [];
    this.nextId = 1;
    this.score = 0;
    this.moves = 0;
    this.status = 'playing';
    this.addRandomTile();
    this.addRandomTile();
    this.persist();
    this.emit();
  }

  keepGoing(): void {
    if (this.status === 'won') {
      this.status = 'continue';
      this.persist();
      this.emit();
    }
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    this.persist();
    this.emit();
  }

  setLang(lang: Lang): void {
    this.lang = lang;
    this.persist();
    this.emit();
  }

  /**
   * Применяет ход. Возвращает данные для анимации и новое состояние либо null,
   * если ход ничего не сдвинул. Состояние движка уже финальное (со спавном),
   * а таймингом перехода управляет вью по outcome.
   */
  move(dir: Direction): AppliedMove | null {
    if (!PLAYABLE.has(this.status)) return null;

    const plan = planMove(this.tiles, dir);
    if (!plan.moved) return null;

    this.tiles = plan.tiles;
    this.score += plan.gained;
    this.best = Math.max(this.best, this.score);
    this.moves += 1;

    const spawn = spawnTile(this.tiles, this.nextId);
    if (spawn) {
      this.tiles = [...this.tiles, spawn.tile];
      this.nextId = spawn.nextId;
    }

    if (this.status === 'playing' && highestValue(this.tiles) >= WIN_VALUE) {
      this.status = 'won';
    }
    if (!movesAvailable(this.tiles)) {
      this.status = 'lost';
    }

    this.persist();
    return {
      outcome: {
        movements: plan.movements,
        merges: plan.merges,
        spawned: spawn ? spawn.tile : null,
        gained: plan.gained,
      },
      state: this.getState(),
    };
  }

  private addRandomTile(): void {
    const spawn = spawnTile(this.tiles, this.nextId);
    if (!spawn) return;
    this.tiles = [...this.tiles, spawn.tile];
    this.nextId = spawn.nextId;
  }

  private persist(): void {
    saveSnapshot({
      tiles: this.tiles,
      nextId: this.nextId,
      score: this.score,
      best: this.best,
      moves: this.moves,
      status: this.status,
      theme: this.theme,
      lang: this.lang,
    });
  }

  private emit(): void {
    this.listener?.(this.getState());
  }
}

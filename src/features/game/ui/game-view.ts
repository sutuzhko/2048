import { SWIPE_THRESHOLD, TIMING } from '../../../shared/config/board';
import { getStrings, type Strings } from '../../../shared/i18n';
import { el } from '../../../shared/lib/dom';
import type { Direction } from '../../../shared/types/game';
import type { GameEngine, GameState } from '../model/game';
import { BoardRenderer, type BoardRendererLike } from './board-renderer';

const KEY_TO_DIR: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

// Иконки тем через currentColor: цвет наследуется от состояния кнопки (активная/нет).
const ICON_SUN = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
  <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
  <line x1="12" y1="1.6" x2="12" y2="3.6" /><line x1="12" y1="20.4" x2="12" y2="22.4" />
  <line x1="1.6" y1="12" x2="3.6" y2="12" /><line x1="20.4" y1="12" x2="22.4" y2="12" />
  <line x1="4.6" y1="4.6" x2="6" y2="6" /><line x1="18" y1="18" x2="19.4" y2="19.4" />
  <line x1="4.6" y1="19.4" x2="6" y2="18" /><line x1="18" y1="6" x2="19.4" y2="4.6" />
</svg>`;
// Луна — сплошной полумесяц (в пару к солнцу светлой темы).
const ICON_MOON = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
  <path d="M21 12.9A8.4 8.4 0 1 1 11.1 3 6.6 6.6 0 0 0 21 12.9z" fill="currentColor" />
</svg>`;

/** Фабрика рендерера — по умолчанию canvas; в тестах подменяется заглушкой. */
export type RendererFactory = (canvas: HTMLCanvasElement) => BoardRendererLike;

/**
 * Вью игры: строит DOM-обвязку, подписывается на движок и обрабатывает ввод.
 * Игровое поле рисует на canvas через BoardRenderer, остальной интерфейс — в DOM.
 */
export class GameView {
  private readonly renderer: BoardRendererLike;
  /** Ввод заблокирован, пока проигрывается анимация хода — иначе быстрый спам ломает кадры. */
  private animating = false;

  private readonly subtitle = el('div', { class: 'brand__subtitle' });
  private readonly scoreLabel = el('div', { class: 'panel__label' });
  private readonly scoreValue = el('div', { class: 'panel__value' });
  private readonly bestLabel = el('div', { class: 'panel__label' });
  private readonly bestValue = el('div', { class: 'panel__value' });
  private readonly movesLabel = el('div', { class: 'panel__label' });
  private readonly movesValue = el('div', { class: 'panel__value' });
  private readonly howto = el('div', { class: 'howto' });
  private readonly scorePanel: HTMLElement;
  private readonly canvas = el('canvas', { class: 'board__canvas' });
  private readonly board: HTMLElement;

  private readonly newButtons: HTMLElement[] = [];
  private readonly keepButton: HTMLElement;
  private readonly tryButton: HTMLElement;
  private readonly winTitle = el('div', { class: 'overlay__title' });
  private readonly winSub = el('div', { class: 'overlay__sub' });
  private readonly loseTitle = el('div', { class: 'overlay__title' });
  private readonly loseSub = el('div', { class: 'overlay__sub' });
  private readonly winOverlay: HTMLElement;
  private readonly loseOverlay: HTMLElement;

  private readonly ruButton: HTMLElement;
  private readonly enButton: HTMLElement;
  private readonly lightButton: HTMLElement;
  private readonly darkButton: HTMLElement;

  constructor(
    mount: HTMLElement,
    private readonly engine: GameEngine,
    createRenderer: RendererFactory = (canvas) => new BoardRenderer(canvas),
  ) {
    const primaryNew = this.newGameButton();
    const winNew = this.newGameButton();
    const loseNew = this.newGameButton();
    this.keepButton = el('button', {
      class: 'btn btn--ghost',
      on: { click: () => this.engine.keepGoing() },
    });
    this.tryButton = loseNew;

    this.scorePanel = el('div', { class: 'panel' }, [this.scoreLabel, this.scoreValue]);
    const bestPanel = el('div', { class: 'panel' }, [this.bestLabel, this.bestValue]);
    const movesPanel = el('div', { class: 'panel' }, [this.movesLabel, this.movesValue]);

    this.ruButton = this.segButton('RU', () => this.engine.setLang('ru'));
    this.enButton = this.segButton('EN', () => this.engine.setLang('en'));
    this.lightButton = this.iconButton(ICON_SUN, 'light', () => this.engine.setTheme('light'));
    this.darkButton = this.iconButton(ICON_MOON, 'dark', () => this.engine.setTheme('dark'));

    const header = el('div', { class: 'game__header' }, [
      el('div', { class: 'brand' }, [
        el('div', { class: 'brand__title', text: '2048' }),
        this.subtitle,
      ]),
      el('div', { class: 'toggles' }, [
        el('div', { class: 'seg' }, [this.ruButton, this.enButton]),
        el('div', { class: 'seg' }, [this.lightButton, this.darkButton]),
      ]),
      el('div', { class: 'scores' }, [this.scorePanel, bestPanel, movesPanel]),
    ]);

    this.winOverlay = el('div', { class: 'overlay overlay--win' }, [
      this.winTitle,
      this.winSub,
      el('div', { class: 'overlay__actions' }, [this.keepButton, winNew]),
    ]);
    this.loseOverlay = el('div', { class: 'overlay overlay--lose' }, [
      this.loseTitle,
      this.loseSub,
      el('div', { class: 'overlay__actions' }, [loseNew]),
    ]);
    this.board = el('div', { class: 'board' }, [this.canvas, this.winOverlay, this.loseOverlay]);

    const game = el('section', { class: 'game' }, [
      header,
      el('div', { class: 'toolbar' }, [primaryNew]),
      this.board,
      this.howto,
    ]);
    mount.append(el('div', { class: 'app' }, [game]));

    this.renderer = createRenderer(this.canvas);
    this.engine.onChange((state) => this.onState(state));
    this.bindKeyboard();
    this.bindSwipe();
    this.observeResize();
  }

  private onState(state: GameState): void {
    this.applyChrome(state);
    this.renderer.drawStatic(state.tiles);
  }

  /** Обновляет весь DOM-интерфейс, кроме самого поля. */
  private applyChrome(state: GameState): void {
    document.documentElement.dataset.theme = state.theme;
    this.scoreValue.textContent = String(state.score);
    this.bestValue.textContent = String(state.best);
    this.movesValue.textContent = String(state.moves);
    this.applyStrings(getStrings(state.lang));
    this.toggle(this.ruButton, state.lang === 'ru');
    this.toggle(this.enButton, state.lang === 'en');
    this.toggle(this.lightButton, state.theme === 'light');
    this.toggle(this.darkButton, state.theme === 'dark');
    this.winOverlay.classList.toggle('is-visible', state.status === 'won');
    this.loseOverlay.classList.toggle('is-visible', state.status === 'lost');
  }

  private applyStrings(strings: Strings): void {
    this.subtitle.textContent = strings.subtitle;
    this.scoreLabel.textContent = strings.score;
    this.bestLabel.textContent = strings.best;
    this.movesLabel.textContent = strings.moves;
    this.howto.textContent = strings.howto;
    this.winTitle.textContent = strings.winTitle;
    this.winSub.textContent = strings.winSub;
    this.loseTitle.textContent = strings.loseTitle;
    this.loseSub.textContent = strings.loseSub;
    this.keepButton.textContent = strings.keep;
    this.tryButton.textContent = strings.tryAgain;
    for (const button of this.newButtons) button.textContent = strings.newGame;
    this.lightButton.setAttribute('title', strings.themeLight);
    this.darkButton.setAttribute('title', strings.themeDark);
  }

  private handleMove(dir: Direction): void {
    if (this.animating) return;
    const applied = this.engine.move(dir);
    if (!applied) return;

    this.animating = true;
    const reduce = this.reduceMotion();
    const commit = (): void => {
      this.applyChrome(applied.state);
      this.showScorePop(applied.outcome.gained);
    };
    if (reduce) commit();
    else window.setTimeout(commit, TIMING.slide);

    void this.renderer.animateMove(applied.outcome, applied.state.tiles, reduce).then(() => {
      this.animating = false;
    });
  }

  private showScorePop(gain: number): void {
    if (gain <= 0) return;
    this.scorePanel.querySelectorAll('.score-pop').forEach((node) => node.remove());
    const pop = el('div', { class: 'score-pop', text: `+${gain}` });
    pop.addEventListener('animationend', () => pop.remove());
    this.scorePanel.append(pop);
  }

  private bindKeyboard(): void {
    window.addEventListener('keydown', (event) => {
      const dir = KEY_TO_DIR[event.key];
      if (!dir) return;
      event.preventDefault();
      this.handleMove(dir);
    });
  }

  private bindSwipe(): void {
    let startX = 0;
    let startY = 0;
    let tracking = false;
    const start = (x: number, y: number): void => {
      startX = x;
      startY = y;
      tracking = true;
    };
    const end = (x: number, y: number): void => {
      if (!tracking) return;
      tracking = false;
      const dx = x - startX;
      const dy = y - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) > Math.abs(dy)) this.handleMove(dx > 0 ? 'right' : 'left');
      else this.handleMove(dy > 0 ? 'down' : 'up');
    };

    this.board.addEventListener(
      'touchstart',
      (event) => {
        const touch = event.touches[0];
        start(touch.clientX, touch.clientY);
      },
      { passive: true },
    );
    this.board.addEventListener(
      'touchmove',
      (event) => {
        if (tracking) event.preventDefault();
      },
      { passive: false },
    );
    this.board.addEventListener('touchend', (event) => {
      const touch = event.changedTouches[0];
      end(touch.clientX, touch.clientY);
    });
    this.board.addEventListener('mousedown', (event) => start(event.clientX, event.clientY));
    this.board.addEventListener('mouseup', (event) => end(event.clientX, event.clientY));
  }

  private observeResize(): void {
    const observer = new ResizeObserver(() => this.renderer.resize());
    observer.observe(this.board);
    requestAnimationFrame(() => this.renderer.resize());
  }

  private reduceMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private newGameButton(): HTMLElement {
    const button = el('button', {
      class: 'btn btn--primary',
      on: { click: () => this.engine.newGame() },
    });
    this.newButtons.push(button);
    return button;
  }

  private segButton(label: string, onClick: () => void): HTMLElement {
    return el('button', { class: 'seg__btn', text: label, on: { click: onClick } });
  }

  private iconButton(svg: string, option: string, onClick: () => void): HTMLElement {
    const button = el('button', {
      class: 'seg__btn seg__btn--icon',
      attrs: { type: 'button', 'data-theme-option': option },
      on: { click: onClick },
    });
    button.innerHTML = svg;
    return button;
  }

  private toggle(button: HTMLElement, active: boolean): void {
    button.classList.toggle('is-active', active);
  }
}

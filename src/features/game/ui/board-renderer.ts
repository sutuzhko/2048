import { GEOMETRY, TIMING } from '../../../shared/config/board';
import type { Position, Tile } from '../../../shared/types/game';
import type { MoveOutcome } from '../model/game';

/** Контракт рендерера поля — позволяет подменять его заглушкой в тестах без canvas. */
export interface BoardRendererLike {
  resize(): void;
  drawStatic(tiles: Tile[]): void;
  animateMove(outcome: MoveOutcome, finalTiles: Tile[], reduceMotion: boolean): Promise<void>;
}

interface Tokens {
  readonly cell: string;
  readonly fg: string;
  readonly accent: string;
  readonly superFg: string;
  tileBg(value: number): string;
}

const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** easeOutBack — лёгкий overshoot для появления плитки. */
const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Пульс слияния: масштаб 1 → 1.17 → 1. */
const pop = (t: number): number => 1 + 0.17 * Math.sin(Math.PI * t);

const digitFactor = (value: number): number => {
  const digits = String(value).length;
  if (digits <= 2) return 1;
  if (digits === 3) return 0.82;
  if (digits === 4) return 0.66;
  return 0.5;
};

/**
 * Рендерер игрового поля на canvas с движком анимаций на requestAnimationFrame.
 * Рисует пустые клетки и плитки; для хода проигрывает сдвиг, затем pop слияний и
 * появление новой плитки. Цвета берёт из тех же CSS-переменных, что и DOM.
 */
export class BoardRenderer implements BoardRendererLike {
  private readonly ctx: CanvasRenderingContext2D;
  private tiles: Tile[] = [];
  private sizeCss = 0;
  private raf = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context is not available');
    this.ctx = ctx;
  }

  /** Подгоняет буфер canvas под CSS-размер и плотность пикселей, затем перерисовывает. */
  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    this.sizeCss = rect.width;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawStatic(this.tiles);
  }

  /** Рисует поле в покое (без анимации). */
  drawStatic(tiles: Tile[]): void {
    this.cancel();
    this.tiles = tiles;
    const tokens = this.readTokens();
    this.clear();
    this.drawCells(tokens);
    for (const tile of tiles) this.drawTile(tile.value, tile.row, tile.col, 1, tokens);
  }

  /** Проигрывает ход: сдвиг → слияния/появление → покой. Промис резолвится по завершении. */
  animateMove(outcome: MoveOutcome, finalTiles: Tile[], reduceMotion: boolean): Promise<void> {
    if (reduceMotion) {
      this.drawStatic(finalTiles);
      return Promise.resolve();
    }
    const prev = this.tiles;
    const dest = new Map<number, Position>();
    for (const move of outcome.movements) dest.set(move.id, move.to);

    const merged = new Set(outcome.merges.map((m) => m.survivorId));
    const spawnedId = outcome.spawned?.id ?? -1;

    return this.animate(TIMING.slide, easeInOut, (k) => {
      const tokens = this.readTokens();
      this.clear();
      this.drawCells(tokens);
      for (const tile of prev) {
        const to = dest.get(tile.id) ?? { row: tile.row, col: tile.col };
        const row = tile.row + (to.row - tile.row) * k;
        const col = tile.col + (to.col - tile.col) * k;
        this.drawTile(tile.value, row, col, 1, tokens);
      }
    })
      .then(() => {
        this.tiles = finalTiles;
        return this.animate(
          TIMING.pop,
          (t) => t,
          (k) => {
            const tokens = this.readTokens();
            this.clear();
            this.drawCells(tokens);
            for (const tile of finalTiles) {
              let scale = 1;
              if (tile.id === spawnedId) scale = easeOutBack(k);
              else if (merged.has(tile.id)) scale = pop(k);
              this.drawTile(tile.value, tile.row, tile.col, scale, tokens);
            }
          },
        );
      })
      .then(() => this.drawStatic(finalTiles));
  }

  private animate(
    duration: number,
    ease: (t: number) => number,
    onFrame: (k: number) => void,
  ): Promise<void> {
    this.cancel();
    return new Promise((resolve) => {
      const start = performance.now();
      const step = (now: number): void => {
        const t = Math.min(1, (now - start) / duration);
        onFrame(ease(t));
        if (t < 1) {
          this.raf = requestAnimationFrame(step);
        } else {
          this.raf = 0;
          resolve();
        }
      };
      this.raf = requestAnimationFrame(step);
    });
  }

  private cancel(): void {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private geometry() {
    const size = this.sizeCss;
    const pad = size * GEOMETRY.padding;
    const gap = size * GEOMETRY.gutter;
    const cell = size * GEOMETRY.cell;
    return { pad, gap, cell, at: (index: number): number => pad + index * (cell + gap) };
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, this.sizeCss, this.sizeCss);
  }

  private drawCells(tokens: Tokens): void {
    const g = this.geometry();
    this.ctx.fillStyle = tokens.cell;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        this.roundedPath(g.at(col), g.at(row), g.cell, g.cell, GEOMETRY.radiusTile);
        this.ctx.fill();
      }
    }
  }

  private drawTile(value: number, row: number, col: number, scale: number, tokens: Tokens): void {
    const g = this.geometry();
    const cx = g.at(col) + g.cell / 2;
    const cy = g.at(row) + g.cell / 2;
    const drawSize = g.cell * scale;
    const x = cx - drawSize / 2;
    const y = cy - drawSize / 2;
    const ctx = this.ctx;

    ctx.save();
    this.applyShadow(value, g.cell, tokens.accent);
    ctx.fillStyle = tokens.tileBg(value);
    this.roundedPath(x, y, drawSize, drawSize, GEOMETRY.radiusTile * scale);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = value <= 4 ? tokens.fg : value > 2048 ? tokens.superFg : '#fff';
    if (value >= 8 && value <= 2048) {
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetY = 1;
    }
    const fontPx = g.cell * 0.42 * digitFactor(value) * scale;
    ctx.font = `700 ${fontPx}px 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), cx, cy + fontPx * 0.04);
    ctx.restore();
  }

  private applyShadow(value: number, cell: number, accent: string): void {
    const ctx = this.ctx;
    if (value >= 1024) {
      ctx.shadowColor = accent;
      ctx.shadowBlur = cell * 0.2;
      ctx.shadowOffsetY = cell * 0.06;
    } else if (value >= 128) {
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = cell * 0.1;
      ctx.shadowOffsetY = cell * 0.03;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.16)';
      ctx.shadowBlur = cell * 0.03;
      ctx.shadowOffsetY = cell * 0.012;
    }
  }

  private roundedPath(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  private readTokens(): Tokens {
    const styles = getComputedStyle(document.documentElement);
    const read = (name: string): string => styles.getPropertyValue(name).trim();
    return {
      cell: read('--cell'),
      fg: read('--fg'),
      accent: read('--accent'),
      superFg: read('--t-super-fg'),
      tileBg: (value: number): string =>
        value <= 2048 ? read(`--t${value}-bg`) : read('--t-super-bg'),
    };
  }
}

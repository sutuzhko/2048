import { vi } from 'vitest';

// jsdom не реализует matchMedia / ResizeObserver / rAF — даём безопасные заглушки,
// чтобы вью (GameView) монтировался в интеграционных тестах.
window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

globalThis.ResizeObserver = class {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};

globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number =>
  setTimeout(() => cb(performance.now()), 0) as unknown as number;
globalThis.cancelAnimationFrame = (id: number): void => clearTimeout(id);

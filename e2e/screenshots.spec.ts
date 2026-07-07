import { expect, type Page, test } from '@playwright/test';

/**
 * Генерирует свежие скриншоты для README. Не проверяет логику — это утилита:
 * `npx playwright test screenshots`. Основные кадры — в тёмной теме, светлая — один.
 */

const richBoard = (theme: 'light' | 'dark'): string =>
  JSON.stringify({
    tiles: [
      { id: 1, value: 2, row: 0, col: 0 },
      { id: 2, value: 4, row: 0, col: 1 },
      { id: 3, value: 8, row: 0, col: 2 },
      { id: 4, value: 16, row: 0, col: 3 },
      { id: 5, value: 32, row: 1, col: 0 },
      { id: 6, value: 64, row: 1, col: 1 },
      { id: 7, value: 128, row: 1, col: 2 },
      { id: 8, value: 256, row: 1, col: 3 },
      { id: 9, value: 512, row: 2, col: 1 },
      { id: 10, value: 1024, row: 2, col: 2 },
      { id: 11, value: 2, row: 3, col: 0 },
      { id: 12, value: 8, row: 3, col: 3 },
    ],
    nextId: 13,
    score: 6788,
    best: 9000,
    moves: 214,
    status: 'playing',
    theme,
    lang: 'ru',
  });

const seedWon = JSON.stringify({
  tiles: [
    { id: 1, value: 1024, row: 0, col: 0 },
    { id: 2, value: 2048, row: 0, col: 1 },
    { id: 3, value: 256, row: 1, col: 0 },
    { id: 4, value: 64, row: 1, col: 1 },
    { id: 5, value: 8, row: 2, col: 2 },
  ],
  nextId: 6,
  score: 20360,
  best: 20360,
  moves: 142,
  status: 'won',
  theme: 'dark',
  lang: 'ru',
});

const seedLost = JSON.stringify({
  tiles: [
    { id: 1, value: 2, row: 0, col: 0 },
    { id: 2, value: 4, row: 0, col: 1 },
    { id: 3, value: 2, row: 0, col: 2 },
    { id: 4, value: 4, row: 0, col: 3 },
    { id: 5, value: 4, row: 1, col: 0 },
    { id: 6, value: 2, row: 1, col: 1 },
    { id: 7, value: 8, row: 1, col: 2 },
    { id: 8, value: 2, row: 1, col: 3 },
    { id: 9, value: 2, row: 2, col: 0 },
    { id: 10, value: 4, row: 2, col: 1 },
    { id: 11, value: 2, row: 2, col: 2 },
    { id: 12, value: 4, row: 2, col: 3 },
    { id: 13, value: 4, row: 3, col: 0 },
    { id: 14, value: 2, row: 3, col: 1 },
    { id: 15, value: 4, row: 3, col: 2 },
    { id: 16, value: 8, row: 3, col: 3 },
  ],
  nextId: 17,
  score: 1234,
  best: 5000,
  moves: 88,
  status: 'lost',
  theme: 'dark',
  lang: 'ru',
});

const PAD = 40;

const shoot = async (page: Page, path: string): Promise<void> => {
  // Ждём загрузку шрифта, чтобы текст на скриншоте был финальным.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);

  // Снимаем область вокруг игры с отступом-рамкой (фон страницы), а не впритык к контенту.
  const box = await page.locator('.game').boundingBox();
  if (!box) throw new Error('.game не найдена');
  const viewport = page.viewportSize() ?? { width: 900, height: 1000 };
  const x = Math.max(0, box.x - PAD);
  const y = Math.max(0, box.y - PAD);
  await page.screenshot({
    path,
    clip: {
      x,
      y,
      width: Math.min(box.width + PAD * 2, viewport.width - x),
      height: Math.min(box.height + PAD * 2, viewport.height - y),
    },
  });
};

const seedAndShoot = async (page: Page, seed: string, path: string): Promise<void> => {
  await page.addInitScript((data) => localStorage.setItem('r2048v1', data), seed);
  await page.goto('/');
  await expect(page.locator('.board')).toBeVisible();
  await shoot(page, path);
};

test('README: игра (тёмная тема)', async ({ page }) => {
  await seedAndShoot(page, richBoard('dark'), 'docs/screenshot-play.png');
});

test('README: победа (тёмная тема)', async ({ page }) => {
  await seedAndShoot(page, seedWon, 'docs/screenshot-win.png');
});

test('README: поражение (тёмная тема)', async ({ page }) => {
  await seedAndShoot(page, seedLost, 'docs/screenshot-lose.png');
});

test('README: светлая тема', async ({ page }) => {
  await seedAndShoot(page, richBoard('light'), 'docs/screenshot-light.png');
});

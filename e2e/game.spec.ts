import { expect, test } from '@playwright/test';

const value = (n: number) => `.scores .panel:nth-child(${n}) .panel__value`;
const SCORE = value(1);
const MOVES = value(3);

const seedWon =
  '{"tiles":[{"id":1,"value":2048,"row":0,"col":0},{"id":2,"value":4,"row":0,"col":1},{"id":3,"value":2,"row":1,"col":0}],"nextId":4,"score":20360,"best":20360,"moves":142,"status":"won","theme":"light","lang":"ru"}';

const seedLost =
  '{"tiles":[{"id":1,"value":2,"row":0,"col":0},{"id":2,"value":4,"row":0,"col":1},{"id":3,"value":2,"row":0,"col":2},{"id":4,"value":4,"row":0,"col":3},{"id":5,"value":4,"row":1,"col":0},{"id":6,"value":2,"row":1,"col":1},{"id":7,"value":4,"row":1,"col":2},{"id":8,"value":2,"row":1,"col":3},{"id":9,"value":2,"row":2,"col":0},{"id":10,"value":4,"row":2,"col":1},{"id":11,"value":2,"row":2,"col":2},{"id":12,"value":4,"row":2,"col":3},{"id":13,"value":4,"row":3,"col":0},{"id":14,"value":2,"row":3,"col":1},{"id":15,"value":4,"row":3,"col":2},{"id":16,"value":8,"row":3,"col":3}],"nextId":17,"score":1234,"best":5000,"moves":88,"status":"lost","theme":"light","lang":"ru"}';

// Каждый тест Playwright получает изолированный контекст, поэтому localStorage
// уже пуст — отдельная очистка не нужна (и ломала бы проверку сохранения при reload).

test('новая игра: счёт и ходы на нуле', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(SCORE)).toHaveText('0');
  await expect(page.locator(MOVES)).toHaveText('0');
  await expect(page.locator('.board')).toBeVisible();
});

test('ход с клавиатуры увеличивает счётчик ходов', async ({ page }) => {
  await page.goto('/');
  for (const key of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(360);
  }
  const moves = Number(await page.locator(MOVES).textContent());
  expect(moves).toBeGreaterThan(0);
});

test('оверлей победы', async ({ page }) => {
  await page.addInitScript((data) => localStorage.setItem('r2048v1', data), seedWon);
  await page.goto('/');
  await expect(page.locator('.overlay--win')).toBeVisible();
  await expect(page.locator('.overlay--win .overlay__title')).toHaveText('Победа!');
});

test('оверлей поражения', async ({ page }) => {
  await page.addInitScript((data) => localStorage.setItem('r2048v1', data), seedLost);
  await page.goto('/');
  await expect(page.locator('.overlay--lose')).toBeVisible();
  await expect(page.locator('.overlay--lose .overlay__title')).toHaveText('Игра окончена');
});

test('тема сохраняется после перезагрузки', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-theme-option="dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('язык переключается на английский', async ({ page }) => {
  await page.goto('/');
  await page.locator('.seg__btn', { hasText: 'EN' }).click();
  await expect(page.locator('.brand__subtitle')).toHaveText('Join the tiles, get to 2048!');
});

test('быстрый спам управления не ломает игру', async ({ page }) => {
  await page.goto('/');
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press(keys[i % keys.length]);
  }
  await page.waitForTimeout(500);
  await expect(page.locator('.board')).toBeVisible();
  const score = Number(await page.locator(SCORE).textContent());
  const moves = Number(await page.locator(MOVES).textContent());
  expect(Number.isNaN(score)).toBe(false);
  expect(Number.isNaN(moves)).toBe(false);
});

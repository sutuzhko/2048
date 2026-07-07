// Записывает GIF-демо геймплея (тёмная тема) в docs/demo.gif.
// Требует запущенный dev-сервер (BASE_URL, по умолчанию http://localhost:5173) и ffmpeg.
// Запуск: node scripts/record-demo.mjs
import { chromium } from '@playwright/test';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const TMP = 'docs/.demo-tmp';
const OUT = 'docs/demo.gif';
const SIZE = { width: 540, height: 760 };

// Стартовая доска с парами — первые ходы дают наглядные слияния.
const layout = [
  [2, 2, 4, 8],
  [16, 16, 32, 64],
  [2, 4, null, null],
  [null, null, null, null],
];
const tiles = [];
let id = 1;
layout.forEach((rowValues, row) =>
  rowValues.forEach((value, col) => {
    if (value !== null) tiles.push({ id: id++, value, row, col });
  }),
);
const seed = JSON.stringify({
  tiles,
  nextId: id,
  score: 3000,
  best: 12000,
  moves: 180,
  status: 'playing',
  theme: 'dark',
  lang: 'ru',
});

const moves = [
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
  'ArrowUp',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
  'ArrowLeft',
  'ArrowDown',
  'ArrowUp',
  'ArrowRight',
  'ArrowLeft',
];

const run = async () => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: TMP, size: SIZE },
  });
  const page = await context.newPage();
  await page.addInitScript((data) => localStorage.setItem('r2048v1', data), seed);
  await page.goto(BASE_URL);
  await page.waitForSelector('.board');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);

  for (const key of moves) {
    await page.keyboard.press(key);
    await page.waitForTimeout(430);
  }
  await page.waitForTimeout(700);

  const video = page.video();
  await context.close();
  await browser.close();
  const src = await video.path();

  const filters =
    'fps=14,scale=460:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer';
  // -ss 1.2 отрезает вспышку загрузки (белый кадр до применения тёмной темы).
  execSync(`ffmpeg -y -ss 1.2 -i "${src}" -vf "${filters}" -loop 0 "${OUT}"`, { stdio: 'inherit' });
  rmSync(TMP, { recursive: true, force: true });
  console.log(`\n✓ ${OUT}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

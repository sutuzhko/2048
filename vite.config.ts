/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Относительные пути к ассетам — корректно работает на GitHub Pages в подпапке /2048/.
  base: './',
  build: {
    outDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
});

import './app/styles/tokens.css';
import './app/styles/base.css';
import './app/styles/game.css';
import { GameEngine } from './features/game';
import { GameView } from './features/game/ui';
import type { Lang, Theme } from './shared/types/game';

const mount = document.getElementById('root');
if (!mount) throw new Error('Root element #root not found');

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const defaults: { theme: Theme; lang: Lang } = {
  theme: prefersDark ? 'dark' : 'light',
  lang: 'ru',
};

const engine = new GameEngine(defaults);
new GameView(mount, engine);
engine.load();

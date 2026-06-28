import './styles.css';

import { Game } from './game';
import { draw } from './renderer';
import { updateHUD, showStageMessage, showGameOver, renderLeaderboard } from './ui';
import { CookieManager } from './cookieManager';
import type { Difficulty } from './types';

// --- DOM refs ---
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const inputEl = document.getElementById('answer-input') as HTMLInputElement;
const inputEcho = document.getElementById('input-echo') as HTMLElement;

// --- Canvas sizing ---
function resizeCanvas(): void {
  canvas.width = window.innerWidth > 600 ? 500 : window.innerWidth - 20;
  canvas.height = window.innerHeight > 800 ? 700 : window.innerHeight - 40;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Game instance ---
const game = new Game(canvas, {
  onHUDUpdate: () => updateHUD(game),
  onFinishStage: (success) => showStageMessage(game, success),
  onGameOver: () => showGameOver(game),
  onShake: () => {
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 500);
  },
});

// --- Game loop ---
let lastTime = 0;
function loop(timestamp: number): void {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  if (game.state === 'playing') {
    game.update(dt);
  }
  draw(ctx, canvas, game);
  requestAnimationFrame(loop);
}

// --- Start game ---
function startGame(diff: Difficulty): void {
  game.difficulty = diff;
  game.reset();
  game.state = 'playing';
  game.lastSpawn = Date.now();

  document.getElementById('start-screen')!.classList.add('hidden');
  document.getElementById('hud')!.classList.remove('hidden');
  inputEcho.classList.remove('hidden');
  (document.getElementById('diff-display') as HTMLElement).innerText = diff;

  updateHUD(game);
  inputEl.focus();

  inputEl.addEventListener('blur', () => {
    if (game.state === 'playing') setTimeout(() => inputEl.focus(), 10);
  });

  requestAnimationFrame(loop);
}

// --- Button wiring (replaces inline onclick attributes) ---
document.getElementById('btn-child')!.addEventListener('click', () => startGame('child'));
document.getElementById('btn-student')!.addEventListener('click', () => startGame('student'));
document.getElementById('btn-adult')!.addEventListener('click', () => startGame('adult'));

document.getElementById('tab-child')!.addEventListener('click', () => renderLeaderboard('child'));
document.getElementById('tab-student')!.addEventListener('click', () => renderLeaderboard('student'));
document.getElementById('tab-adult')!.addEventListener('click', () => renderLeaderboard('adult'));

document.getElementById('msg-btn')!.addEventListener('click', () => {
  document.getElementById('message-overlay')!.classList.add('hidden');
  game.resumeFromMessage();
  if (game.state === 'playing') inputEl.focus();
});

document.getElementById('btn-exit-no-save')!.addEventListener('click', () => location.reload());

document.getElementById('btn-save-reset')!.addEventListener('click', () => {
  const name = (document.getElementById('player-name') as HTMLInputElement).value.trim() || 'Anonymous';
  CookieManager.saveScore(name, game.score, game.finalPerfScore, game.difficulty);
  location.reload();
});

// --- Keyboard input ---
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (game.state === 'playing' || game.state === 'message') {
      location.reload();
    }
    return;
  }

  if (game.state !== 'playing') return;

  if (e.key === 'Backspace') {
    game.inputBuffer = game.inputBuffer.slice(0, -1);
    updateHUD(game);
    return;
  }

  if ((e.key >= '0' && e.key <= '9') || e.key === '-') {
    if (game.inputBuffer.length < 5) {
      game.inputBuffer += e.key;
      updateHUD(game);
    }
    return;
  }

  if (e.key === 'Enter' && game.inputBuffer.length > 0) {
    game.checkAnswer();
  }
});

// --- Init leaderboard on start screen ---
renderLeaderboard('child');

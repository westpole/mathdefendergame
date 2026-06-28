import type { Game } from './game';
import { GAME_CONFIG } from './config';
import { CookieManager } from './cookieManager';

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function updateHUD(game: Game): void {
  el('score-display').innerText = String(game.score);
  el('stage-display').innerText = String(game.stage);
  el('stage-score-display').innerText = String(game.stageScore);
  el('input-echo').innerText = game.inputBuffer;

  const livesText = el('lives-text');
  const barFill = el('life-bar-fill');

  livesText.innerText = String(game.lives);
  const percentage = Math.min(100, (game.lives / GAME_CONFIG.initialLives) * 100);
  barFill.style.width = `${percentage}%`;

  if (game.lives > 6) barFill.className = 'h-full bg-green-500 transition-all duration-300';
  else if (game.lives > 3) barFill.className = 'h-full bg-yellow-500 transition-all duration-300';
  else barFill.className = 'h-full bg-red-500 transition-all duration-300';

  // Shield blocks
  const shieldContainer = el('shield-display');
  shieldContainer.innerHTML = '';
  for (let i = 0; i < GAME_CONFIG.stageShieldMax; i++) {
    const div = document.createElement('div');
    div.className = `w-4 h-6 rounded-sm ${i < game.shield ? 'bg-blue-400' : 'bg-gray-700'}`;
    shieldContainer.appendChild(div);
  }
}

export function showStageMessage(game: Game, success: boolean): void {
  const overlay = el('message-overlay');
  const title = el('msg-title');
  const stats = el('msg-stats');
  const visual = el('msg-visual');

  overlay.classList.remove('hidden');

  if (success) {
    // game.stage still holds the cleared stage number (incremented after this call)
    const bonusMsg = game.stageIncorrect === 0
      ? "<div class='text-green-400 font-bold mt-2'>Perfect! +1 Life!</div>"
      : '';

    title.innerText = `STAGE ${game.stage} CLEARED!`;
    title.className = 'text-4xl mb-4 font-bold pixel-font text-green-400';
    stats.innerHTML = `Score: ${game.score}<br>Lives: ${game.lives}${bonusMsg}`;
    visual.innerText = '🎉';
  } else {
    title.innerText = 'BASE DESTROYED';
    title.className = 'text-4xl mb-4 font-bold pixel-font text-red-500';
    stats.innerHTML = `You lost 1 Life to retry.<br>Remaining Lives: ${game.lives}`;
    visual.innerText = '💥';
  }
}

export function showGameOver(game: Game): void {
  el('message-overlay').classList.add('hidden');
  el('game-over-screen').classList.remove('hidden');

  el('end-diff').innerText = game.difficulty;
  el('end-score').innerText = String(game.score);
  el('end-correct').innerText = String(game.correctCount);
  el('end-incorrect').innerText = String(game.incorrectCount);
  el('end-perf').innerText = `${game.finalPerfScore.toFixed(2)}% (Acc)`;
}

export function renderLeaderboard(diff: string): void {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  el(`tab-${diff}`).classList.add('active');

  const list = el('leaderboard-list');
  const scores = CookieManager.getScores(diff);

  if (scores.length === 0) {
    list.innerHTML = "<p class='text-gray-500 p-2'>No scores yet.</p>";
    return;
  }

  let html = "<table class='w-full'><tr><th class='pb-2'>Name</th><th class='pb-2'>Score</th><th class='pb-2'>Acc%</th></tr>";
  scores.forEach(s => {
    html += `<tr class="border-b border-gray-800 last:border-0">
            <td class='py-1 truncate max-w-[80px] text-gray-300'>${escapeHtml(s.name)}</td>
            <td class='py-1 text-yellow-400'>${s.score}</td>
            <td class='py-1 text-blue-300'>${s.perfScore}%</td>
        </tr>`;
  });
  html += '</table>';
  list.innerHTML = html;
}

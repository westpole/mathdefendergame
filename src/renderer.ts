import type { Game } from './game';
import { GAME_CONFIG } from './config';

export function draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, game: Game): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Base station
  ctx.fillStyle = '#444';
  ctx.fillRect(canvas.width / 2 - 30, canvas.height - 40, 60, 40);
  ctx.fillStyle = '#666';
  ctx.fillRect(canvas.width / 2 - 10, canvas.height - 60, 20, 20);

  // Danger line
  const dangerY = canvas.height - GAME_CONFIG.dangerZone;
  ctx.beginPath();
  ctx.moveTo(0, dangerY);
  ctx.lineTo(canvas.width, dangerY);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Meteors
  ctx.font = '600 24px Roboto';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  game.meteors.forEach(m => {
    const color = GAME_CONFIG.colors[m.op] ?? '#fff';

    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = color;
    ctx.fillText(m.text, m.x, m.y);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  });

  // Particles
  game.particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1.0;
}

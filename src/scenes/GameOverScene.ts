import Phaser from 'phaser';
import { CookieManager } from '../cookieManager';
import type { Difficulty, ScoreEntry } from '../types';

interface GameOverData {
  difficulty: Difficulty;
  score: number;
  correctCount: number;
  incorrectCount: number;
  finalPerfScore: number;
}

function escapeText(str: string): string {
  return str.replace(/[<>&"']/g, c =>
    ({ '<': '‹', '>': '›', '&': '&', '"': '"', "'": "'" }[c] ?? c)
  );
}

export class GameOverScene extends Phaser.Scene {
  private gameData!: GameOverData;
  private activeTab = 'child';
  private leaderboardTexts: Phaser.GameObjects.Text[] = [];
  private tabRects: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private nameInput!: HTMLInputElement;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.gameData = data;
    this.activeTab = data.difficulty;
  }

  create(): void {
    this.nameInput = document.getElementById('name-input') as HTMLInputElement;

    // ── Title ─────────────────────────────────────────────────────────────────
    this.add.text(250, 30, 'GAME OVER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '28px',
      color: '#ef4444',
    }).setOrigin(0.5, 0);

    // ── Stats panel ───────────────────────────────────────────────────────────
    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(0x1f2937, 1);
    panelGfx.fillRoundedRect(30, 90, 440, 170, 12);
    panelGfx.lineStyle(2, 0xef4444, 1);
    panelGfx.strokeRoundedRect(30, 90, 440, 170, 12);

    const { difficulty, score, correctCount, incorrectCount, finalPerfScore } = this.gameData;
    const stats: [string, string, string][] = [
      ['Difficulty:',  difficulty,                 '#ffffff'],
      ['Total Score:', String(score),              '#facc15'],
      ['Correct:',     String(correctCount),        '#4ade80'],
      ['Incorrect:',   String(incorrectCount),      '#f87171'],
      ['Accuracy:',    `${finalPerfScore.toFixed(2)}%`, '#93c5fd'],
    ];

    const labelX = 60, valX = 440;
    stats.forEach(([label, value, color], i) => {
      const y = 110 + i * 30;
      this.add.text(labelX, y, label, { fontFamily: 'Roboto', fontSize: '15px', color: '#9ca3af' });
      this.add.text(valX, y, value, { fontFamily: 'Roboto', fontSize: '15px', fontStyle: 'bold', color }).setOrigin(1, 0);
    });

    // ── Name label ────────────────────────────────────────────────────────────
    this.add.text(250, 272, 'Enter Name for Leaderboard:', {
      fontFamily: 'Roboto',
      fontSize: '13px',
      color: '#9ca3af',
    }).setOrigin(0.5, 0);

    this.showNameInput();

    // ── Action buttons ────────────────────────────────────────────────────────
    this.createButton(125, 316, 190, 40, 'MENU (No Save)', 0x4b5563, 0x6b7280, () => {
      this.hideNameInput();
      this.scene.start('MainMenuScene');
    });

    this.createButton(375, 316, 190, 40, 'SAVE & MENU', 0xd97706, 0xf59e0b, () => {
      const name = this.nameInput.value.trim() || 'Anonymous';
      CookieManager.saveScore(name, score, finalPerfScore, difficulty);
      this.hideNameInput();
      this.scene.start('MainMenuScene');
    });

    // ── Leaderboard ───────────────────────────────────────────────────────────
    const divGfx = this.add.graphics();
    divGfx.lineStyle(1, 0x374151, 1);
    divGfx.lineBetween(30, 348, 470, 348);

    this.add.text(250, 355, 'HIGH SCORES', {
      fontFamily: 'Roboto',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#fef08a',
    }).setOrigin(0.5, 0);

    // Tabs
    const tabs = ['child', 'student', 'adult'];
    const tabLabels = ['Child', 'Student', 'Adult'];
    const tabW = 70, tabH = 22, tabStartX = 113;

    tabs.forEach((tab, i) => {
      const tx = tabStartX + i * (tabW + 4);
      const isActive = tab === this.activeTab;
      const rect = this.add.rectangle(tx, 380, tabW, tabH, isActive ? 0x2563eb : 0x374151)
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });

      this.tabRects.set(tab, rect);

      this.add.text(tx + tabW / 2, 380, tabLabels[i], {
        fontFamily: 'Roboto',
        fontSize: '11px',
        color: isActive ? '#ffffff' : '#9ca3af',
      }).setOrigin(0.5, 0.5).setName(`go-tab-label-${tab}`);

      rect.on('pointerdown', () => this.renderLeaderboard(tab));
      rect.on('pointerover', () => { if (tab !== this.activeTab) rect.setFillStyle(0x4b5563); });
      rect.on('pointerout',  () => { if (tab !== this.activeTab) rect.setFillStyle(0x374151); });
    });

    // Leaderboard bg
    this.add.rectangle(250, 555, 440, 310, 0x111827).setOrigin(0.5, 0.5);

    this.renderLeaderboard(this.activeTab);
  }

  private createButton(
    x: number, y: number, w: number, h: number,
    label: string, color: number, hoverColor: number,
    callback: () => void,
  ): void {
    const bg = this.add.rectangle(x, y, w, h, color)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'Roboto',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);
    bg.on('pointerdown', callback);
    bg.on('pointerover', () => bg.setFillStyle(hoverColor));
    bg.on('pointerout',  () => bg.setFillStyle(color));
  }

  private renderLeaderboard(diff: string): void {
    this.activeTab = diff;

    this.tabRects.forEach((rect, key) => {
      rect.setFillStyle(key === diff ? 0x2563eb : 0x374151);
    });
    ['child', 'student', 'adult'].forEach(tab => {
      const lbl = this.children.getByName(`go-tab-label-${tab}`) as Phaser.GameObjects.Text | null;
      if (lbl) lbl.setColor(tab === diff ? '#ffffff' : '#9ca3af');
    });

    this.leaderboardTexts.forEach(t => t.destroy());
    this.leaderboardTexts = [];

    const scores: ScoreEntry[] = CookieManager.getScores(diff);
    if (scores.length === 0) {
      const t = this.add.text(250, 415, 'No scores yet.', {
        fontFamily: 'Roboto', fontSize: '12px', color: '#6b7280',
      }).setOrigin(0.5, 0);
      this.leaderboardTexts.push(t);
      return;
    }

    const hName  = this.add.text(40,  404, 'Name',  { fontFamily: 'Roboto', fontSize: '11px', color: '#6b7280' });
    const hScore = this.add.text(310, 404, 'Score', { fontFamily: 'Roboto', fontSize: '11px', color: '#6b7280' }).setOrigin(0.5, 0);
    const hAcc   = this.add.text(420, 404, 'Acc%',  { fontFamily: 'Roboto', fontSize: '11px', color: '#6b7280' }).setOrigin(0.5, 0);
    this.leaderboardTexts.push(hName, hScore, hAcc);

    scores.slice(0, 14).forEach((s, i) => {
      const y = 420 + i * 19;
      const n = this.add.text(40,  y, escapeText(s.name).slice(0, 12), { fontFamily: 'Roboto', fontSize: '12px', color: '#d1d5db' });
      const sc = this.add.text(310, y, String(s.score),                 { fontFamily: 'Roboto', fontSize: '12px', color: '#facc15' }).setOrigin(0.5, 0);
      const ac = this.add.text(420, y, `${s.perfScore}%`,               { fontFamily: 'Roboto', fontSize: '12px', color: '#93c5fd' }).setOrigin(0.5, 0);
      this.leaderboardTexts.push(n, sc, ac);
    });
  }

  private showNameInput(): void {
    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();
    this.nameInput.style.top  = `${rect.top + rect.height * 0.393}px`;
    this.nameInput.style.left = `${rect.left + rect.width / 2}px`;
    this.nameInput.style.transform = 'translateX(-50%)';
    this.nameInput.style.display = 'block';
    this.nameInput.value = '';
    this.nameInput.focus();
  }

  private hideNameInput(): void {
    this.nameInput.style.display = 'none';
    this.nameInput.value = '';
  }

  shutdown(): void {
    this.hideNameInput();
  }
}

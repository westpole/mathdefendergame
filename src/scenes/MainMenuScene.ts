import Phaser from 'phaser';
import { CookieManager } from '../cookieManager';
import type { ScoreEntry } from '../types';

function escapeText(str: string): string {
  return str.replace(/[<>&"']/g, c =>
    ({ '<': '‹', '>': '›', '&': '&', '"': '"', "'": "'" }[c] ?? c)
  );
}

export class MainMenuScene extends Phaser.Scene {
  private leaderboardTexts: Phaser.GameObjects.Text[] = [];
  private tabRects: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private activeTab = 'child';

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    // ── Background panel ──────────────────────────────────────────────────────
    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(0x1e2235, 1);
    panelGfx.fillRoundedRect(10, 90, 480, 600, 14);
    panelGfx.lineStyle(1, 0x374151, 1);
    panelGfx.strokeRoundedRect(10, 90, 480, 600, 14);

    // ── Title ─────────────────────────────────────────────────────────────────
    this.add.text(250, 45, 'MATH\nDEFENDER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '28px',
      color: '#facc15',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5, 0.5);

    // ── "Select Difficulty" label ─────────────────────────────────────────────
    this.add.text(250, 115, 'Select Difficulty', {
      fontFamily: 'Roboto',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0);

    // ── Difficulty buttons ────────────────────────────────────────────────────
    const diffs: { key: string; label: string; color: number; hover: number }[] = [
      { key: 'child',   label: 'Child',   color: 0x16a34a, hover: 0x15803d },
      { key: 'student', label: 'Student', color: 0x1d4ed8, hover: 0x1e40af },
      { key: 'adult',   label: 'Adult',   color: 0xb91c1c, hover: 0x991b1b },
    ];

    const btnPositions = [130, 250, 370];
    diffs.forEach((d, i) => {
      this.createButton(btnPositions[i], 163, 105, 38, d.label, d.color, d.hover, () => {
        this.scene.start('GameScene', { difficulty: d.key });
      });
    });

    // ── Horizontal divider ────────────────────────────────────────────────────
    const divGfx = this.add.graphics();
    divGfx.lineStyle(1, 0x374151, 1);
    divGfx.lineBetween(25, 205, 475, 205);

    // ── Left column: Rules ────────────────────────────────────────────────────
    this.add.text(25, 215, 'RULES', {
      fontFamily: 'Roboto',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#fef08a',
    });

    const rules = [
      'Type answer + ENTER.',
      'ESC to exit game.',
      '10 total lives (retries).',
      'Protect the Base (5 hits max).',
      'Base destroyed = -1 Life.',
      'Perfect stage = +1 Life.',
      'Stages 1-28, ops: + - × ÷',
    ];

    rules.forEach((rule, i) => {
      this.add.text(25, 235 + i * 22, `• ${rule}`, {
        fontFamily: 'Roboto',
        fontSize: '12px',
        color: '#9ca3af',
        wordWrap: { width: 200 },
      });
    });

    // ── Right column: Leaderboard ─────────────────────────────────────────────
    this.add.text(265, 215, 'HIGH SCORES', {
      fontFamily: 'Roboto',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#fef08a',
    });

    // Tab buttons
    const tabs = ['child', 'student', 'adult'];
    const tabLabels = ['Child', 'Student', 'Adult'];
    const tabStartX = 265;
    const tabW = 70, tabH = 22;

    tabs.forEach((tab, i) => {
      const tx = tabStartX + i * (tabW + 3);
      const isActive = tab === this.activeTab;
      const rect = this.add.rectangle(tx, 245, tabW, tabH, isActive ? 0x2563eb : 0x374151)
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });

      this.tabRects.set(tab, rect);

      this.add.text(tx + tabW / 2, 245, tabLabels[i], {
        fontFamily: 'Roboto',
        fontSize: '11px',
        color: isActive ? '#ffffff' : '#9ca3af',
      }).setOrigin(0.5, 0.5).setName(`tab-label-${tab}`);

      rect.on('pointerdown', () => this.renderLeaderboard(tab));
      rect.on('pointerover', () => { if (tab !== this.activeTab) rect.setFillStyle(0x4b5563); });
      rect.on('pointerout',  () => { if (tab !== this.activeTab) rect.setFillStyle(0x374151); });
    });

    // Leaderboard background
    this.add.rectangle(370, 440, 220, 360, 0x111827).setOrigin(0.5, 0.5);

    this.renderLeaderboard('child');
  }

  private createButton(
    x: number, y: number, w: number, h: number,
    label: string, color: number, hoverColor: number,
    callback: () => void
  ): void {
    const bg = this.add.rectangle(x, y, w, h, color)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontFamily: 'Roboto',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    bg.on('pointerdown', callback);
    bg.on('pointerover', () => bg.setFillStyle(hoverColor));
    bg.on('pointerout',  () => bg.setFillStyle(color));
  }

  private renderLeaderboard(diff: string): void {
    this.activeTab = diff;

    // Update tab highlight
    this.tabRects.forEach((rect, key) => {
      rect.setFillStyle(key === diff ? 0x2563eb : 0x374151);
    });

    // Update tab label colors
    ['child', 'student', 'adult'].forEach(tab => {
      const lbl = this.children.getByName(`tab-label-${tab}`) as Phaser.GameObjects.Text | null;
      if (lbl) lbl.setColor(tab === diff ? '#ffffff' : '#9ca3af');
    });

    // Clear previous leaderboard rows
    this.leaderboardTexts.forEach(t => t.destroy());
    this.leaderboardTexts = [];

    const scores: ScoreEntry[] = CookieManager.getScores(diff);

    if (scores.length === 0) {
      const t = this.add.text(370, 290, 'No scores yet.', {
        fontFamily: 'Roboto',
        fontSize: '12px',
        color: '#6b7280',
      }).setOrigin(0.5, 0);
      this.leaderboardTexts.push(t);
      return;
    }

    // Header
    const headerName  = this.add.text(268, 265, 'Name',  { fontFamily: 'Roboto', fontSize: '11px', color: '#6b7280' });
    const headerScore = this.add.text(420, 265, 'Score', { fontFamily: 'Roboto', fontSize: '11px', color: '#6b7280' }).setOrigin(0.5, 0);
    const headerAcc   = this.add.text(475, 265, 'Acc%',  { fontFamily: 'Roboto', fontSize: '11px', color: '#6b7280' }).setOrigin(0.5, 0);
    this.leaderboardTexts.push(headerName, headerScore, headerAcc);

    scores.slice(0, 10).forEach((s, i) => {
      const y = 282 + i * 19;
      const name  = this.add.text(268, y, escapeText(s.name).slice(0, 10), { fontFamily: 'Roboto', fontSize: '12px', color: '#d1d5db' });
      const score = this.add.text(420, y, String(s.score),                  { fontFamily: 'Roboto', fontSize: '12px', color: '#facc15' }).setOrigin(0.5, 0);
      const acc   = this.add.text(475, y, `${s.perfScore}%`,                { fontFamily: 'Roboto', fontSize: '12px', color: '#93c5fd' }).setOrigin(0.5, 0);
      this.leaderboardTexts.push(name, score, acc);
    });
  }
}

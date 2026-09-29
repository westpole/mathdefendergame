/* eslint-env node */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptDir, '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const instructionsPath = path.join(repoRoot, '.github', 'copilot-instructions.md');

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function semverMajor(range) {
  const match = String(range).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function getPackageVersion(packageJson, packageName) {
  return packageJson.dependencies?.[packageName] ?? packageJson.devDependencies?.[packageName] ?? null;
}

function formatStack(packageJson) {
  const phaser = semverMajor(getPackageVersion(packageJson, 'phaser'));
  const react = semverMajor(getPackageVersion(packageJson, 'react'));
  const zustand = semverMajor(getPackageVersion(packageJson, 'zustand'));
  const vite = semverMajor(getPackageVersion(packageJson, 'vite'));
  const electron = semverMajor(getPackageVersion(packageJson, 'electron'));
  const storybook = semverMajor(getPackageVersion(packageJson, 'storybook'));
  const vitest = semverMajor(getPackageVersion(packageJson, 'vitest'));

  const missingPackages = [
    ['phaser', phaser],
    ['react', react],
    ['zustand', zustand],
    ['vite', vite],
    ['electron', electron],
    ['storybook', storybook],
    ['vitest', vitest],
  ]
    .filter(([, major]) => major === null)
    .map(([name]) => name);

  if (missingPackages.length > 0) {
    throw new Error(`Unable to sync Current Stack because package.json is missing: ${missingPackages.join(', ')}`);
  }

  return [
    `- Phaser ${phaser} for gameplay rendering.`,
    `- React ${react} for DOM overlays.`,
    `- Zustand ${zustand} for shared UI state and persisted leaderboard data.`,
    `- Vite ${vite} + TypeScript for the renderer build.`,
    `- Electron ${electron} for the desktop wrapper.`,
    `- Storybook ${storybook} and Vitest ${vitest} for component work and testing.`,
  ].join('\n');
}

function syncCurrentStack(instructionsText, stackText) {
  const pattern = /## Current Stack\n\n([\s\S]*?)\n## Code Ownership/;
  const replacement = `## Current Stack\n\n${stackText}\n\n## Code Ownership`;

  if (!pattern.test(instructionsText)) {
    throw new Error('Unable to find the Current Stack section in .github/copilot-instructions.md');
  }

  return instructionsText.replace(pattern, replacement);
}

const packageJson = readJson(packageJsonPath);
const instructionsText = readFileSync(instructionsPath, 'utf8');
const stackText = formatStack(packageJson);
const updatedInstructionsText = syncCurrentStack(instructionsText, stackText);

if (updatedInstructionsText === instructionsText) {
  process.stdout.write('Current Stack is already synchronized.\n');
  process.exit(0);
}

if (checkOnly) {
  process.stdout.write('Current Stack is out of date. Run `node scripts/sync-current-stack.mjs` to update it.\n');
  process.exit(1);
}

writeFileSync(instructionsPath, updatedInstructionsText);
process.stdout.write('Updated .github/copilot-instructions.md Current Stack section.\n');

/* eslint-env node */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptDir, '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const instructionsPaths = [
  path.join(repoRoot, '.github', 'copilot-instructions.md'),
  path.join(repoRoot, 'CLAUDE.md'),
];

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

function syncCurrentStack(instructionsText, stackText, relativePath) {
  // Files may be checked out with CRLF (core.autocrlf), so match either line ending and preserve it.
  const eol = instructionsText.includes('\r\n') ? '\r\n' : '\n';
  const pattern = /## Current Stack\r?\n\r?\n([\s\S]*?)\r?\n## Code Ownership/;
  const replacement = ['## Current Stack', '', stackText.split('\n').join(eol), '', '## Code Ownership'].join(eol);

  if (!pattern.test(instructionsText)) {
    throw new Error(`Unable to find the Current Stack section in ${relativePath}`);
  }

  return instructionsText.replace(pattern, replacement);
}

const packageJson = readJson(packageJsonPath);
const stackText = formatStack(packageJson);
let isOutdated = false;

for (const instructionsPath of instructionsPaths) {
  const relativePath = path.relative(repoRoot, instructionsPath);
  const instructionsText = readFileSync(instructionsPath, 'utf8');
  const updatedInstructionsText = syncCurrentStack(instructionsText, stackText, relativePath);

  if (updatedInstructionsText === instructionsText) {
    process.stdout.write(`Current Stack is already synchronized in ${relativePath}.\n`);
    continue;
  }

  if (checkOnly) {
    process.stdout.write(`Current Stack is out of date in ${relativePath}. Run \`node tools/sync-current-stack.mjs\` to update it.\n`);
    isOutdated = true;
    continue;
  }

  writeFileSync(instructionsPath, updatedInstructionsText);
  process.stdout.write(`Updated ${relativePath} Current Stack section.\n`);
}

if (isOutdated) {
  process.exit(1);
}

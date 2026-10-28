#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const skillRoot = path.join(root, '.github', 'skills');
const SKILL_KEYWORDS = new Map([
  ['phaser-expert', ['phaser', 'scene', 'gameplay', 'input', 'enemy', 'wave', 'keyboard', 'pointer']],
  ['react-frontend-expert', ['react', 'ui', 'overlay', 'hud', 'menu', 'start screen', 'game over', 'layout']],
  ['storybook-expert', ['storybook', 'stories', 'component', 'preview', 'controls', 'state', 'fixture']],
  ['electron-expert', ['electron', 'window', 'menu', 'desktop', 'app lifecycle', 'close', 'ipc']],
  ['coverage-analysis', ['coverage', 'vitest', 'test', 'uncovered', 'branch', 'assertion', 'coverage report']],
  ['release-workflow', ['release', 'version bump', 'changelog', 'tag', 'build', 'production', 'preflight']],
  ['zustand-unit-tests', ['zustand', 'store', 'persist', 'localstorage', 'leaderboard', 'state', 'action']],
  ['file-organization', ['organize', 'types', 'constants', 'utilities', 'refactor', 'structure', 'layout']],
  ['e2e-test-expert', ['playwright', 'e2e', 'browser', 'smoke', 'integration', 'visual', 'scenario']],
  ['electron-unit-tests', ['electron', 'vitest', 'unit', 'main process', 'preload', 'ipc']],
  ['phaser-unit-tests', ['phaser', 'scene', 'vitest', 'unit', 'game loop', 'state', 'collision']],
  ['react-unit-tests', ['react', 'vitest', 'component', 'render', 'testing library', 'hook']],
]);

function normalize(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function findSkillFiles(targets = []) {
  if (targets.length > 0) {
    return targets
      .map((target) => path.resolve(root, target))
      .filter((file) => file.includes(`${path.sep}.github${path.sep}skills${path.sep}`) && file.endsWith('SKILL.md'))
      .filter((file, index, array) => array.indexOf(file) === index);
  }

  const files = [];
  if (!fs.existsSync(skillRoot)) return files;

  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name === 'SKILL.md') {
        files.push(fullPath);
      }
    }
  };

  walk(skillRoot);
  return files;
}

function getChangedSkillFiles() {
  const explicitTargets = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  if (explicitTargets.length > 0) {
    return findSkillFiles(explicitTargets);
  }

  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();

    if (!output) return [];
    return findSkillFiles(output.split(/\r?\n/).filter(Boolean));
  } catch {
    return findSkillFiles();
  }
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return { frontmatter: '', body: content };
  }

  return {
    frontmatter: match[1],
    body: content.slice(match[0].length),
  };
}

function getFrontmatterValue(frontmatter, key) {
  const line = frontmatter
    .split(/\r?\n/)
    .find((candidate) => candidate.trimStart().startsWith(`${key}:`));

  if (!line) return '';
  return line.slice(key.length + 1).trim().replace(/^['"]|['"]$/g, '');
}

function validateSkillFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const { frontmatter, body } = parseFrontmatter(content);
  const errors = [];

  if (!frontmatter.trim()) {
    errors.push('missing YAML frontmatter');
    return { file, errors };
  }

  const name = getFrontmatterValue(frontmatter, 'name');
  const description = getFrontmatterValue(frontmatter, 'description');

  if (!name) errors.push('missing name in frontmatter');
  if (!description) errors.push('missing description in frontmatter');

  const text = `${frontmatter}\n${body}`.toLowerCase();
  const triggerPatterns = [
    'use this skill when',
    'use when',
    'when to use this skill',
    'do not use this skill',
  ];

  const hasTriggerPattern = triggerPatterns.some((pattern) => text.includes(pattern));
  if (!hasTriggerPattern) {
    errors.push('description does not clearly define when to use the skill');
  }

  const keywords = SKILL_KEYWORDS.get(name) || [];
  const matchedKeywords = keywords.filter((keyword) => normalize(text).includes(normalize(keyword)));
  if (keywords.length > 0 && matchedKeywords.length === 0) {
    errors.push(`description does not reference expected skill keywords (${keywords.slice(0, 4).join(', ')})`);
  }

  const filePath = path.relative(root, file);
  const referencedAssets = [...body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const asset of referencedAssets) {
    if (!asset.startsWith('http') && !asset.startsWith('#')) {
      const resolvedAsset = path.resolve(path.dirname(file), asset);
      if (!fs.existsSync(resolvedAsset)) {
        errors.push(`referenced asset missing: ${asset}`);
      }
    }
  }

  return { file, filePath, errors };
}

const targetFiles = getChangedSkillFiles();
if (targetFiles.length === 0) {
  console.log('No skill files changed; skipping skill smoke test.');
  process.exit(0);
}

const results = targetFiles.map(validateSkillFile);
const failed = results.filter((result) => result.errors.length > 0);

if (failed.length > 0) {
  console.error('Skill smoke test failed:\n');
  for (const result of failed) {
    console.error(`- ${result.filePath}`);
    for (const error of result.errors) {
      console.error(`  • ${error}`);
    }
  }
  process.exit(1);
}

console.log(`Skill smoke test passed for ${targetFiles.length} changed skill file(s).`);

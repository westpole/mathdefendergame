#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const benchmarkDir = path.join(root, 'benchmark', 'skills');
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

function loadSkillMetadata() {
  const skills = new Map();
  const skillRoot = path.join(root, '.github', 'skills');
  if (!fs.existsSync(skillRoot)) return skills;

  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name === 'SKILL.md') {
        const content = fs.readFileSync(fullPath, 'utf8');
        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        const frontmatter = match ? match[1] : '';
        const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
        const name = nameMatch ? nameMatch[1].replace(/^['"]|['"]$/g, '').trim() : path.basename(path.dirname(fullPath));
        const description = (frontmatter.match(/^description:\s*(.+)$/m) || [])[1] || '';
        const sourceText = normalize(`${name} ${description} ${content}`);
        skills.set(name, sourceText);
      }
    }
  };

  walk(skillRoot);
  return skills;
}

function listBenchmarkFiles() {
  if (!fs.existsSync(benchmarkDir)) return [];
  return fs.readdirSync(benchmarkDir)
    .filter((file) => file.endsWith('.json'))
    .sort();
}

function promptMatchesSkill(prompt, skillName) {
  const promptText = normalize(prompt);
  const keywords = SKILL_KEYWORDS.get(skillName) || [];
  const hits = keywords.filter((keyword) => promptText.includes(normalize(keyword)));
  return hits.length >= 2;
}

function evaluateCase(entry, skillTextByName) {
  const prompt = normalize(entry.prompt || '');
  const expectedSkill = entry.expectedSkill || null;

  if (expectedSkill) {
    const expectedKeywords = SKILL_KEYWORDS.get(expectedSkill) || [];
    const expectedHits = expectedKeywords.filter((keyword) => prompt.includes(normalize(keyword)));
    const conflictingSkills = [...skillTextByName.entries()].filter(([skillName]) => skillName !== expectedSkill && skillTextByName.get(skillName).includes(prompt)).length;
    return {
      pass: expectedHits.length >= 2 && conflictingSkills === 0,
      expectedSkill,
      hits: expectedHits,
    };
  }

  const matchedSkill = [...skillTextByName.entries()].find(([skillName]) => promptMatchesSkill(entry.prompt, skillName));
  return {
    pass: !matchedSkill,
    expectedSkill: null,
    hits: matchedSkill ? [matchedSkill[0]] : [],
  };
}

const files = listBenchmarkFiles();
if (files.length === 0) {
  console.log('No benchmark files found under benchmark/skills; skipping benchmark.');
  process.exit(0);
}

const skillTextByName = loadSkillMetadata();
const cases = [];
for (const file of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(benchmarkDir, file), 'utf8'));
  if (!Array.isArray(raw)) {
    throw new Error(`Benchmark file ${file} must contain an array.`);
  }
  cases.push(...raw.map((entry) => ({ ...entry, source: file })));
}

const failures = [];
for (const entry of cases) {
  const result = evaluateCase(entry, skillTextByName);
  if (!result.pass) {
    failures.push({
      id: entry.id || 'unknown',
      expectedSkill: entry.expectedSkill || 'none',
      prompt: entry.prompt,
      hits: result.hits,
    });
  }
}

if (failures.length > 0) {
  console.error('Skill benchmark failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure.id}: expected ${failure.expectedSkill}, got ${failure.hits.join(', ') || 'no match'}`);
    console.error(`  Prompt: ${failure.prompt}`);
  }
  process.exit(1);
}

const total = cases.length;
console.log(`Skill benchmark passed: ${total} prompt checks evaluated with no mismatches.`);

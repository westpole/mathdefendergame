#!/usr/bin/env node
/**
 * Lists uncovered statements, branches, and functions for one source file
 * from Vitest's coverage-final.json.
 *
 * Usage: node .claude/skills/coverage-analysis/scripts/uncovered.mjs <path-suffix> [report]
 *   <path-suffix>  Repo-relative source path, e.g. src/ui/components/Hud/Hud.tsx
 *   [report]       Defaults to reports/unit-tests/coverage/coverage-final.json
 */
import { readFileSync } from 'node:fs';

const [suffix, reportPath = 'reports/unit-tests/coverage/coverage-final.json'] = process.argv.slice(2);
if (!suffix) {
  console.error('Usage: uncovered.mjs <path-suffix> [report]');
  process.exit(2);
}

const normalize = (p) => p.replace(/\\/g, '/').toLowerCase();
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const wanted = normalize(suffix).replace(/^\.?\//, '');
const matches = Object.keys(report).filter((key) => normalize(key).endsWith(`/${wanted}`));

if (matches.length !== 1) {
  console.error(matches.length ? `Ambiguous suffix, matches:\n${matches.join('\n')}` : `No entry ends with ${suffix}`);
  process.exit(1);
}

const entry = report[matches[0]];
const lines = [];

for (const [id, hits] of Object.entries(entry.s)) {
  if (hits === 0) lines.push([entry.statementMap[id].start.line, 'statement']);
}
for (const [id, counts] of Object.entries(entry.b)) {
  const branch = entry.branchMap[id];
  counts.forEach((hits, index) => {
    if (hits === 0) {
      const line = branch.locations[index]?.start.line ?? branch.loc.start.line;
      lines.push([line, `branch ${branch.type} path #${index}`]);
    }
  });
}
for (const [id, hits] of Object.entries(entry.f)) {
  if (hits === 0) lines.push([entry.fnMap[id].loc.start.line, `function ${entry.fnMap[id].name}`]);
}

console.log(matches[0]);
if (lines.length === 0) {
  console.log('Fully covered.');
} else {
  lines.sort((a, b) => a[0] - b[0]).forEach(([line, what]) => console.log(`  L${line}\t${what}`));
}

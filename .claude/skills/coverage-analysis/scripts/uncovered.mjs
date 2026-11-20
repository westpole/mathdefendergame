#!/usr/bin/env node
/**
 * Lists uncovered statements, branches, and functions for one source file
 * from Vitest's coverage-final.json.
 *
 * Usage: node .claude/skills/coverage-analysis/scripts/uncovered.mjs <path-suffix> [report]
 *   <path-suffix>  Repo-relative source path, e.g. src/ui/components/HUDOverlay/InputPanel.tsx
 *   [report]       Defaults to reports/unit-tests/coverage/coverage-final.json
 *
 * Also imported by `.claude/hooks/coverage-gaps-on-failure.mjs`.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const DEFAULT_REPORT = 'reports/unit-tests/coverage/coverage-final.json';

/** Lowercase, forward-slash form of a path for suffix and glob matching. */
export const normalize = (p) => p.replace(/\\/g, '/').toLowerCase();

/**
 * @param {Record<string, unknown>} report parsed coverage-final.json
 * @param {string} suffix repo-relative path (or any path suffix)
 * @returns {string[]} report keys ending with the suffix
 */
export function findKeys(report, suffix) {
  const wanted = normalize(suffix).replace(/^\.?\//, '');
  return Object.keys(report).filter((key) => normalize(key).endsWith(`/${wanted}`));
}

/**
 * @param {object} entry one file's istanbul coverage entry
 * @returns {Array<[number, string]>} uncovered items as [line, description], sorted by line
 */
export function uncoveredItems(entry) {
  const items = [];
  for (const [id, hits] of Object.entries(entry.s)) {
    if (hits === 0) items.push([entry.statementMap[id].start.line, 'statement']);
  }
  for (const [id, counts] of Object.entries(entry.b)) {
    const branch = entry.branchMap[id];
    counts.forEach((hits, index) => {
      if (hits === 0) {
        const line = branch.locations[index]?.start.line ?? branch.loc.start.line;
        items.push([line, `branch ${branch.type} path #${index}`]);
      }
    });
  }
  for (const [id, hits] of Object.entries(entry.f)) {
    if (hits === 0) items.push([entry.fnMap[id].loc.start.line, `function ${entry.fnMap[id].name}`]);
  }
  return items.sort((a, b) => a[0] - b[0]);
}

function main() {
  const [suffix, reportPath = DEFAULT_REPORT] = process.argv.slice(2);
  if (!suffix) {
    console.error('Usage: uncovered.mjs <path-suffix> [report]');
    process.exit(2);
  }

  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const matches = findKeys(report, suffix);

  if (matches.length !== 1) {
    console.error(matches.length ? `Ambiguous suffix, matches:\n${matches.join('\n')}` : `No entry ends with ${suffix}`);
    process.exit(1);
  }

  const items = uncoveredItems(report[matches[0]]);
  console.log(matches[0]);
  if (items.length === 0) {
    console.log('Fully covered.');
  } else {
    items.forEach(([line, what]) => console.log(`  L${line}\t${what}`));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

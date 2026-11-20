#!/usr/bin/env node
/**
 * PostToolUseFailure hook (Bash): when a Vitest run fails a coverage threshold, add the uncovered
 * lines of the offending files to Claude's context. A threshold failure exits non-zero, so it
 * arrives here rather than at PostToolUse.
 *
 * Flow:
 * - No `ERROR: Coverage for ...` / `ERROR: Uncovered ...` lines in the tool error -> exit silently.
 * - Report missing or older than the failed command -> exit silently (avoids stale gaps).
 * - Otherwise map each failing threshold to report files: the named file (per-file thresholds),
 *   files matching the threshold glob, or every file for `global`. List those files' uncovered items
 *   for the failing metric, capped to stay under the 10,000-character additionalContext limit.
 * - Never blocks and never asks Claude to write tests; the coverage-analysis skill stays opt-in.
 * - Fails open: any error exits 0 with no output.
 *
 * The report holds only the files measured by the run that just failed (lane runs scope
 * `coverage.include` per project in vitest.config.ts), so the gaps match that run.
 */
import { readFileSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';
import { DEFAULT_REPORT, normalize, uncoveredItems } from '../skills/coverage-analysis/scripts/uncovered.mjs';

const MAX_FILES = 8;
const MAX_FAILURE_LINES = 10;
const MAX_ITEMS_PER_FILE = 20;
const MAX_CHARS = 9000;
/** Slack between the command start and the report write, for clock and timing jitter. */
const FRESHNESS_SLACK_MS = 5000;
/** Freshness window when the hook input has no `duration_ms`. */
const FALLBACK_MAX_AGE_MS = 15 * 60 * 1000;

const THRESHOLD_ERROR =
  /ERROR: (?:Coverage for (\w+) \([\d.]+%\) does not meet|Uncovered (\w+) \(\d+\) exceed) (global|per-file|"[^"]+") threshold \([\d.]+%?\)(?: for (\S+))?/g;

/** Which uncovered item kinds count toward each Vitest threshold metric. */
const METRIC_KIND = { statements: 'statement', lines: 'statement', functions: 'function', branches: 'branch' };

/** Glob test that tolerates a leading `./` or `/` and treats a matcher error as no match. */
function matchesGlob(path, glob) {
  try {
    return posix.matchesGlob(path, glob.replace(/^\.?\//, ''));
  } catch {
    return false;
  }
}

/** True when a normalized report key is the named file, given as a repo-relative or absolute path. */
function isNamedFile(normalizedKey, file) {
  const wanted = normalize(file).replace(/^\.?\//, '');
  return normalizedKey === wanted || normalizedKey.endsWith(`/${wanted}`);
}

/** @returns {Array<{ line: string, metric: string, scope: string, file?: string }>} */
function parseFailures(text) {
  return [...text.matchAll(THRESHOLD_ERROR)].map((m) => ({
    line: m[0],
    metric: m[1] ?? m[2],
    scope: m[3].replace(/^"|"$/g, ''),
    file: m[4],
  }));
}

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    return;
  }
  if (input.tool_name !== 'Bash' || typeof input.error !== 'string') return;

  const failures = parseFailures(input.error);
  if (failures.length === 0) return;

  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const reportPath = join(projectDir, DEFAULT_REPORT);
  const maxAge = typeof input.duration_ms === 'number' ? input.duration_ms + FRESHNESS_SLACK_MS : FALLBACK_MAX_AGE_MS;
  if (Date.now() - statSync(reportPath).mtimeMs > maxAge) return;

  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const root = normalize(projectDir).replace(/\/$/, '') + '/';
  /** `match` is lowercased for comparisons; `rel` keeps the original casing for display. */
  const files = Object.keys(report).map((key) => {
    const slashed = key.replace(/\\/g, '/');
    const rel = normalize(key).startsWith(root) ? slashed.slice(root.length) : slashed;
    return { key, rel, match: rel.toLowerCase() };
  });

  /** rel path -> { kinds: Set<string>, items } for files that miss a failing metric */
  const gaps = new Map();
  for (const { metric, scope, file } of failures) {
    const kind = METRIC_KIND[metric];
    const glob = scope.toLowerCase();
    const candidates = file
      ? files.filter(({ key }) => isNamedFile(normalize(key), file))
      : scope === 'global'
        ? files
        : files.filter(({ match }) => matchesGlob(match, glob));
    for (const { key, rel } of candidates) {
      const gap = gaps.get(rel) ?? { kinds: new Set(), items: uncoveredItems(report[key]) };
      gap.kinds.add(kind);
      gaps.set(rel, gap);
    }
  }

  const ranked = [...gaps.entries()]
    .map(([rel, { kinds, items }]) => [rel, items.filter(([, what]) => kinds.has(what.split(' ')[0]))])
    .filter(([, items]) => items.length > 0)
    .sort((a, b) => b[1].length - a[1].length);

  const out = ['Vitest coverage thresholds failed:'];
  for (const { line } of failures.slice(0, MAX_FAILURE_LINES)) out.push(`- ${line}`);
  if (failures.length > MAX_FAILURE_LINES) out.push(`- ... ${failures.length - MAX_FAILURE_LINES} more threshold failures`);
  out.push('');
  if (ranked.length === 0) {
    out.push('No matching uncovered items found in coverage-final.json.');
  } else {
    out.push('Uncovered items for the failing metrics (from coverage-final.json):');
    // Header counts toward the budget; MAX_CHARS leaves room for the footer under the 10,000 cap.
    let length = out.join('\n').length;
    let shown = 0;
    for (const [rel, items] of ranked.slice(0, MAX_FILES)) {
      const block = [`${rel} (${items.length})`];
      for (const [line, what] of items.slice(0, MAX_ITEMS_PER_FILE)) block.push(`  L${line}\t${what}`);
      if (items.length > MAX_ITEMS_PER_FILE) block.push(`  ... ${items.length - MAX_ITEMS_PER_FILE} more`);
      const blockLength = block.join('\n').length + 1;
      if (length + blockLength > MAX_CHARS) break;
      out.push(...block);
      length += blockLength;
      shown += 1;
    }
    if (ranked.length > shown) out.push(`... ${ranked.length - shown} more files with gaps`);
  }
  out.push(
    '',
    'Full per-file list: node .claude/skills/coverage-analysis/scripts/uncovered.mjs <file>.',
    'Closing these gaps is the coverage-analysis skill; only do it if the user asked for coverage work.',
  );

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PostToolUseFailure', additionalContext: out.join('\n') },
    }),
  );
}

try {
  main();
} catch {
  // fail open: no context, no block
}
process.exit(0);

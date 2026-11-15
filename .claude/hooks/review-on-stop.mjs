#!/usr/bin/env node
/**
 * Stop hook: when Claude finishes a turn that left unreviewed working-tree changes,
 * block the stop once and ask Claude to run the `code-reviewer` subagent.
 *
 * Flow:
 * - Normal stop, tree dirty and fingerprint differs from the last reviewed one -> block with review request.
 * - Stop caused by this hook (`stop_hook_active`) -> the review just ran; record the current fingerprint
 *   (including any follow-up edits) and let Claude stop. Never blocks twice in a row, so it cannot loop.
 * - An interrupted review records nothing, so the next stop asks again.
 * - Fails open: any error lets Claude stop normally.
 *
 * The fingerprint (`<git-dir>/claude-review-fingerprint`) hashes `git status`, the text diff against HEAD
 * (binary files appear as one line), and untracked files' name/size/mtime, so large artifacts stay cheap.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const git = (...args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  });

/** @returns {string | null} fingerprint of the working tree, or null when it is clean */
function fingerprintWorkingTree() {
  const status = git('status', '--porcelain');
  if (!status.trim()) return null;

  const hash = createHash('sha256');
  hash.update(status);
  hash.update(git('diff', 'HEAD'));
  for (const file of git('ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean)) {
    try {
      const { size, mtimeMs } = statSync(file);
      hash.update(`${file}\0${size}\0${mtimeMs}\n`);
    } catch {
      hash.update(`${file}\n`);
    }
  }
  return hash.digest('hex');
}

try {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    // no/invalid stdin: treat as a normal stop
  }

  const store = join(git('rev-parse', '--git-dir').trim(), 'claude-review-fingerprint');
  const fingerprint = fingerprintWorkingTree();

  if (input.stop_hook_active) {
    if (fingerprint) writeFileSync(store, fingerprint);
    process.exit(0);
  }

  if (!fingerprint) process.exit(0);
  if (existsSync(store) && readFileSync(store, 'utf8').trim() === fingerprint) process.exit(0);

  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason:
        'The working tree has changes that have not been reviewed yet. Run the `code-reviewer` subagent (Agent tool, subagent_type "code-reviewer") on the uncommitted changes, then report its findings to the user. Do not apply fixes unless the user asks.',
    }),
  );
} catch {
  process.exit(0);
}

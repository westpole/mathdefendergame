/* eslint-env node */

import { execFileSync } from 'node:child_process';

function runGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

let branchName;

try {
  branchName = runGit(['branch', '--show-current']);
} catch {
  fail('Release rejected: unable to determine the current git branch.');
}

if (branchName !== 'master') {
  fail(`Release rejected: current branch is "${branchName}". Switch to "master" before running a release.`);
}

let latestTag = '';

try {
  latestTag = runGit(['describe', '--tags', '--abbrev=0']);
} catch {
  process.stdout.write('Release guard: no previous release tag found; proceeding with initial release.\n');
  process.exit(0);
}

let commitsSinceTag;

try {
  commitsSinceTag = Number.parseInt(runGit(['rev-list', '--count', `${latestTag}..HEAD`]), 10);
} catch {
  fail(`Release rejected: unable to compare HEAD against the latest tag "${latestTag}".`);
}

if (!Number.isFinite(commitsSinceTag)) {
  fail(`Release rejected: invalid commit count returned when comparing against "${latestTag}".`);
}

let releasableCommitSubjects = '';

try {
  releasableCommitSubjects = runGit([
    'log',
    '--format=%s',
    `${latestTag}..HEAD`,
    '--invert-grep',
    '--grep=^build: bump up to a new version$',
  ]);
} catch {
  fail(`Release rejected: unable to inspect commits since the latest tag "${latestTag}".`);
}

const releasableCommits = releasableCommitSubjects
  .split('\n')
  .map((subject) => subject.trim())
  .filter(Boolean);

if (commitsSinceTag === 0 || releasableCommits.length === 0) {
  fail(`Release rejected: no new releasable commits found since the latest release tag "${latestTag}".`);
}

process.stdout.write(
  `Release guard: ${releasableCommits.length} releasable commit(s) found since ${latestTag} (${commitsSinceTag} total commit(s)).\n`,
);
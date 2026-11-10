/* eslint-env node */

/**
 * Math Defender Game release pipeline.
 *
 * Runs every release step in order, stops at the first failure, and writes a single JSON
 * result file (`reports/current-prod-build/release-report.json`) that the report viewer
 * (`npm run release:report`) renders. Console output is one status line per step so the
 * calling agent spends as few tokens as possible; full command output goes to per-step log files.
 *
 * Usage: npm run release:run -- [--dry-run] [--no-push]
 *   --dry-run  Run preflight, checks, and builds, but skip the release step. Git preflight
 *              failures are recorded as warnings instead of blocking.
 *   --no-push  Bump version, update changelog, and commit locally, but do not push.
 *
 * Exit code: 0 when every step passed (or was intentionally skipped), 1 otherwise.
 */

import { spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Uppercase the Windows drive letter: a lowercase `e:` cwd makes Vitest load modules twice
// (once per path spelling), which breaks jest-dom matchers and test collection.
const ROOT = process.cwd().replace(/^[a-z]:/, (drive) => drive.toUpperCase());
const REPORT_DIR = path.join(ROOT, 'reports', 'current-prod-build');
const LOG_DIR = path.join(REPORT_DIR, 'logs');
const REPORT_PATH = path.join(REPORT_DIR, 'release-report.json');
const BUMPS = new Set(['patch', 'minor', 'major']);

const args = new Set(process.argv.slice(2));
const unknownArgs = [...args].filter((arg) => !['--dry-run', '--no-push'].includes(arg));
if (unknownArgs.length > 0) {
  process.stderr.write(`Unknown argument(s): ${unknownArgs.join(', ')}\n`);
  process.exit(1);
}
const dryRun = args.has('--dry-run');
const noPush = args.has('--no-push');

const rel = (filePath) => path.relative(ROOT, filePath).split(path.sep).join('/');

const report = {
  schemaVersion: 1,
  project: 'Math Defender Game',
  startedAt: new Date().toISOString(),
  finishedAt: null,
  durationMs: 0,
  status: 'running',
  options: { dryRun, noPush },
  failedStep: null,
  git: { branch: null, commit: null, latestTag: null },
  releaseType: null,
  previousVersion: readPackageVersion(),
  nextVersion: null,
  steps: [],
  builds: [],
  release: { performed: false, version: null, tag: null, tagCreated: false, commit: null, pushed: false },
};

/* ---------- helpers ---------- */

function readPackageVersion() {
  return JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
}

function nextVersion(version, bump) {
  const [major, minor, patch] = version.split('-')[0].split('.').map(Number);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function git(...gitArgs) {
  const result = spawnSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `git ${gitArgs.join(' ')} failed`).trim());
  }
  return result.stdout.trim();
}

function tryGit(...gitArgs) {
  try {
    return git(...gitArgs);
  } catch {
    return null;
  }
}

function tail(filePath, lines = 40) {
  try {
    return readFileSync(filePath, 'utf8').trimEnd().split(/\r?\n/).slice(-lines).join('\n');
  } catch {
    return '';
  }
}

/** Runs a shell command with stdout/stderr streamed to a log file. Returns the exit code. */
function runLogged(command, logFile) {
  const fd = openSync(logFile, 'a');
  try {
    writeFileSync(fd, `$ ${command}\n`);
    const result = spawnSync(command, {
      cwd: ROOT,
      shell: true,
      stdio: ['ignore', fd, fd],
      // Silence npm's own banner/error footer so the log tail shows the tool's real error.
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', npm_config_loglevel: 'silent' },
    });
    if (result.error) {
      writeFileSync(fd, `\n${result.error.message}\n`);
      return 1;
    }
    return result.status ?? 1;
  } finally {
    closeSync(fd);
  }
}

function writeReport() {
  report.durationMs = Date.now() - Date.parse(report.startedAt);
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
}

function dirStats(dirPath) {
  let sizeBytes = 0;
  let fileCount = 0;
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const nested = dirStats(full);
      sizeBytes += nested.sizeBytes;
      fileCount += nested.fileCount;
    } else if (entry.isFile()) {
      sizeBytes += statSync(full).size;
      fileCount += 1;
    }
  }
  return { sizeBytes, fileCount };
}

/* ---------- step runner ---------- */

class StepError extends Error {}

/**
 * Executes one step. `fn` returns an optional message string, or throws (StepError for an
 * expected failure). `soft: true` turns a failure into a warning (used for git checks in dry-run).
 */
function step(id, label, command, fn, { soft = false } = {}) {
  const started = Date.now();
  const logFile = path.join(LOG_DIR, `${id}.log`);
  const entry = { id, label, command, status: 'running', durationMs: 0, message: null, log: null };
  report.steps.push(entry);

  let ok = true;
  try {
    entry.message = fn({ logFile, entry }) ?? null;
  } catch (error) {
    ok = false;
    entry.message = error instanceof Error ? error.message : String(error);
  }
  entry.durationMs = Date.now() - started;
  if (existsSync(logFile)) entry.log = rel(logFile);

  if (ok) {
    entry.status = 'passed';
  } else if (soft) {
    entry.status = 'warning';
  } else {
    entry.status = 'failed';
  }

  const seconds = (entry.durationMs / 1000).toFixed(1);
  process.stdout.write(`[${entry.status}] ${id} (${seconds}s)${entry.message ? ` - ${entry.message}` : ''}\n`);
  writeReport();

  if (entry.status === 'failed') {
    if (entry.log) {
      process.stdout.write(`--- last lines of ${entry.log} ---\n${tail(logFile)}\n---\n`);
    }
    finish('failed', id);
  }
}

function skip(id, label, command, reason) {
  report.steps.push({ id, label, command, status: 'skipped', durationMs: 0, message: reason, log: null });
  process.stdout.write(`[skipped] ${id} - ${reason}\n`);
  writeReport();
}

/** Runs an npm command, logging output; throws StepError on a non-zero exit code. */
function npmStep(id, label, command, opts) {
  step(
    id,
    label,
    command,
    ({ logFile }) => {
      const code = runLogged(command, logFile);
      if (code !== 0) {
        const lastLine = tail(logFile, 1).trim();
        throw new StepError(`exit code ${code}${lastLine ? `: ${lastLine}` : ''}`);
      }
      return null;
    },
    opts,
  );
}

function collectBuilds() {
  const builds = [];
  const webDir = path.join(ROOT, 'build');
  if (existsSync(webDir)) {
    builds.push({ id: 'web', label: 'Web', role: 'primary', path: 'build', ...dirStats(webDir) });
  }
  const distDir = path.join(ROOT, 'dist');
  if (existsSync(distDir)) {
    const files = readdirSync(distDir, { withFileTypes: true }).filter((entry) => entry.isFile());
    builds.push({
      id: 'win-installer',
      label: 'Windows installer',
      role: 'additional',
      path: 'dist',
      sizeBytes: files.reduce((sum, file) => sum + statSync(path.join(distDir, file.name)).size, 0),
      fileCount: files.length,
      files: files.map((file) => file.name),
    });
    const unpackedDir = path.join(distDir, 'win-unpacked');
    if (existsSync(unpackedDir)) {
      builds.push({ id: 'win-portable', label: 'Windows portable', role: 'additional', path: 'dist/win-unpacked', ...dirStats(unpackedDir) });
    }
  }
  report.builds = builds;
}

function finish(status, failedStep = null) {
  report.status = status;
  report.failedStep = failedStep;
  report.finishedAt = new Date().toISOString();
  writeReport();
  process.stdout.write(`RESULT ${status}${failedStep ? ` step=${failedStep}` : ''} report=${rel(REPORT_PATH)}\n`);
  process.exit(status === 'failed' ? 1 : 0);
}

/* ---------- pipeline ---------- */

rmSync(REPORT_DIR, { recursive: true, force: true });
mkdirSync(LOG_DIR, { recursive: true });
writeReport();

const gitSoft = { soft: dryRun };

step('bump', 'Determine release bump', 'npm run --silent which:version', ({ logFile }) => {
  const result = spawnSync('npm run --silent which:version', { cwd: ROOT, shell: true, encoding: 'utf8' });
  writeFileSync(logFile, `${result.stdout ?? ''}${result.stderr ?? ''}`);
  const bump = (result.stdout ?? '').trim().split(/\r?\n/).pop()?.trim();
  if (result.status !== 0 || !BUMPS.has(bump)) {
    throw new StepError(`could not determine bump (got "${bump ?? ''}")`);
  }
  report.releaseType = bump;
  report.nextVersion = nextVersion(report.previousVersion, bump);
  return `${bump}: ${report.previousVersion} -> ${report.nextVersion}`;
});

step('git-branch', 'Branch is master', 'git branch --show-current', () => {
  const branch = git('branch', '--show-current');
  report.git.branch = branch;
  report.git.commit = tryGit('rev-parse', '--short', 'HEAD');
  if (branch !== 'master') throw new StepError(`current branch is "${branch}", expected "master"`);
  return branch;
}, gitSoft);

step('git-clean', 'Worktree is clean', 'git status --porcelain', () => {
  const dirty = git('status', '--porcelain');
  if (dirty) throw new StepError(`${dirty.split('\n').length} uncommitted change(s)`);
  return 'clean';
}, gitSoft);

step('git-sync', 'Up to date with remote', 'git fetch && git rev-list --left-right --count HEAD...@{u}', () => {
  git('fetch', '--quiet');
  const counts = tryGit('rev-list', '--left-right', '--count', 'HEAD...@{u}');
  if (counts === null) throw new StepError('no upstream branch configured');
  const [ahead, behind] = counts.split(/\s+/).map(Number);
  if (ahead || behind) throw new StepError(`ahead ${ahead}, behind ${behind}`);
  return 'in sync';
}, gitSoft);

report.git.latestTag = tryGit('describe', '--tags', '--abbrev=0');
npmStep('guard', 'Releasable commits since latest tag', 'npm run release:guard', gitSoft);

npmStep('lint', 'Lint', 'npm run lint');
npmStep('typecheck', 'Typecheck', 'npm run typecheck');
npmStep('test-all', 'Unit tests', 'npm run test:all');

npmStep('build-web', 'Web build', 'npm run build:web:bundle');
rmSync(path.join(ROOT, 'dist'), { recursive: true, force: true });
// Stamp the Windows artifacts with the version they will be released as.
npmStep('build-win', 'Windows build', `npm run build:win:package -- -c.extraMetadata.version=${report.nextVersion}`);
collectBuilds();
writeReport();

if (dryRun) {
  skip('release', 'Version bump, changelog, commit, tag, push', `npm run release:${report.releaseType}`, 'dry run');
  const warned = report.steps.some((s) => s.status === 'warning');
  finish(warned ? 'dry-run-with-warnings' : 'dry-run');
}

const releaseCommand = noPush
  ? `npm version ${report.releaseType} && npm run changelog && npm run git:commit`
  : `npm run release:${report.releaseType}`;

step('release', noPush ? 'Version bump, changelog, commit (no push)' : 'Version bump, changelog, commit, tag, push', releaseCommand, ({ logFile }) => {
  report.release.performed = true;
  const code = runLogged(releaseCommand, logFile);
  const version = readPackageVersion();
  const tag = `v${version}`;
  report.release.version = version;
  report.release.tag = tag;
  report.release.tagCreated = tryGit('rev-parse', '-q', '--verify', `refs/tags/${tag}`) !== null;
  report.release.commit = tryGit('rev-parse', '--short', 'HEAD');
  if (!noPush) {
    const remoteTag = tryGit('ls-remote', '--tags', 'origin', tag);
    const unpushed = tryGit('rev-list', '--count', '@{u}..HEAD');
    report.release.pushed = Boolean(remoteTag) && unpushed === '0';
  }
  if (code !== 0) throw new StepError(`exit code ${code}`);
  if (version !== report.nextVersion) throw new StepError(`package version is ${version}, expected ${report.nextVersion}`);
  if (!report.release.tagCreated) throw new StepError(`tag ${tag} was not created`);
  if (!noPush && !report.release.pushed) throw new StepError('commit or tag not found on remote');
  return `${tag} at ${report.release.commit}${noPush ? ' (not pushed)' : ' pushed'}`;
});

finish('success');

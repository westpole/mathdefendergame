const TONES = {
  success: 'success',
  passed: 'success',
  'dry-run': 'success',
  'dry-run-with-warnings': 'warning',
  warning: 'warning',
  running: 'warning',
  skipped: 'muted',
  failed: 'danger',
};

const $ = (id) => document.getElementById(id);

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined) continue;
    node.append(child instanceof Node ? child : String(child));
  }
  return node;
}

const pill = (status) => el('span', { class: `pill tone-${TONES[status] ?? 'muted'}` }, status ?? 'unknown');
const code = (text) => (text ? el('code', {}, text) : '—');
const card = (label, value) => el('div', { class: 'card' }, [el('span', { class: 'label' }, label), el('div', { class: 'value' }, value ?? '—')]);

function yesNoPill(value) {
  const node = pill(value ? 'passed' : 'skipped');
  node.textContent = value ? 'yes' : 'no';
  return node;
}

function formatBytes(bytes) {
  if (typeof bytes !== 'number') return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

const formatDuration = (ms) => (typeof ms === 'number' ? `${(ms / 1000).toFixed(1)}s` : '—');
const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

function render(report) {
  const versionText = report.nextVersion ? `${report.previousVersion} → ${report.nextVersion}` : report.previousVersion;
  $('title').textContent = `Release ${versionText ?? ''}`.trim();
  $('subhead').textContent = `Started ${formatDate(report.startedAt)} · finished ${formatDate(report.finishedAt)} · ${formatDuration(report.durationMs)}`;

  const modes = [report.options?.dryRun && 'dry run', report.options?.noPush && 'no push'].filter(Boolean).join(', ');
  $('summary').replaceChildren(
    card('Status', pill(report.status)),
    card('Release type', report.releaseType),
    card('Version', versionText),
    card('Branch', report.git?.branch),
    card('Commit', report.git?.commit),
    card('Latest tag', report.git?.latestTag),
    card('Failed step', report.failedStep ?? 'none'),
    card('Mode', modes || 'full release'),
  );

  $('steps').replaceChildren(
    ...report.steps.map((step) =>
      el('tr', {}, [
        el('td', {}, pill(step.status)),
        el('td', {}, step.label),
        el('td', {}, code(step.command)),
        el('td', {}, formatDuration(step.durationMs)),
        el('td', {}, [step.message ?? '', step.log ? el('div', {}, code(step.log)) : null]),
      ]),
    ),
  );

  const builds = [...report.builds].sort((a, b) => (a.role === 'primary' ? -1 : b.role === 'primary' ? 1 : 0));
  $('builds').replaceChildren(
    ...(builds.length
      ? builds.map((build) =>
          el('tr', {}, [
            el('td', {}, [build.label, build.files?.length ? el('div', { class: 'muted' }, build.files.join(', ')) : null]),
            el('td', {}, build.role),
            el('td', {}, code(build.path)),
            el('td', {}, formatBytes(build.sizeBytes)),
            el('td', {}, build.fileCount ?? '—'),
          ]),
        )
      : [el('tr', {}, el('td', { colspan: '5', class: 'muted' }, 'No build artifacts recorded.'))]),
  );

  const release = report.release ?? {};
  $('release').replaceChildren(
    card('Performed', yesNoPill(release.performed)),
    card('Version', release.version),
    card('Tag', release.tag),
    card('Tag created', yesNoPill(release.tagCreated)),
    card('Release commit', release.commit),
    card('Pushed', yesNoPill(release.pushed)),
  );

  $('loader').hidden = true;
  $('report').hidden = false;
}

function showLoader(message) {
  $('subhead').textContent = 'No report loaded.';
  $('loader-message').textContent = message;
  $('loader').hidden = false;
}

$('file-input').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    render(JSON.parse(await file.text()));
  } catch {
    showLoader('That file is not a valid release report JSON.');
  }
});

fetch('/api/report', { cache: 'no-store' })
  .then(async (response) => {
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'Report not found.');
    return response.json();
  })
  .then(render)
  .catch((error) =>
    showLoader(`${error.message} You can also pick reports/current-prod-build/release-report.json manually.`),
  );

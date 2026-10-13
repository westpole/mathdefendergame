const tableBody = document.getElementById('flags-table-body');
const addFlagButton = document.getElementById('add-flag');
const generateButton = document.getElementById('generate-list');
const statusMessage = document.getElementById('status-message');
const jsonPreview = document.getElementById('json-preview');
const rowTemplate = document.getElementById('flag-row-template');
const DRAFT_STORAGE_KEY = 'math-defender-feature-flag-draft-v1';

const NAME_PATTERN = /^[a-z0-9_\-.]+$/;

function showStatus(message, tone = 'default') {
  statusMessage.textContent = message;
  statusMessage.classList.remove('error', 'success');

  if (tone === 'error') {
    statusMessage.classList.add('error');
  }

  if (tone === 'success') {
    statusMessage.classList.add('success');
  }
}

function normalizeRow(row) {
  const nameInput = row.querySelector('[data-field="name"]');
  const descriptionInput = row.querySelector('[data-field="description"]');
  const statusSelect = row.querySelector('[data-field="status"]');

  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  const status = statusSelect.value === '1' ? 1 : 0;

  return { row, nameInput, name, description, status };
}

function createRow(defaults = {}) {
  const fragment = rowTemplate.content.cloneNode(true);
  const row = fragment.querySelector('tr');

  row.querySelector('[data-field="name"]').value = defaults.name ?? '';
  row.querySelector('[data-field="description"]').value = defaults.description ?? '';
  row.querySelector('[data-field="status"]').value = defaults.status === 0 ? '0' : '1';

  row.querySelector('[data-action="remove"]').addEventListener('click', () => {
    row.remove();
    updatePreview();
    showStatus('Flag removed.');
  });

  for (const input of row.querySelectorAll('input, select')) {
    input.addEventListener('input', updatePreview);
    input.addEventListener('change', updatePreview);
  }

  tableBody.appendChild(fragment);
}

function collectRows() {
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  return rows.map((row) => normalizeRow(row));
}

function saveDraftRows(entries) {
  const draft = entries.map((entry) => ({
    name: entry.name,
    description: entry.description,
    status: entry.status,
  }));

  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

function loadDraftRows() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function validateRows(entries) {
  const errors = [];
  const seen = new Set();

  for (const entry of entries) {
    entry.nameInput.classList.remove('invalid');

    if (!entry.name) {
      entry.nameInput.classList.add('invalid');
      errors.push('Each row must have a name.');
      continue;
    }

    if (entry.name !== entry.name.toLowerCase()) {
      entry.nameInput.classList.add('invalid');
      errors.push(`Flag \"${entry.name}\" must be lowercase.`);
    }

    if (/\s/.test(entry.name)) {
      entry.nameInput.classList.add('invalid');
      errors.push(`Flag \"${entry.name}\" cannot contain spaces.`);
    }

    if (!NAME_PATTERN.test(entry.name)) {
      entry.nameInput.classList.add('invalid');
      errors.push(`Flag \"${entry.name}\" must use only a-z, 0-9, _, -, or .`);
    }

    if (seen.has(entry.name)) {
      entry.nameInput.classList.add('invalid');
      errors.push(`Flag \"${entry.name}\" is duplicated.`);
    }

    seen.add(entry.name);
  }

  return errors;
}

function buildExportMap(entries) {
  const output = {};

  for (const entry of entries) {
    if (entry.status === 1) {
      output[entry.name] = true;
    }
  }

  return output;
}

function updatePreview() {
  const entries = collectRows();
  saveDraftRows(entries);
  const errors = validateRows(entries);

  if (errors.length > 0) {
    jsonPreview.textContent = '{}';
    return;
  }

  const exportMap = buildExportMap(entries);
  jsonPreview.textContent = JSON.stringify(exportMap, null, 2);
}

async function loadExistingFlags() {
  const draftRows = loadDraftRows();

  if (draftRows.length > 0) {
    for (const row of draftRows) {
      createRow(row);
    }

    updatePreview();
    showStatus('Loaded local draft rows.', 'success');
    return;
  }

  try {
    const response = await fetch('/api/feature-flags');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const existingRows = payload.rows ?? [];

    if (existingRows.length === 0) {
      createRow({ status: 1 });
      updatePreview();
      return;
    }

    for (const row of existingRows) {
      createRow(row);
    }

    updatePreview();
  } catch {
    createRow({ status: 1 });
    updatePreview();
    showStatus('Could not load existing flags; started with a blank row.', 'error');
  }
}

async function generateList() {
  const entries = collectRows();
  const errors = validateRows(entries);

  if (errors.length > 0) {
    showStatus(errors[0], 'error');
    return;
  }

  try {
    const response = await fetch('/api/feature-flags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rows: entries.map((entry) => ({
          name: entry.name,
          description: entry.description,
          status: entry.status,
        })),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? 'Failed to generate file');
    }

    jsonPreview.textContent = JSON.stringify(payload.exportedFlags, null, 2);
    showStatus(`Generated ${payload.outputFile} with ${Object.keys(payload.exportedFlags).length} enabled flag(s).`, 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown generation error';
    showStatus(message, 'error');
  }
}

addFlagButton.addEventListener('click', () => {
  createRow({ status: 0 });
  updatePreview();
  showStatus('Added a new row.');
});

generateButton.addEventListener('click', () => {
  void generateList();
});

void loadExistingFlags();

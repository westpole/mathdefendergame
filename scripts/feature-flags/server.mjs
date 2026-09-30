import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptDir, '../..');
const flagsOutputPath = path.join(repoRoot, 'src/shared/feature-flags.json');
const portArg = process.argv.find((arg) => arg.startsWith('--port='));
const port = Number(portArg?.slice('--port='.length) ?? '4783');

const NAME_PATTERN = /^[a-z0-9_\-.]+$/;

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });

  res.end(JSON.stringify(payload));
}

function readJsonFile(filePath, fallback) {
  try {
    if (!existsSync(filePath)) {
      return fallback;
    }

    const raw = readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function extractRowsFromFiles() {
  const flagsMap = readJsonFile(flagsOutputPath, {});

  const rows = Object.keys(flagsMap)
    .filter((name) => Boolean(flagsMap[name]))
    .sort()
    .map((name) => ({
      name,
      description: '',
      status: 1,
    }));

  return rows;
}

function normalizeRows(rawRows) {
  if (!Array.isArray(rawRows)) {
    return {
      errors: ['Payload must contain a rows array.'],
      rows: [],
    };
  }

  const errors = [];
  const normalizedRows = [];
  const seenNames = new Set();

  for (const rawEntry of rawRows) {
    const name = typeof rawEntry?.name === 'string' ? rawEntry.name.trim() : '';
    const description = typeof rawEntry?.description === 'string' ? rawEntry.description.trim() : '';
    const status = rawEntry?.status === 1 || rawEntry?.status === '1' || rawEntry?.status === true ? 1 : 0;

    if (!name) {
      errors.push('Each row must include a flag name.');
      continue;
    }

    if (name !== name.toLowerCase()) {
      errors.push(`Flag "${name}" must be lowercase.`);
    }

    if (/\s/.test(name)) {
      errors.push(`Flag "${name}" cannot contain spaces.`);
    }

    if (!NAME_PATTERN.test(name)) {
      errors.push(`Flag "${name}" can only use a-z, 0-9, _, -, or .`);
    }

    if (seenNames.has(name)) {
      errors.push(`Flag "${name}" is duplicated.`);
    }

    seenNames.add(name);
    normalizedRows.push({ name, description, status });
  }

  return { errors, rows: normalizedRows };
}

function buildExports(rows) {
  const exportedFlags = {};

  for (const row of rows) {
    if (row.status === 1) {
      exportedFlags[row.name] = true;
    }
  }

  return { exportedFlags };
}

function writeFlagFiles(rows) {
  const { exportedFlags } = buildExports(rows);
  writeFileSync(flagsOutputPath, `${JSON.stringify(exportedFlags, null, 2)}\n`);
  return { exportedFlags };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        reject(new Error('Request body too large.'));
      }
    });

    req.on('end', () => {
      resolve(body);
    });

    req.on('error', reject);
  });
}

function serveStaticFile(res, fileName, contentType) {
  try {
    const filePath = path.join(scriptDir, fileName);
    const content = readFileSync(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });

    res.end(content);
  } catch {
    res.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
    });
    res.end('Not found');
  }
}

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? `localhost:${port}`}`);

  if (req.method === 'GET' && (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html')) {
    serveStaticFile(res, 'index.html', 'text/html; charset=utf-8');
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/styles.css') {
    serveStaticFile(res, 'styles.css', 'text/css; charset=utf-8');
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/app.js') {
    serveStaticFile(res, 'app.js', 'text/javascript; charset=utf-8');
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/feature-flags') {
    sendJson(res, 200, { rows: extractRowsFromFiles() });
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/feature-flags') {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body);
      const { errors, rows } = normalizeRows(payload.rows);

      if (errors.length > 0) {
        sendJson(res, 400, {
          error: errors[0],
          errors,
        });
        return;
      }

      const { exportedFlags } = writeFlagFiles(rows);

      sendJson(res, 200, {
        exportedFlags,
        outputFile: 'src/shared/feature-flags.json',
      });
      return;
    } catch {
      sendJson(res, 400, {
        error: 'Invalid JSON payload.',
      });
      return;
    }
  }

  res.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8',
  });
  res.end('Not found');
});

server.listen(port, () => {
  process.stdout.write(`Feature flag manager running at http://localhost:${port}\n`);
});

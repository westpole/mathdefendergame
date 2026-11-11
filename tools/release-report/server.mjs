import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const reportPath = path.join(repoRoot, 'reports/current-prod-build/release-report.json');
const portArg = process.argv.find((arg) => arg.startsWith('--port='));
const port = Number(portArg?.slice('--port='.length) ?? '4784');

const STATIC_FILES = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
};

function send(res, statusCode, contentType, body) {
  res.writeHead(statusCode, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  res.end(body);
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', `http://localhost:${port}`);

  if (req.method !== 'GET') {
    send(res, 405, 'text/plain; charset=utf-8', 'Method not allowed');
    return;
  }

  if (pathname === '/api/report') {
    try {
      send(res, 200, 'application/json; charset=utf-8', readFileSync(reportPath));
    } catch {
      send(res, 404, 'application/json; charset=utf-8', JSON.stringify({ error: 'No release report found. Run /release-workflow first.' }));
    }
    return;
  }

  const staticFile = STATIC_FILES[pathname];
  if (staticFile) {
    send(res, 200, staticFile[1], readFileSync(path.join(scriptDir, staticFile[0])));
    return;
  }

  send(res, 404, 'text/plain; charset=utf-8', 'Not found');
});

server.listen(port, () => {
  process.stdout.write(`Release report viewer running at http://localhost:${port}\n`);
});

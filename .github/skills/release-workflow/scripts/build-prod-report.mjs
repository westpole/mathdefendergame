/* eslint-env node */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const TEMPLATE_RELATIVE_PATH = path.join(
  '.github',
  'skills',
  'release-workflow',
  'assets',
  'templates',
  'prod-build-report-template.html',
);
const REPORT_DATA_RELATIVE_PATH = path.join('reports', 'current-prod-build', 'prod-build-report.json');
const REPORT_OUTPUT_RELATIVE_PATH = path.join('reports', 'current-prod-build', 'index.html');
const REPORT_DATA_MARKER = '<!-- REPORT_DATA_INJECTION -->';

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = {
    template: path.resolve(process.cwd(), TEMPLATE_RELATIVE_PATH),
    data: path.resolve(process.cwd(), REPORT_DATA_RELATIVE_PATH),
    output: path.resolve(process.cwd(), REPORT_OUTPUT_RELATIVE_PATH),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--template') {
      if (!next) {
        fail('Missing value for --template.');
      }
      options.template = path.resolve(process.cwd(), next);
      index += 1;
      continue;
    }

    if (arg === '--data') {
      if (!next) {
        fail('Missing value for --data.');
      }
      options.data = path.resolve(process.cwd(), next);
      index += 1;
      continue;
    }

    if (arg === '--output') {
      if (!next) {
        fail('Missing value for --output.');
      }
      options.output = path.resolve(process.cwd(), next);
      index += 1;
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  return options;
}

function readFileOrFail(filePath, description) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    fail(`Unable to read ${description} at: ${filePath}`);
  }
}

function parseReportDataOrFail(rawReportData, dataPath) {
  try {
    return JSON.parse(rawReportData);
  } catch {
    fail(`Invalid JSON in report data file: ${dataPath}`);
  }
}

function injectReportData(template, reportData) {
  if (!template.includes(REPORT_DATA_MARKER)) {
    fail(`Template is missing marker "${REPORT_DATA_MARKER}".`);
  }

  const serializedReportData = JSON.stringify(reportData, null, 2).replace(/<\/script/gi, '<\\/script');
  const reportDataScript = `<script id="report-data" type="application/json">\n${serializedReportData}\n</script>`;
  return template.replace(REPORT_DATA_MARKER, reportDataScript);
}

function writeOutputOrFail(filePath, content) {
  const outputDirectory = path.dirname(filePath);

  try {
    mkdirSync(outputDirectory, { recursive: true });
    writeFileSync(filePath, content, 'utf8');
  } catch {
    fail(`Unable to write report output file at: ${filePath}`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const template = readFileOrFail(options.template, 'report template');
  const rawReportData = readFileOrFail(options.data, 'report data JSON');
  const reportData = parseReportDataOrFail(rawReportData, options.data);
  const output = injectReportData(template, reportData);

  writeOutputOrFail(options.output, output);

  process.stdout.write(`Report data source: ${options.data}\n`);
  process.stdout.write(`Report template source: ${options.template}\n`);
  process.stdout.write(`Generated report: ${options.output}\n`);
}

main();

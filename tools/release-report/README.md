# Release Report Viewer

Static HTML + JS app that renders the JSON produced by the `/release-workflow` command.

## Run

```bash
npm run release:report
```

Then open `http://localhost:4784`. The page loads `reports/current-prod-build/release-report.json` through `/api/report`.

If you open `index.html` directly from disk, or no report exists yet, use the file picker to load a report JSON manually.

## Data

The report shape (`schemaVersion: 1`) is defined by `.claude/skills/release-workflow/SKILL.md` (template: `.claude/skills/release-workflow/assets/release-report.template.json`):

- `status`: `running | success | failed | dry-run | dry-run-with-warnings`
- `steps[]`: `{ id, label, command, status, durationMs, message, log }`. `log` points at the full command output in `reports/current-prod-build/logs/`.
- `builds[]`: `{ id, label, role, path, sizeBytes, fileCount, files? }`. The web build is `primary`; the Windows builds are `additional`.
- `release`: `{ performed, version, tag, tagCreated, commit, pushed }`

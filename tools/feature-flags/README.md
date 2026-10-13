# Feature Flag Manager

This tool is separate from the game UI and writes runtime feature flags to `src/shared/feature-flags.json`.

## Run

```bash
npm run flags:manager
```

Then open `http://localhost:4783`.

## Fields

1. `name` - ID without spaces and lowercase only.
2. `description` - free text for team context.
3. `status` - enabled/disabled (`1`/`0`).

## Buttons

- `Add new flag`: adds a new editable row.
- `Generate list`: validates rows and replaces `src/shared/feature-flags.json`.

## Export Rules

- Output JSON shape is `{ <name>: boolean }`.
- Only enabled flags are exported.
- Disabled flags are omitted from the exported file.

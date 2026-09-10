# Math Defender

The player defends a base from falling meteors containing math expressions by typing the correct answer and pressing Enter. The game features score-based grade progression, dynamic difficulty adjustment (DDA), and a persistent score ledger that is surfaced in the overlay flow.

## Grade Progression and DDA Baseline

Grades are derived from earned score. The active grade is the highest grade whose threshold is less than or equal to the current score.

| Grade | Score Threshold | Base Fall Speed (px/s) | Spawn Rate (ms) | Target Latency (ms) | Damping Alpha | Baseline Math Tier |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| trainee | 0 | 36 | 2700 | 2600 | 0.12 | 1 |
| cadet | 101 | 52 | 2300 | 2300 | 0.13 | 2 |
| commander | 351 | 72 | 1900 | 2000 | 0.15 | 3 |
| major-general | 751 | 92 | 1500 | 1700 | 0.17 | 4 |

HUD telemetry exposes the live DDA state:
- Speed multiplier (`ddaSpeedMultiplier`)
- Cooloff state (`ddaIsCooloffActive`)
- DDA heat state (`ddaHeatState`)
- Math tier (`ddaMathTier`)

## TOC

* Development:
  - [General information](/docs/general.md)
  - [Tests (unit and components)](/docs/tests.md)
  - [Mobile device testing](/docs/mobile-device-testing.md)
  - [Eslint and TypeScript](/docs/lint.md)
  - [Using the `release-win-game` agent](/docs/release-win-game-agent.md)
* Project config:
  - [Build process](/docs/build.md)

## Tips and Tricks

Run the next command to see what is included in the ASAR archive:

```cmd
npx asar extract dist/win-unpacked/resources/app.asar ./extracted_app
```

**Make sure** that "build" config in package.json includes "package.json" itself in the files list.

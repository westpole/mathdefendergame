# Math Defender

The player defends a base from falling meteors containing math expressions by typing the correct answer and pressing Enter. The game features a progression system, difficulty levels, and a persistent leaderboard.

## TOC

* Development:
  - [General information](/docs/general.md)
  - [Integration tests](/docs/integration-test.md)
  - [Unit tests](/docs/unit-test.md)
  - [Component tests](/docs/component-test.md)
  - [Eslint and TypeScript](/docs/lint.md)
* Project config:
  - [Build process](/docs/build.md)

## Tips and Tricks

Run the next command to see what is included in the ASAR archive:

```cmd
npx asar extract dist/win-unpacked/resources/app.asar ./extracted_app
```

**Make sure** that "build" config in package.json includes "package.json" itself in the files list.

# Tips and Tricks

Run the next command to see what is included in the ASAR archive:

```cmd
npx asar extract dist/win-unpacked/resources/app.asar ./extracted_app
```

**Make sure** that "build" config in package.json includes "package.json" itself in the files list.

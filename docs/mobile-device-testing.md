# Mobile Device Testing

This guide covers the quickest way to test the web build on an Android device while you work locally on Windows.

## Recommended Setup

Use the Vite development server when you want a live test loop on the phone:

```bash
npm run dev:web:mobile
```

That script starts Vite on `0.0.0.0:5173`, which makes the app reachable from other devices on the same local network.

## Android Live Test Flow

1. Connect the development PC and the Android device to the same Wi-Fi network.
2. Start the dev server:

```bash
npm run dev:web:mobile
```

3. Find the PC's LAN IP on Windows:

```powershell
ipconfig
```

4. Open `http://<your-lan-ip>:5173` in Chrome on the Android device.
5. Accept the Windows Defender firewall prompt for private networks if it appears.

## What To Expect

- The app already includes mobile viewport handling and orientation tracking.
- The Android browser should receive live reload updates when source files change.
- This flow exercises the web renderer only, not the Electron shell.

## Optional HMR Setup Example

If the page loads on Android but hot reload does not reconnect reliably, pin the HMR host to the PC's LAN IP in [vite.config.ts](../vite.config.ts):

```ts
server: {
  host: true,
  port: 5173,
  strictPort: true,
  hmr: {
    host: '192.168.1.42',
    port: 5173,
  },
},
```

Replace `192.168.1.42` with the current LAN IP of the development machine.

## Testing The Built Web Bundle

Use this flow when you want to validate the production-like browser build instead of live HMR:

1. Build the web bundle:

```bash
npx vite build
```

2. Start a LAN-accessible preview server:

```bash
npm run preview:web:mobile
```

3. Open `http://<your-lan-ip>:4173` on the Android device.

## Notes

- The Playwright mobile projects use a local preview server bound to `127.0.0.1`, which is correct for automated tests but not for a physical device.
- If you are on a guest or isolated Wi-Fi network, device-to-device traffic may be blocked even when both devices have internet access.
- For USB-only testing, `adb reverse tcp:5173 tcp:5173` is another option, but the Wi-Fi flow above is the simplest default setup.

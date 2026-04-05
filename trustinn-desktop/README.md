# TrustInn Desktop

This desktop app preserves the exact TrustInn web UI by loading `https://trustinn.nitminer.com`.

Difference from browser mode:
- Auth/chat APIs stay on domain (remote).
- Tool execution/compile endpoints are rerouted to local machine (`127.0.0.1`) so CPU usage is on user device.

## Local API reroute
Rerouted locally:
- `/api/tools/execute`
- `/api/tools/compile`
- `/api/tools/compile-stream`

Everything else remains remote.

## Run

```bash
npm install
npm run start
```

## Build Windows installer

```bash
npm run build:win
```

Output will be in `dist/`.

## App icon

Windows app/installer icon is configured from:

- `assets/icons/icon.ico`

Source logo used:

- `https://www.nitminer.com/images/Logo/logo.png`

## Download location behavior

When users install via NSIS setup and choose an installation folder, file downloads are stored in:

- `<InstallFolder>/TrustInnDownloads`

If this folder is not writable (for example restricted Program Files permissions), app automatically falls back to:

- `<UserDownloads>/TrustInnDownloads`

## Code-signing certificate (trusted Windows publisher)

To produce a signed installer, use standard `electron-builder` signing env vars:

```bash
export CSC_LINK="file:///absolute/path/to/certificate.pfx"
export CSC_KEY_PASSWORD="your_cert_password"
npm run build:win:signed
```

Notes:

- Without valid cert env vars, build succeeds but remains unsigned.
- For maximum trust, use an EV code-signing certificate.

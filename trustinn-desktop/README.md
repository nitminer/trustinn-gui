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

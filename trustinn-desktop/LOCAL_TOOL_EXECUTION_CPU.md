# TrustInn Desktop: Local Tool Execution and CPU Usage

## What is happening

TrustInn Desktop loads the regular TrustInn UI from:

- `https://trustinn.nitminer.com`

But in desktop mode, specific tool endpoints are rerouted to a local server on the same machine:

- `/api/tools/execute`
- `/api/tools/compile`
- `/api/tools/compile-stream`

So the UI is remote, but compile/execute work is local.

## Why tools execute locally

This is intentional in desktop architecture.

The app starts a local Express server (localhost) and runs language tools through child processes (`spawn`) such as:

- `python3`
- `gcc`
- `javac` / `java`
- `solc`

This gives users:

- Faster local execution for many tasks
- Reduced server-side tool load
- Better privacy for local compile/run artifacts

## End-to-end flow

1. Electron app starts and launches local server on `127.0.0.1:4310`.
2. UI still opens from `https://trustinn.nitminer.com`.
3. Preload script intercepts `fetch` for tool routes.
4. Matching tool requests are rewritten to localhost.
5. Local server receives code/file and runs compiler/runtime.
6. CPU work happens on user machine.
7. Output is returned to UI.

## CPU usage: is 100% expected?

Short answer: **it can be normal, depending on the task.**

Important interpretation:

- 100% in many task managers may mean one logical core is fully used.
- On multi-core systems, one process can show high per-process CPU while total system CPU is lower.
- Compile, static analysis, fuzzing, or large input runs can spike CPU significantly.

So "kind of 100%" during active execution is possible and often expected for heavy workloads.

## When high CPU is likely normal

- While tool execution is running
- For complex/large code inputs
- For CPU-intensive analyzers or repeated test generation
- During compile + execute phases back-to-back

## When it may be abnormal

- CPU remains very high long after execution finishes
- Multiple stuck tool processes remain in background
- New runs become much slower over time
- Machine becomes unresponsive even on trivial inputs

## Practical checks

On Linux/macOS:

```bash
ps aux | egrep "python3|gcc|javac|java|solc|trustinn|electron"
```

On Windows PowerShell:

```powershell
Get-Process | Where-Object { $_.ProcessName -match "python|gcc|javac|java|solc|electron|trustinn" }
```

If needed, terminate stale tool processes after confirming no active run is required.

## Why this design was chosen

TrustInn Desktop is designed so that tool execution uses local resources by default, while web UI/auth remain on the hosted TrustInn domain. That architecture directly implies local CPU consumption during tool runs.

## Final answer to your question

- Yes, the desktop app executes tool workloads locally by design.
- Yes, user machine CPU is consumed during those runs.
- Seeing high CPU (sometimes near 100% for a process/core) can be expected while execution is active.
- It is only a concern if high usage persists after runs complete or processes get stuck.

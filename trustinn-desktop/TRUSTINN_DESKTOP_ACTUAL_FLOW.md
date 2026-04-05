# TrustInn Desktop: What Actually Happens

Date: 2026-04-05
Path: /root/trustinn/client/trustinn-desktop

## 1) What this project is
This is an Electron wrapper for the live TrustInn site.
- UI source loaded in desktop window: https://trustinn.nitminer.com
- Local desktop server runs for heavy tool actions on user machine

So this project is hybrid:
- Remote UI and normal site APIs from domain
- Local compile/execute APIs for user CPU execution

## 2) Startup flow (real runtime)
From package scripts:
- npm run start -> electron .

Electron main process:
- File: electron/main.js
- Starts local server at 127.0.0.1:4310
- Opens BrowserWindow and loads https://trustinn.nitminer.com
- Injects preload script
- Configures download save path to:
  1) <install-dir>/TrustInnDownloads (preferred)
  2) <User Downloads>/TrustInnDownloads (fallback)

## 3) Request routing logic
File: electron/preload.js

The preload overrides window.fetch and reroutes only these paths to local server:
- /api/tools/execute
- /api/tools/compile
- /api/tools/compile-stream

Reroute target:
- http://127.0.0.1:4310

Everything else remains on:
- https://trustinn.nitminer.com

## 4) Local execution server behavior
File: local-server/server.js

Server binds to:
- 127.0.0.1 only

CORS allowlist:
- only origin https://trustinn.nitminer.com

Endpoints implemented locally:
- GET /health
- POST /api/tools/compile
- POST /api/tools/compile-stream (SSE)
- POST /api/tools/execute

Local tools used by language:
- C: gcc
- Java: javac + java
- Python: python3
- Solidity: solc

If compiler/runtime is missing, response returns clear error like:
- gcc not found on this system
- javac not found on this system
- python3 not found on this system
- solc not found on this system

## 5) Build output status in this folder
Build artifacts found in dist:
- TrustInn Desktop Setup 1.2.0.exe
- TrustInn Desktop Setup 1.2.0.exe.blockmap
- builder-debug.yml
- builder-effective-config.yaml
- win-unpacked/

Version from package.json:
- 1.2.0

## 6) What is happening practically for user
When user clicks Run/Compile in desktop app:
1. UI is still trustinn.nitminer.com in Electron window
2. fetch for tool endpoints is intercepted by preload
3. request is redirected to local server on 127.0.0.1:4310
4. local machine compiler/runtime executes code
5. result returns to UI and appears in same TrustInn interface

This is why desktop mode uses user CPU for tool execution while preserving live web UI.

## 7) Important constraints
- Desktop app depends on local toolchain availability (gcc/javac/java/python3/solc)
- If toolchain is not installed, compile/execute fails for that language
- Only the three tool endpoints are local; auth/chat and other APIs remain remote

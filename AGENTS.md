# AGENTS.md

Operational rules for AI coding agents working in this repo.

## Project shape

- Vue 3 + TypeScript + Vite + Tailwind + Pinia.
- Two webview entrypoints share one bundle (`src/main.ts`):
  - **Plugin** (`src/plugin/index.vue`) — background logic, talks to StreamDock host over WebSocket. Auto-loads every file under `src/plugin/actions/*.ts`.
  - **Property Inspector** (`src/pages/index.vue`) — settings UI per action. Loads `src/pages/actions/<actionName>.vue` based on `window.argv[4].action`.
- Action manifest is declared in `src/manifest.cjs`. The build step (`script/autofile.cjs`) turns it into the StreamDock `manifest.json` and copies the bundle to
  `%APPDATA%\HotSpot\StreamDock\plugins\<PUUID>.sdPlugin`.

## Conventions

- Action UUIDs in `src/manifest.cjs` MUST match the file name (without extension) of both `src/plugin/actions/<name>.ts` and `src/pages/actions/<name>.vue`.
- Plugin-side actions export a `default function (name: string)` and register listeners through `useWatchEvent('action', { ActionID, ... })`.
- Use `plugin.Interval` / `plugin.Timeout` (Web Worker timer) for any periodic refresh — `setInterval` is throttled when the webview is hidden.
- Property Inspectors use `usePropertyStore()`; the store auto-persists `settings` via a deep watch, so inputs only need `v-model` (calling `property.saveSettings()` is a harmless no-op kept for parity with existing PIs).
- Style PIs with the existing Tailwind palette (`bg-[#2a2c30]`, `border-gray-700/70`, gray accents). Keep them simple and consistent across actions.

## PowerShell action

- Bundled scripts live in `public/scripts/*.ps1`. They are copied to the plugin folder by `autofile.cjs`, which **also auto-generates a `<name>.vbs` launcher** for every `.ps1` it finds. The `.vbs` wrapper is what the webview opens — it calls `powershell.exe -WindowStyle Hidden` via `WScript.Shell.Run(..., 0, False)` so **no console window flashes** on key press.
- The webview cannot exec processes directly; it triggers a script by asking the host to `openUrl('file:///<plugin>/scripts/<name>.vbs')`.
- To add a new script: drop `<name>.ps1` into `public/scripts/`, add a matching entry to `bundledScripts` in `src/pages/actions/powershell.vue`, then run `bun pligins`.
- Sample scripts append to `%TEMP%\streamdock-widget-ps.log`; the PI's **Open log** button opens it in Notepad (uses a `.bat` helper since Notepad needs a visible window).

## Mandatory checks before finishing a task

Always run, in this order, and fix anything that fails:

```bash
bun format     # prettier .  --write
bun pligins      # vite build && node ./script/autofile.cjs
```

`bun pligins` must complete with no TypeScript or Vite errors. `bun format` must leave the working tree clean (or only contain intentional formatting changes).

## Things to avoid

- Do not add docstrings, type annotations, or refactors to code you didn't otherwise need to touch.
- Do not introduce new build steps or dependencies without an explicit reason.
- Do not write `.ps1`/`.vbs` files outside `public/scripts/` — the auto-launcher generation only scans that folder.
- Do not use `setInterval`/`setTimeout` from the plugin actions for refresh loops — use the worker-based timers from `usePluginStore`.

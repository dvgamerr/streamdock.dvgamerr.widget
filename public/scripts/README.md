# scripts/

PowerShell scripts that the **PowerShell** action can run.

## Layout

```
scripts/
  hello.ps1            <- sample: writes one line to the log
  system-info.ps1      <- sample: dumps OS / CPU / RAM info
  notify.ps1           <- sample: shows a Windows toast
  hello.vbs            <- auto-generated hidden launcher (one per *.ps1)
  _open-log.bat        <- helper: opens the log file in Notepad
```

## How a script gets executed

1. The Property Inspector dropdown lets you pick `<name>` (without `.ps1`).
2. When the StreamDock key is pressed, the plugin webview asks the host to
   open `file:///.../scripts/<name>.vbs`.
3. `<name>.vbs` is auto-generated at build time and runs:

   ```vb
   sh.Run "powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File ...<name>.ps1", 0, False
   ```

   The `0` window style + `WindowStyle Hidden` means **no console flash** when the
   key is pressed.

## Adding a new script

1. Drop a new `<name>.ps1` file in this folder (in **`public/scripts/`** in the repo,
   or directly in the installed plugin folder if you only want a local change).
2. Add an entry to the `bundledScripts` array in
   `src/pages/actions/powershell.vue` so it appears in the dropdown.
3. Run `pnpm build` (the build step regenerates the matching `.vbs` launcher).

## Verifying output

All sample scripts append to `%TEMP%\streamdock-widget-ps.log`. Use the
**Open log** button in the Property Inspector to view it.

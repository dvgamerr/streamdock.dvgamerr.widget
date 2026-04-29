const path = require('path');
const fs = require('fs-extra');

const manifest = {};
const { PUUID, Actions, i18n, CategoryIcon, Version, Software, ApplicationsToMonitor } = require('../src/manifest.cjs');
console.log('Starting automated build...');

// Development environment setup
if (process.argv[2] === 'dev') {
  fs.removeSync('./dist') || fs.mkdirSync('./dist') || fs.copySync('./public', './dist');
  fs.copyFileSync('./script/_.html', './dist/_.html');
}

// Generate based on user configuration
manifest.Actions = Actions.map((item) => {
  item.Name = item.i18n['en'].Name;
  item.Tooltip = item.i18n['en'].Tooltip;
  item.UUID = `${PUUID}.` + item.UUID;
  item.PropertyInspectorPath = process.argv[2] === 'dev' ? '_.html' : 'index.html';
  return item;
});
manifest.Version = Version;
manifest.Name = i18n['en'].Name;
manifest.Icon = CategoryIcon;
manifest.CategoryIcon = CategoryIcon;
manifest.Category = i18n['en'].Name;
manifest.Description = i18n['en'].Description;
manifest.CodePath = process.argv[2] === 'dev' ? '_.html' : 'index.html';

// Fixed version generation
manifest.SDKVersion = 2;
manifest.Author = 'MiraBox';
manifest.URL = 'http://video.hotspotek.com.cn/';
manifest.OS = [
  {
    Platform: 'mac',
    MinimumVersion: '10.11'
  },
  {
    Platform: 'windows',
    MinimumVersion: '7'
  }
];

// Language file generation
Object.keys(i18n).forEach((item) => {
  const obj = {};
  obj.Name = i18n[item].Name;
  obj.Category = i18n[item].Name;
  obj.Description = i18n[item].Description;
  manifest.Actions.forEach((action) => {
    obj[action.UUID] = {
      Name: action.i18n[item].Name,
      Tooltip: action.i18n[item].Tooltip
    };
  });
  obj.Localization = {};
  fs.writeJSONSync(`./dist/${item}.json`, obj);
});

// Generate manifest file
manifest.Actions = manifest.Actions.map((item) => {
  delete item.i18n;
  return item;
});
manifest.Software = Software;
manifest.ApplicationsToMonitor = ApplicationsToMonitor;
fs.writeJSONSync('./dist/manifest.json', manifest, { spaces: 2, EOL: '\r\n' });

// Auto-generate one launcher per PowerShell script in dist/scripts/.
// We emit a .vbs wrapper (instead of .bat) so the cmd console window does
// NOT flash on key press. The .vbs uses WScript.Shell.Run with windowStyle=0
// to launch powershell.exe completely hidden.
const scriptsDir = './dist/scripts';
if (fs.existsSync(scriptsDir)) {
  const psFiles = fs.readdirSync(scriptsDir).filter((f) => f.toLowerCase().endsWith('.ps1'));
  psFiles.forEach((file) => {
    const base = path.basename(file, path.extname(file));
    const vbsPath = path.join(scriptsDir, `${base}.vbs`);
    const vbsBody =
      `' Auto-generated hidden launcher for ${base}.ps1 — do not edit by hand.\r\n` +
      `Set sh  = CreateObject("WScript.Shell")\r\n` +
      `Set fso = CreateObject("Scripting.FileSystemObject")\r\n` +
      `dir = fso.GetParentFolderName(WScript.ScriptFullName)\r\n` +
      `cmd = "pwsh.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File """ & dir & "\\${base}.ps1"""\r\n` +
      `sh.Run cmd, 0, False\r\n`;
    fs.writeFileSync(vbsPath, vbsBody, { encoding: 'utf8' });
  });
  console.log(`Generated ${psFiles.length} hidden PowerShell launcher(s).`);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function removePathWithRetries(targetPath, maxAttempts = 8) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await fs.promises.rm(targetPath, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200
      });
      return;
    } catch (error) {
      const canRetry = ['EBUSY', 'ENOTEMPTY', 'EPERM', 'EMFILE', 'ENFILE'].includes(error.code);
      if (!canRetry || attempt === maxAttempts) {
        throw error;
      }

      const delay = attempt * 500;
      console.warn(`Path is busy. Retrying remove in ${delay}ms (${attempt}/${maxAttempts}): ${targetPath}`);
      await wait(delay);
    }
  }
}

async function clearDirWithRetries(targetPath) {
  await fs.ensureDir(targetPath);
  const entries = await fs.readdir(targetPath);

  for (const entry of entries) {
    await removePathWithRetries(path.join(targetPath, entry));
  }
}

// Copy to plugin folder
const PluginName = `${PUUID}.sdPlugin`;
const PluginPath = path.join(process.env.APPDATA, 'HotSpot/StreamDock/plugins', PluginName);

(async () => {
  fs.ensureDirSync(path.dirname(PluginPath));
  await clearDirWithRetries(PluginPath);
  await fs.copy('./dist', PluginPath, { overwrite: true });
})().catch((error) => {
  console.error(`Failed to publish plugin to ${PluginPath}.`, error);
  process.exitCode = 1;
});

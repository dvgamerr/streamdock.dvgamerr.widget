<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { usePropertyStore, useWatchEvent } from '@/hooks/property';

  const property = usePropertyStore();

  // Defaults
  if (!property.settings.script) {
    property.settings.script = 'SleepMonitor';
  }
  if (property.settings.label === undefined) {
    property.settings.label = '';
  }

  // List of bundled scripts. Keep in sync with public/scripts/*.ps1.
  // Adding a new entry here + dropping a matching <name>.ps1 file into
  // public/scripts/ is all that's needed.
  const bundledScripts = [
    { value: 'SleepMonitor', name: 'SleepMonitor.ps1', desc: 'Turns the monitor off (sends WM_SYSCOMMAND SC_MONITORPOWER)' },
    { value: 'ToggleAudioDevices', name: 'ToggleAudioDevices.ps1', desc: 'Toggles default playback device + toast (needs AudioDeviceCmdlets + BurntToast)' }
  ];

  const status = ref<string>('');

  // Resolve the plugin's install root from the PI document URL.
  const getPluginRoot = () => {
    const href = window.location.href;
    const lastSlash = href.lastIndexOf('/');
    return lastSlash === -1 ? href : href.slice(0, lastSlash);
  };

  const openScriptsFolder = () => {
    property.openUrl(`${getPluginRoot()}/scripts/`);
    status.value = 'Opened scripts folder.';
  };

  const openLogFile = () => {
    // Some scripts may write to %TEMP%\streamdock-widget-ps.log; this opens it.
    // We can't read %TEMP% from the webview, so we just open the launcher
    // helper that opens the log in Notepad.
    property.openUrl(`${getPluginRoot()}/scripts/_open-log.bat`);
    status.value = 'Opening log...';
  };

  const testRun = () => {
    // Tell the plugin side to run the configured script now.
    property.sendToPlugin({ event: 'test-run' });
    status.value = `Triggered: ${property.settings.script}.ps1`;
  };

  onMounted(() => {
    status.value = 'Pick a script, then assign on the key.';
  });

  useWatchEvent({
    didReceiveSettings(_data) {},
    sendToPropertyInspector(_data) {},
    didReceiveGlobalSettings(_data) {}
  });
</script>

<template>
  <div class="text-md px-5 py-3 text-gray-300">
    <!-- title -->
    <div class="flex items-center gap-4">
      <div class="h-px flex-1 bg-gray-700/70"></div>
      <div class="text-md font-medium tracking-wide text-gray-400">powershell runner</div>
      <div class="h-px flex-1 bg-gray-700/70"></div>
    </div>

    <!-- Script selector -->
    <div class="mt-4 grid grid-cols-[auto_1fr] items-center gap-3">
      <label class="text-md text-gray-300 text-right">Script:</label>
      <div class="relative">
        <select
          v-model="property.settings.script"
          @change="property.saveSettings()"
          class="w-full appearance-none rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 pr-10 text-md text-gray-100 outline-none ring-0 transition focus:border-gray-500"
        >
          <option v-for="s in bundledScripts" :key="s.value" :value="s.value">{{ s.name }}</option>
        </select>
        <svg class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>

    <!-- Optional label -->
    <div class="mt-4 grid grid-cols-[auto_1fr] items-center gap-3">
      <label class="text-md text-gray-300 text-right">Label:</label>
      <div>
        <input
          v-model="property.settings.label"
          @input="property.saveSettings()"
          type="text"
          placeholder="Shown on the key (optional)"
          class="w-full rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-gray-500"
        />
      </div>
    </div>

    <!-- Action buttons -->
    <div class="mt-4 grid grid-cols-3 gap-2">
      <button
        type="button"
        @click="testRun"
        class="rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 outline-none transition hover:border-gray-500 hover:bg-[#33363b]"
      >
        Test run
      </button>
      <button
        type="button"
        @click="openScriptsFolder"
        class="rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 outline-none transition hover:border-gray-500 hover:bg-[#33363b]"
      >
        Edit scripts
      </button>
      <button
        type="button"
        @click="openLogFile"
        class="rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 outline-none transition hover:border-gray-500 hover:bg-[#33363b]"
      >
        Open log
      </button>
    </div>

    <!-- Help text -->
    <div class="mt-3 rounded-md bg-gray-800/50 px-3 py-2 text-xs text-gray-400">
      <strong>How it works:</strong> Each <code>scripts/&lt;name&gt;.vbs</code> wraps <code>powershell.exe -WindowStyle Hidden -File &lt;name&gt;.ps1</code> so the console window
      stays hidden. Click <em>Edit scripts</em> to open the folder and modify the <code>.ps1</code> file directly. Use <em>Test run</em> or press the key to launch. Output is
      written to <code>%TEMP%\streamdock-widget-ps.log</code>.
    </div>

    <div v-if="status" class="mt-2 text-xs text-gray-500">{{ status }}</div>

    <div class="mt-3 h-px w-full bg-gray-700/40"></div>
  </div>
</template>

<style lang="scss" scoped></style>

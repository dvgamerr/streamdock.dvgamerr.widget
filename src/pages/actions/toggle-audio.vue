<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { usePropertyStore, useWatchEvent } from '@/hooks/property';

  const property = usePropertyStore();

  if (!property.settings.device1Match) property.settings.device1Match = '*Sound Blaster GS5*';
  if (!property.settings.device1Show) property.settings.device1Show = 'Speakers (GS5)';
  if (!property.settings.device2Match) property.settings.device2Match = '*Sound Blaster X5*';
  if (!property.settings.device2Show) property.settings.device2Show = 'Headphones (X5)';

  const status = ref('');

  const getPluginRoot = () => {
    const href = window.location.href;
    const lastSlash = href.lastIndexOf('/');
    return lastSlash === -1 ? href : href.slice(0, lastSlash);
  };

  const applyConfig = () => {
    const config = JSON.stringify({
      device1Match: property.settings.device1Match,
      device1Show: property.settings.device1Show,
      device2Match: property.settings.device2Match,
      device2Show: property.settings.device2Show
    });

    // Copy config JSON to clipboard; the VBS will read it and write toggle-audio-config.json.
    try {
      navigator.clipboard.writeText(config);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = config;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    property.openUrl(`${getPluginRoot()}/scripts/toggle-audio-save-config.vbs`);
    status.value = 'Config copied to clipboard — PS1 will save it.';
  };

  onMounted(() => {
    status.value = 'Set device match patterns, then click Apply Config.';
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
      <div class="text-md font-medium tracking-wide text-gray-400">toggle audio device</div>
      <div class="h-px flex-1 bg-gray-700/70"></div>
    </div>

    <!-- Device 1 — Soundbar -->
    <div class="mt-4 flex items-center gap-2">
      <div class="h-px flex-1 bg-gray-700/40"></div>
      <span class="text-xs text-gray-500">Device 1 · Soundbar / Speakers</span>
      <div class="h-px flex-1 bg-gray-700/40"></div>
    </div>

    <div class="mt-3 grid grid-cols-[80px_1fr] items-center gap-3">
      <label class="text-right text-sm text-gray-400">Match:</label>
      <input
        v-model="property.settings.device1Match"
        type="text"
        placeholder="e.g. *Sound Blaster GS5*"
        class="w-full rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-gray-500"
      />
    </div>
    <div class="mt-2 grid grid-cols-[80px_1fr] items-center gap-3">
      <label class="text-right text-sm text-gray-400">Label:</label>
      <input
        v-model="property.settings.device1Show"
        type="text"
        placeholder="e.g. Speakers (GS5)"
        class="w-full rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-gray-500"
      />
    </div>

    <!-- Device 2 — Headphone -->
    <div class="mt-4 flex items-center gap-2">
      <div class="h-px flex-1 bg-gray-700/40"></div>
      <span class="text-xs text-gray-500">Device 2 · Headphones</span>
      <div class="h-px flex-1 bg-gray-700/40"></div>
    </div>

    <div class="mt-3 grid grid-cols-[80px_1fr] items-center gap-3">
      <label class="text-right text-sm text-gray-400">Match:</label>
      <input
        v-model="property.settings.device2Match"
        type="text"
        placeholder="e.g. *Sound Blaster X5*"
        class="w-full rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-gray-500"
      />
    </div>
    <div class="mt-2 grid grid-cols-[80px_1fr] items-center gap-3">
      <label class="text-right text-sm text-gray-400">Label:</label>
      <input
        v-model="property.settings.device2Show"
        type="text"
        placeholder="e.g. Headphones (X5)"
        class="w-full rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-gray-500"
      />
    </div>

    <!-- Apply button -->
    <div class="mt-5">
      <button
        @click="applyConfig"
        class="w-full rounded-md border border-gray-600 bg-[#3a3c40] px-3 py-2 text-sm text-gray-200 transition hover:border-gray-500 hover:bg-[#44464a] active:opacity-70"
      >
        Apply Config
      </button>
    </div>

    <div v-if="status" class="mt-3 text-center text-xs text-gray-500">{{ status }}</div>
  </div>
</template>

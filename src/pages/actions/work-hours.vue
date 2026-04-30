<script setup lang="ts">
  import { usePropertyStore, useWatchEvent } from '@/hooks/property';

  const property = usePropertyStore();

  if (property.settings.startH === undefined) property.settings.startH = 9;
  if (property.settings.endH === undefined) property.settings.endH = 18;

  useWatchEvent({
    didReceiveSettings(data) {},
    sendToPropertyInspector(data) {},
    didReceiveGlobalSettings(data) {}
  });
</script>

<template>
  <div class="text-md px-5 py-3 text-gray-300">
    <!-- Section header -->
    <div class="flex items-center gap-4">
      <div class="h-px flex-1 bg-gray-700/70"></div>
      <div class="text-md font-medium tracking-wide text-gray-400">work hours clock</div>
      <div class="h-px flex-1 bg-gray-700/70"></div>
    </div>

    <!-- Start / End times -->
    <div class="mt-4 grid grid-cols-2 gap-3">
      <div class="grid grid-cols-[auto_1fr] items-center gap-2">
        <label class="text-md text-right text-gray-300">Start:</label>
        <input
          v-model.number="property.settings.startH"
          type="number"
          min="0"
          max="23"
          class="w-full rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 outline-none ring-0 transition focus:border-gray-500"
        />
      </div>
      <div class="grid grid-cols-[auto_1fr] items-center gap-2">
        <label class="text-md text-right text-gray-300">End:</label>
        <input
          v-model.number="property.settings.endH"
          type="number"
          min="0"
          max="23"
          class="w-full rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 outline-none ring-0 transition focus:border-gray-500"
        />
      </div>
    </div>

    <div class="mt-3 text-xs text-gray-500">Mon – Fri only. Canvas updates every minute.</div>

    <!-- Preview hint -->
    <div class="mt-4 rounded-md border border-gray-700/70 bg-[#1f2124] px-3 py-2 text-xs text-gray-500">
      <span class="text-orange-400">WORK</span> — warm glow, progress bar shows time into workday.<br />
      <span class="text-gray-400">REST</span> — cool/dim, shows current time &amp; day.
    </div>
  </div>
</template>

<script setup lang="ts">
  import { usePropertyStore, useWatchEvent } from '@/hooks/property';

  const property = usePropertyStore();

  if (!property.settings.lat) property.settings.lat = '13.72';
  if (!property.settings.lon) property.settings.lon = '100.41';
  if (!property.settings.interval) property.settings.interval = 1800000;

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
      <div class="text-md font-medium tracking-wide text-gray-400">weather</div>
      <div class="h-px flex-1 bg-gray-700/70"></div>
    </div>

    <!-- Latitude -->
    <div class="mt-4 grid grid-cols-[auto_1fr] items-center gap-3">
      <label class="text-md text-right text-gray-300">Latitude:</label>
      <input
        v-model="property.settings.lat"
        type="text"
        placeholder="13.72"
        class="w-full rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-gray-500"
      />
    </div>

    <!-- Longitude -->
    <div class="mt-3 grid grid-cols-[auto_1fr] items-center gap-3">
      <label class="text-md text-right text-gray-300">Longitude:</label>
      <input
        v-model="property.settings.lon"
        type="text"
        placeholder="100.41"
        class="w-full rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-gray-500"
      />
    </div>

    <div class="mt-2 text-xs text-gray-500">Default: Nong Khaem, Bangkok (13.72, 100.41)</div>

    <!-- Refresh interval -->
    <div class="mt-4 grid grid-cols-[auto_1fr] items-center gap-3">
      <label class="text-md text-right text-gray-300">Refresh:</label>
      <select
        v-model.number="property.settings.interval"
        class="w-full appearance-none rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 outline-none ring-0 transition focus:border-gray-500"
      >
        <option :value="900000">15 min</option>
        <option :value="1800000">30 min</option>
        <option :value="3600000">1 hour</option>
      </select>
    </div>

    <!-- Info note -->
    <div class="mt-4 rounded-md border border-gray-700/70 bg-[#1f2124] px-3 py-2 text-xs text-gray-500">
      Data: Open-Meteo (free, no API key).<br />
      Bar chart = precipitation % for next 6 h.<br />
      Press key to refresh immediately.
    </div>
  </div>
</template>

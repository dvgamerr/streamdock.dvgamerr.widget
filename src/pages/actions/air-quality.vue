<script setup lang="ts">
  import { usePropertyStore, useWatchEvent } from '@/hooks/property';

  // Event listener
  const property = usePropertyStore();

  // Initialize settings with defaults
  if (!property.settings.url) {
    property.settings.url = 'https://www.iqair.com/th-en/thailand/bangkok/nong-khaem';
  }
  if (!property.settings.interval) {
    property.settings.interval = 3600000; // 1 hour default
  }

  useWatchEvent({
    didReceiveSettings(data) {},
    sendToPropertyInspector(data) {},
    didReceiveGlobalSettings(data) {}
  });
</script>

<template>
  <div class="text-md px-5 py-3 text-gray-300">
    <!-- title with horizontal lines -->
    <div class="flex items-center gap-4">
      <div class="h-px flex-1 bg-gray-700/70"></div>
      <div class="text-md font-medium tracking-wide text-gray-400">air quality monitor</div>
      <div class="h-px flex-1 bg-gray-700/70"></div>
    </div>

    <!-- IQAir URL field -->
    <div class="mt-4 grid grid-cols-[auto_1fr] items-center gap-3">
      <label class="text-md text-gray-300 text-right">IQAir URL:</label>
      <div>
        <input
          v-model="property.settings.url"
          @input="property.saveSettings()"
          type="text"
          placeholder="https://www.iqair.com/th-en/thailand/bangkok/nong-khaem"
          class="w-full rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-gray-500"
        />
      </div>
    </div>

    <!-- Refresh Interval -->
    <div class="mt-4 grid grid-cols-[auto_1fr] items-center gap-3">
      <label class="text-md text-gray-300 text-right">Refresh:</label>
      <div class="relative">
        <select
          v-model.number="property.settings.interval"
          @change="property.saveSettings()"
          class="w-full appearance-none rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 pr-10 text-md text-gray-100 outline-none ring-0 transition focus:border-gray-500"
        >
          <option :value="3600000">1 hour</option>
          <option :value="14400000">4 hours</option>
          <option :value="21600000">6 hours</option>
          <option :value="43200000">12 hours</option>
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

    <!-- Help text -->
    <div class="mt-3 rounded-md bg-gray-800/50 px-3 py-2 text-xs text-gray-400">
      <strong>Tip:</strong> Paste any IQAir location URL (e.g., <code>iqair.com/th-en/thailand/&lt;city&gt;/&lt;district&gt;</code>). Press the key to refresh manually.
    </div>

    <!-- bottom divider -->
    <div class="mt-3 h-px w-full bg-gray-700/40"></div>
  </div>
</template>

<style lang="scss" scoped></style>

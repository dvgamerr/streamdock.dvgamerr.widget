<script setup lang="ts">
  import { usePropertyStore, useWatchEvent } from '@/hooks/property';

  // Event listener
  const property = usePropertyStore();
  const normalizeSegment = (value: string | undefined, fallback: string) => {
    const cleaned = (value || '')
      .trim()
      .toLowerCase()
      .replace(/[\\/]+/g, '-')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return cleaned || fallback;
  };

  const getIqAirUrl = () => {
    const city = normalizeSegment(property.settings.city, 'bangkok');
    const district = normalizeSegment(property.settings.district, 'sathorn-district');
    return `https://www.iqair.com/thailand/${city}/${city}/${district}`;
  };

  // Initialize settings with defaults
  if (!property.settings.interval) {
    property.settings.interval = 3600000; // 1 hour default
  }
  if (!property.settings.city) {
    property.settings.city = 'bangkok';
  }
  if (!property.settings.district) {
    property.settings.district = 'sathorn-district';
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
      <div class="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"></div>
      <div class="text-md font-medium tracking-wide text-purple-400 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
        air quality monitor
      </div>
      <div class="h-px flex-1 bg-gradient-to-l from-transparent via-purple-500/40 to-transparent"></div>
    </div>

    <!-- City field -->
    <div class="mt-4 grid grid-cols-[auto_1fr] items-center gap-3">
      <label class="text-md text-gray-300 text-right">City:</label>
      <div>
        <input
          v-model="property.settings.city"
          @input="property.saveSettings()"
          type="text"
          placeholder="bangkok"
          class="w-full rounded-lg border border-purple-700/40 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
        />
      </div>
    </div>

    <!-- District field -->
    <div class="mt-4 grid grid-cols-[auto_1fr] items-center gap-3">
      <label class="text-md text-gray-300 text-right">District:</label>
      <div>
        <input
          v-model="property.settings.district"
          @input="property.saveSettings()"
          type="text"
          placeholder="sathorn-district"
          class="w-full rounded-lg border border-purple-700/40 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
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
          class="w-full appearance-none rounded-lg border border-purple-700/40 bg-[#2a2c30] px-3 py-2 pr-10 text-md text-gray-100 outline-none ring-0 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
        >
          <option :value="3600000">1 hour</option>
          <option :value="14400000">4 hours</option>
          <option :value="21600000">6 hours</option>
          <option :value="43200000">12 hours</option>
        </select>
        <svg class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* Custom scrollbar for better aesthetics */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #1a1c20;
  }

  ::-webkit-scrollbar-thumb {
    background: #6b21a8;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #7c3aed;
  }
</style>

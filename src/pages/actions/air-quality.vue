<script setup lang="ts">
  import { usePropertyStore, useWatchEvent } from '@/hooks/property';
  import { useI18nStore } from '@/hooks/i18n';

  // Event listener
  const i18n = useI18nStore();
  const property = usePropertyStore();

  // Initialize settings with defaults
  if (!property.settings.latitude) {
    property.settings.latitude = '13.7';
  }
  if (!property.settings.longitude) {
    property.settings.longitude = '100.5';
  }
  if (!property.settings.interval) {
    property.settings.interval = 3600000; // 1 hour default
  }
  if (!property.settings.locationName) {
    property.settings.locationName = 'Bangkok';
  }
  if (!property.settings.pm25Threshold) {
    property.settings.pm25Threshold = 35;
  }
  if (!property.settings.pm10Threshold) {
    property.settings.pm10Threshold = 50;
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>
        </svg>
        air quality monitor
      </div>
      <div class="h-px flex-1 bg-gradient-to-l from-transparent via-purple-500/40 to-transparent"></div>
    </div>

    <!-- Location Name -->
    <div class="mt-4 grid grid-cols-[auto_1fr] items-center gap-3">
      <label class="text-md text-gray-300 text-right">Location:</label>
      <div>
        <input
          v-model="property.settings.locationName"
          @input="property.saveSettings()"
          type="text"
          placeholder="e.g., Bangkok"
          class="w-full rounded-lg border border-purple-700/40 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
        />
      </div>
    </div>

    <!-- Coordinates (Latitude and Longitude) -->
    <div class="mt-4 grid grid-cols-[auto_1fr_auto_1fr] items-center gap-3">
      <label class="text-md text-gray-300 text-right">Latitude:</label>
      <div>
        <input
          v-model="property.settings.latitude"
          @input="property.saveSettings()"
          type="text"
          placeholder="13.7"
          class="w-full rounded-lg border border-purple-700/40 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      <label class="text-md text-gray-300 text-right">Longitude:</label>
      <div>
        <input
          v-model="property.settings.longitude"
          @input="property.saveSettings()"
          type="text"
          placeholder="100.5"
          class="w-full rounded-lg border border-purple-700/40 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
        />
      </div>
    </div>

    <!-- Alert Thresholds -->
    <div class="mt-5 pt-4 border-t border-purple-900/30">
      <div class="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        Alert Thresholds
      </div>

      <div class="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-3">
        <label class="text-md text-gray-300 text-right">PM 2.5:</label>
        <div>
          <input
            v-model.number="property.settings.pm25Threshold"
            @input="property.saveSettings()"
            type="number"
            step="1"
            placeholder="35"
            class="w-full rounded-lg border border-purple-700/40 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <label class="text-md text-gray-300 text-right">PM 10:</label>
        <div>
          <input
            v-model.number="property.settings.pm10Threshold"
            @input="property.saveSettings()"
            type="number"
            step="1"
            placeholder="50"
            class="w-full rounded-lg border border-purple-700/40 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>
    </div>

    <!-- Info box -->
    <div class="mt-4 rounded-lg bg-purple-950/30 border border-purple-800/30 px-3 py-2">
      <p class="text-xs text-gray-400 leading-relaxed">
        <span class="font-semibold text-purple-400">💡 Tips:</span> PM 2.5 > 35 μg/m³ and PM 10 > 50 μg/m³ are considered unhealthy levels. 
        You can find coordinates at <a href="https://www.latlong.net/" target="_blank" class="text-purple-400 hover:text-purple-300 underline">latlong.net</a>
      </p>
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
        <svg
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>

    <!-- AQI Reference Guide -->
    <div class="mt-5 pt-4 border-t border-purple-900/30">
      <div class="text-sm font-medium text-purple-400 mb-2">AQI Reference Guide</div>
      <div class="space-y-1.5 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-green-500"></div>
          <span class="text-gray-400">Good (0-35 μg/m³)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span class="text-gray-400">Moderate (36-75 μg/m³)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-orange-500"></div>
          <span class="text-gray-400">Unhealthy (76-115 μg/m³)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-red-500"></div>
          <span class="text-gray-400">Very Unhealthy (116+ μg/m³)</span>
        </div>
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

<script setup lang="ts">
  import { usePropertyStore, useWatchEvent, TabView } from '@/hooks/property';
  import { useI18nStore } from '@/hooks/i18n';

  // Event listener
  const i18n = useI18nStore();
  const property = usePropertyStore();

  // Initialize settings with default
  if (!property.settings.interval) {
    property.settings.interval = 15;
  }
  if (!property.settings.currency) {
    property.settings.currency = 'USD';
  }

  useWatchEvent({
    didReceiveSettings(data) {},
    sendToPropertyInspector(data) {},
    didReceiveGlobalSettings(data) {}
  });
</script>

<template>
  <div class="text-sm px-5 py-3 text-gray-300">
    <!-- title with horizontal lines -->
    <div class="flex items-center gap-4">
      <div class="h-px flex-1 bg-gray-400/70"></div>
      <div class="text-xs font-medium tracking-wide text-gray-400">
        {{ i18n['Action Settings'] }}
      </div>
      <div class="h-px flex-1 bg-gray-400/70"></div>
    </div>
    <div class="mt-4 grid grid-cols-[auto_1fr_auto_1fr] items-center gap-3">
      <label class="text-sm font-bold text-gray-400">Interval:</label>

      <div>
        <select
          v-model="property.settings.interval"
          @change="property.saveSettings()"
          class="w-full px-3 py-2.5 bg-[#2d2d2d] border border-[#404040] rounded cursor-pointer outline-none focus:border-[#505050] transition-colors"
        >
          <option :value="3">3 seconds</option>
          <option :value="6">6 seconds</option>
          <option :value="9">9 seconds</option>
          <option :value="15">15 seconds</option>
        </select>
      </div>

      <label class="text-sm font-bold text-gray-400">Currency:</label>

      <div>
        <select
          v-model="property.settings.currency"
          @change="property.saveSettings()"
          class="w-full px-3 py-2.5 bg-[#2d2d2d] border border-[#404040] rounded cursor-pointer outline-none focus:border-[#505050] transition-colors"
        >
          <option value="USD">USD</option>
          <option value="THB">THB</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
  import { usePropertyStore, useWatchEvent } from '@/hooks/property';
  import { useI18nStore } from '@/hooks/i18n';

  // Event listener
  const i18n = useI18nStore();
  const property = usePropertyStore();

  // Initialize settings with defaults
  if (!property.settings.symbol) {
    property.settings.symbol = 'AAPL';
  }
  if (!property.settings.interval) {
    property.settings.interval = 10000;
  }
  if (!property.settings.cost) {
    property.settings.cost = '';
  }
  if (!property.settings.qty) {
    property.settings.qty = '';
  }
  if (!property.settings.displayName) {
    property.settings.displayName = '';
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
      <div class="text-md font-medium tracking-wide text-gray-400">
        stock price monitor
      </div>
      <div class="h-px flex-1 bg-gray-700/70"></div>
    </div>

    <!-- Stock Symbol and Display Name in one row -->
    <div class="mt-4 grid grid-cols-[auto_1fr_2fr] items-center gap-3">
      <label class="text-md text-gray-300 text-right">Stock symbol:</label>
      <div>
        <input
          v-model="property.settings.symbol"
          @input="property.saveSettings()"
          type="text"
          placeholder="e.g., AAPL"
          class="w-full rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-gray-500"
        />
      </div>

      <div>
        <input
          v-model="property.settings.displayName"
          @input="property.saveSettings()"
          type="text"
          placeholder="Display name (optional)"
          class="w-full rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-gray-500"
        />
      </div>
    </div>

    <!-- Cost and Quantity (Optional) -->
    <div class="mt-4 grid grid-cols-[auto_1fr_auto_1fr] items-center gap-3">
      <label class="text-md text-gray-300 text-right">Cost:</label>
      <div>
        <input
          v-model="property.settings.cost"
          @input="property.saveSettings()"
          type="number"
          step="0.01"
          placeholder="Purchase price"
          class="w-full rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 text-md text-gray-100 placeholder-gray-500 outline-none ring-0 transition focus:border-gray-500"
        />
      </div>

      <label class="text-md text-gray-300 text-right">Quantity:</label>
      <div>
        <input
          v-model="property.settings.qty"
          @input="property.saveSettings()"
          type="number"
          step="1"
          placeholder="Shares"
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
          <option :value="5000">5 seconds</option>
          <option :value="10000">10 seconds</option>
          <option :value="15000">15 seconds</option>
          <option :value="30000">30 seconds</option>
          <option :value="60000">1 minute</option>
          <option :value="300000">5 minutes</option>
        </select>
        <svg
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
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
      <strong>Note:</strong> If cost and quantity are set, profit/loss % will be calculated based on your purchase. Otherwise, the API's daily % change will be displayed.
    </div>

    <!-- bottom divider -->
    <div class="mt-3 h-px w-full bg-gray-700/40"></div>
  </div>
</template>

<style lang="scss" scoped></style>

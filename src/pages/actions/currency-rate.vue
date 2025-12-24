<script setup lang="ts">
  import { usePropertyStore, useWatchEvent } from '@/hooks/property';
  import { useI18nStore } from '@/hooks/i18n';

  // Event listener
  const i18n = useI18nStore();
  const property = usePropertyStore();

  // Currency options
  const currencies = [
    { code: 'AED', name: 'UAE Dirham' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'BRL', name: 'Brazilian Real' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'DKK', name: 'Danish Krone' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'HKD', name: 'Hong Kong Dollar' },
    { code: 'IDR', name: 'Indonesian Rupiah' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'KRW', name: 'South Korean Won' },
    { code: 'MXN', name: 'Mexican Peso' },
    { code: 'MYR', name: 'Malaysian Ringgit' },
    { code: 'NOK', name: 'Norwegian Krone' },
    { code: 'NZD', name: 'New Zealand Dollar' },
    { code: 'PHP', name: 'Philippine Peso' },
    { code: 'PLN', name: 'Polish Złoty' },
    { code: 'RUB', name: 'Russian Ruble' },
    { code: 'SAR', name: 'Saudi Riyal' },
    { code: 'SEK', name: 'Swedish Krona' },
    { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'THB', name: 'Thai Baht' },
    { code: 'TRY', name: 'Turkish Lira' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'VND', name: 'Vietnamese Dong' },
    { code: 'ZAR', name: 'South African Rand' }
  ];

  // Initialize settings with defaults
  if (!property.settings.from) {
    property.settings.from = 'USD';
  }
  if (!property.settings.to) {
    property.settings.to = 'THB';
  }
  if (!property.settings.interval) {
    property.settings.interval = 10000;
  }

  // Swap currencies
  const swapCurrencies = () => {
    const temp = property.settings.from;
    property.settings.from = property.settings.to;
    property.settings.to = temp;
    property.saveSettings();
  };

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
        exchange rate conversion
      </div>
      <div class="h-px flex-1 bg-gray-700/70"></div>
    </div>

    <!-- row: selects + swap -->
    <div class="mt-4 grid grid-cols-[auto_1fr_auto_1fr] items-center gap-3">
      <label class="text-md text-gray-300">Select currency:</label>

      <div class="relative">
        <select
          v-model="property.settings.from"
          @change="property.saveSettings()"
          class="w-full appearance-none rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 pr-10 text-md text-gray-100 outline-none ring-0 transition focus:border-gray-500"
        >
          <option v-for="currency in currencies" :key="currency.code" :value="currency.code">
            {{ currency.code }} - {{ currency.name }}
          </option>
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

      <button
        type="button"
        @click="swapCurrencies"
        class="grid h-10 w-10 place-items-center rounded-md border border-transparent text-gray-400 hover:text-gray-200 transition-colors"
        aria-label="Swap currencies"
        title="Swap"
      >
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M16 3l4 4-4 4" />
          <path d="M20 7H9" />
          <path d="M8 21l-4-4 4-4" />
          <path d="M4 17h11" />
        </svg>
      </button>

      <div class="relative">
        <select
          v-model="property.settings.to"
          @change="property.saveSettings()"
          class="w-full appearance-none rounded-md border border-gray-700/70 bg-[#2a2c30] px-3 py-2 pr-10 text-md text-gray-100 outline-none ring-0 transition focus:border-gray-500"
        >
          <option v-for="currency in currencies" :key="currency.code" :value="currency.code">
            {{ currency.code }} - {{ currency.name }}
          </option>
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

    <!-- Refresh Interval -->
    <div class="mt-4 grid grid-cols-[auto_1fr] items-center gap-3">
      <label class="text-md text-gray-300">Refresh interval:</label>
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

    <!-- bottom divider -->
    <div class="mt-3 h-px w-full bg-gray-700/40"></div>
  </div>
</template>

<style lang="scss" scoped></style>

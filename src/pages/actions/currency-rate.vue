<script setup lang="ts">
  import { usePropertyStore, useWatchEvent } from '@/hooks/property';
  import { useI18nStore } from '@/hooks/i18n';

  // Event listener
  const i18n = useI18nStore();
  const property = usePropertyStore();

  // Currency options
  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'THB', name: 'Thai Baht' },
    { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'HKD', name: 'Hong Kong Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'KRW', name: 'South Korean Won' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'MYR', name: 'Malaysian Ringgit' },
    { code: 'PHP', name: 'Philippine Peso' },
    { code: 'IDR', name: 'Indonesian Rupiah' },
    { code: 'VND', name: 'Vietnamese Dong' },
    { code: 'NZD', name: 'New Zealand Dollar' },
    { code: 'SEK', name: 'Swedish Krona' },
    { code: 'NOK', name: 'Norwegian Krone' },
    { code: 'DKK', name: 'Danish Krone' },
    { code: 'PLN', name: 'Polish Złoty' },
    { code: 'TRY', name: 'Turkish Lira' },
    { code: 'RUB', name: 'Russian Ruble' },
    { code: 'BRL', name: 'Brazilian Real' },
    { code: 'MXN', name: 'Mexican Peso' },
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'AED', name: 'UAE Dirham' },
    { code: 'SAR', name: 'Saudi Riyal' }
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
        {{ i18n['Currency Rate Settings'] || 'Currency Rate Settings' }}
      </div>
      <div class="h-px flex-1 bg-gray-400/70"></div>
    </div>

    <div class="mt-4 space-y-3">
      <!-- From Currency -->
      <div class="grid grid-cols-[100px_1fr] items-center gap-3">
        <label class="text-sm font-bold text-gray-400">From:</label>
        <div>
          <select
            v-model="property.settings.from"
            @change="property.saveSettings()"
            class="w-full px-3 py-2.5 bg-[#2d2d2d] border border-[#404040] rounded cursor-pointer outline-none focus:border-[#505050] transition-colors"
          >
            <option v-for="currency in currencies" :key="currency.code" :value="currency.code">{{ currency.code }} - {{ currency.name }}</option>
          </select>
        </div>
      </div>

      <!-- To Currency -->
      <div class="grid grid-cols-[100px_1fr] items-center gap-3">
        <label class="text-sm font-bold text-gray-400">To:</label>
        <div>
          <select
            v-model="property.settings.to"
            @change="property.saveSettings()"
            class="w-full px-3 py-2.5 bg-[#2d2d2d] border border-[#404040] rounded cursor-pointer outline-none focus:border-[#505050] transition-colors"
          >
            <option v-for="currency in currencies" :key="currency.code" :value="currency.code">{{ currency.code }} - {{ currency.name }}</option>
          </select>
        </div>
      </div>

      <!-- Refresh Interval -->
      <div class="grid grid-cols-[100px_1fr] items-center gap-3">
        <label class="text-sm font-bold text-gray-400">Refresh:</label>
        <div>
          <select
            v-model.number="property.settings.interval"
            @change="property.saveSettings()"
            class="w-full px-3 py-2.5 bg-[#2d2d2d] border border-[#404040] rounded cursor-pointer outline-none focus:border-[#505050] transition-colors"
          >
            <option :value="5000">5 seconds</option>
            <option :value="10000">10 seconds</option>
            <option :value="15000">15 seconds</option>
            <option :value="30000">30 seconds</option>
            <option :value="60000">1 minute</option>
            <option :value="300000">5 minutes</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Info Section -->
    <div class="mt-6 p-3 bg-[#2d2d2d] border border-[#404040] rounded">
      <div class="text-xs text-gray-400 space-y-1">
        <div class="font-bold text-gray-300">Currency Pair:</div>
        <div class="font-mono text-[#FFD700]">{{ property.settings.from || 'USD' }}/{{ property.settings.to || 'THB' }}</div>
        <div class="mt-2 text-gray-500 text-[10px]">Data source: Yahoo Finance</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

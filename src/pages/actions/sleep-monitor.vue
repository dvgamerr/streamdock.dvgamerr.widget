<script setup lang="ts">
  import { usePropertyStore, useWatchEvent } from '@/hooks/property';

  const property = usePropertyStore();

  useWatchEvent({
    didReceiveSettings(_data) {},
    sendToPropertyInspector(_data) {},
    didReceiveGlobalSettings(_data) {}
  });
</script>

<template>
  <div class="text-md px-5 py-3 text-gray-300">
    <div class="flex items-center gap-4">
      <div class="h-px flex-1 bg-gray-700/70"></div>
      <div class="text-md font-medium tracking-wide text-gray-400">sleep monitor</div>
      <div class="h-px flex-1 bg-gray-700/70"></div>
    </div>

    <p class="mt-4 text-center text-sm text-gray-500">
      Press the key to turn off the monitor.<br />
      The icon returns to normal after 1 minute.
    </p>
  </div>
</template>

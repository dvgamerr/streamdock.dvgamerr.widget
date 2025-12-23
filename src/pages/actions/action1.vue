<script setup lang="ts">
  import { usePropertyStore, useWatchEvent, TabView } from '@/hooks/property';
  import { useI18nStore } from '@/hooks/i18n';

  // Event listener
  const i18n = useI18nStore();
  const property = usePropertyStore();
  useWatchEvent({
    didReceiveSettings(data) {},
    sendToPropertyInspector(data) {},
    didReceiveGlobalSettings(data) {}
  });
</script>

<template>
  <TabView :label="i18n['Action Settings']">
    <div style="padding: 20px; color: #fff">
      <h3>Gold Price Display</h3>
      <p>This action displays the current gold price from YLG Bullion API.</p>
      <p>The price updates automatically every 15 seconds.</p>
      <p>Click the button to open TradingView gold chart.</p>
    </div>
  </TabView>
</template>

<style lang="scss" scoped></style>

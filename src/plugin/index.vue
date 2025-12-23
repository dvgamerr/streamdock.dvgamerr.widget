<script setup lang="ts">
  import { useWatchEvent, usePluginStore } from '@/hooks/plugin';
  // @ts-ignore
  Object.entries(import.meta.glob('@/plugin/actions/*.ts', { eager: true, import: 'default' })).forEach(([path, fn]) =>
    (fn as Function)(path.replace('/src/plugin/actions/', '').replace('.ts', ''))
  );

  // Event listener
  const plugin = usePluginStore();
  useWatchEvent('plugin', {
    deviceDidConnect() {},
    deviceDidDisconnect() {},
    didReceiveGlobalSettings(data: any) {},
    systemDidWakeUp(data: any) {},
    applicationDidTerminate(data: any) {
      console.log(data);
    },
    applicationDidLaunch(data: any) {
      console.log(data);
    },
    keyUpCord(data: any) {
      plugin.eventEmitter.emit('keyUpCord', data);
    },
    keyDownCord(data: any) {
      plugin.eventEmitter.emit('keyDownCord', data);
    },
    stopBackground(data: any) {
      plugin.eventEmitter.emit('stopBackground', data);
    },
    lockScreen(data) {},
    unLockScreen(data) {}
  });
</script>

<template></template>

<style lang="scss" scoped></style>

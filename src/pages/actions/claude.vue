<script setup lang="ts">
  import { useWatchEvent } from '@/hooks/property';

  useWatchEvent({
    didReceiveSettings(_data) {},
    sendToPropertyInspector(_data) {},
    didReceiveGlobalSettings(_data) {}
  });
</script>

<template>
  <div class="px-5 py-3 text-gray-300">
    <div class="flex items-center gap-4">
      <div class="h-px flex-1 bg-gray-700/70"></div>
      <div class="text-md font-medium tracking-wide text-gray-400">claude usage</div>
      <div class="h-px flex-1 bg-gray-700/70"></div>
    </div>

    <div class="mt-4 rounded-xl border border-gray-700/70 bg-[#2a2c30] p-4">
      <div class="flex items-center gap-3">
        <img src="/images/claudecode-color.svg" alt="Claude Code" class="h-8 w-8 rounded-md bg-[#1f2024] p-1" />
        <div>
          <div class="text-sm font-semibold text-gray-100">Claude Code Usage</div>
          <div class="text-xs text-gray-400">Animated circular usage key with the Claude Code mark in the center.</div>
        </div>
      </div>

      <div class="mt-4 space-y-2 text-xs leading-5 text-gray-400">
        <div>Default view shows only the <span class="font-semibold text-gray-200">5 hour</span> circle, logo, and percent.</div>
        <div>Press the action key to hide the graphics and show the text details instead.</div>
        <div>Press again to go back to the compact circle view.</div>
        <div>The local helper starts automatically and uses <span class="font-semibold text-gray-200">~/.claude/.credentials.json</span> on this machine.</div>
      </div>
    </div>

    <div class="mt-3 h-px w-full bg-gray-700/40"></div>
  </div>
</template>

<style lang="scss" scoped></style>

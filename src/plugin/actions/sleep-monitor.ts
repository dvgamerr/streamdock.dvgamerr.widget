import { usePluginStore, useWatchEvent } from '@/hooks/plugin.js';

type SleepRecord = {
  sleeping: boolean;
};

const SLEEP_DURATION = 60_000;

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;
  const plugin = usePluginStore();
  const record: Record<string, SleepRecord> = {};

  const getPluginRoot = () => {
    const href = window.location.href;
    const lastSlash = href.lastIndexOf('/');
    return lastSlash === -1 ? href : href.slice(0, lastSlash);
  };

  const wakeUp = (context: string) => {
    if (!record[context]) return;
    record[context].sleeping = false;
    plugin.Untimeout(`sleep-monitor-${context}`);
    plugin.getAction(context)?.setState(0);
  };

  const wakeUpAll = () => {
    for (const context of Object.keys(record)) {
      if (record[context].sleeping) wakeUp(context);
    }
  };

  // Detect monitor wake: when the WebView becomes visible again after monitor sleep
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') wakeUpAll();
  });

  useWatchEvent('action', {
    ActionID,
    willAppear({ context }) {
      if (!record[context]) record[context] = { sleeping: false };
      plugin.getAction(context)?.setState(record[context].sleeping ? 1 : 0);
    },
    willDisappear({ context }) {
      const rec = record[context];
      if (rec?.sleeping) {
        // keep record; timer fires even if key scrolls off screen
      }
    },
    keyUp({ context }) {
      if (!record[context]) record[context] = { sleeping: false };
      if (record[context].sleeping) return;

      record[context].sleeping = true;
      plugin.getAction(context)?.setState(1);

      try {
        plugin.getAction(context)?.openUrl(`${getPluginRoot()}/scripts/SleepMonitor.vbs`);
      } catch (err) {
        console.error('sleep-monitor launch error:', err);
      }

      plugin.Timeout(`sleep-monitor-${context}`, SLEEP_DURATION, () => wakeUp(context));
    }
  });

  return { name, ActionID };
}

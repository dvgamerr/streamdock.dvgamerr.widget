import { usePluginStore, useWatchEvent } from '@/hooks/plugin.js';

type SleepRecord = {
  sleeping: boolean;
  sleepUntil: number;
};

const SLEEP_DURATION = 60_000;
const CHECK_INTERVAL = 1_000;

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;
  const plugin = usePluginStore();
  const record: Record<string, SleepRecord> = {};
  const timerKey = (context: string) => `sleep-monitor-${context}`;

  const getPluginRoot = () => {
    const href = window.location.href;
    const lastSlash = href.lastIndexOf('/');
    return lastSlash === -1 ? href : href.slice(0, lastSlash);
  };

  const ensureRecord = (context: string) => {
    if (!record[context]) {
      record[context] = { sleeping: false, sleepUntil: 0 };
    }
    return record[context];
  };

  const syncState = (context: string) => {
    const rec = record[context];
    if (!rec) return;

    const sleeping = rec.sleepUntil > Date.now();
    rec.sleeping = sleeping;

    if (!sleeping) {
      rec.sleepUntil = 0;
      plugin.Unterval(timerKey(context));
    }

    plugin.getAction(context)?.setState(sleeping ? 1 : 0);
  };

  const syncAllStates = () => {
    for (const context of Object.keys(record)) {
      syncState(context);
    }
  };

  // Reconcile state when the webview starts rendering events again.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncAllStates();
  });
  window.addEventListener('focus', syncAllStates);

  useWatchEvent('action', {
    ActionID,
    willAppear({ context }) {
      ensureRecord(context);
      syncState(context);
    },
    willDisappear({ context }) {
      const rec = record[context];
      if (rec?.sleeping) {
        // keep record; timer fires even if key scrolls off screen
      }
    },
    keyUp({ context }) {
      const rec = ensureRecord(context);
      syncState(context);
      if (rec.sleeping) return;

      rec.sleeping = true;
      rec.sleepUntil = Date.now() + SLEEP_DURATION;
      plugin.getAction(context)?.setState(1);

      try {
        plugin.getAction(context)?.openUrl(`${getPluginRoot()}/scripts/SleepMonitor.vbs`);
      } catch (err) {
        console.error('sleep-monitor launch error:', err);
      }

      plugin.Interval(timerKey(context), CHECK_INTERVAL, () => syncState(context));
    }
  });

  return { name, ActionID };
}

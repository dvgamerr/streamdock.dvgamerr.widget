import { usePluginStore, useWatchEvent } from '@/hooks/plugin.js';

type AudioSettings = {
  device1Match: string;
  device1Show: string;
  device2Match: string;
  device2Show: string;
};

type AudioRecord = {
  state: number;
  targetState: number;
  settings: AudioSettings;
};

const DEFAULTS: AudioSettings = {
  device1Match: '*Sound Blaster GS5*',
  device1Show: 'Speakers (GS5)',
  device2Match: '*Sound Blaster X5*',
  device2Show: 'Headphones (X5)'
};

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;
  const plugin = usePluginStore();
  const record: Record<string, AudioRecord> = {};

  const getPluginRoot = () => {
    const href = window.location.href;
    const lastSlash = href.lastIndexOf('/');
    return lastSlash === -1 ? href : href.slice(0, lastSlash);
  };

  const applySettings = (context: string, settings: any) => {
    if (!record[context]) {
      record[context] = { state: 0, targetState: 0, settings: { ...DEFAULTS } };
    }
    record[context].settings = {
      device1Match: (settings?.device1Match || DEFAULTS.device1Match).toString(),
      device1Show: (settings?.device1Show || DEFAULTS.device1Show).toString(),
      device2Match: (settings?.device2Match || DEFAULTS.device2Match).toString(),
      device2Show: (settings?.device2Show || DEFAULTS.device2Show).toString()
    };
  };

  const toggleDevice = (context: string) => {
    const action = plugin.getAction(context);
    const rec = record[context];
    if (!action || !rec) return;

    // Determine next stable state before going to switching state.
    const nextState = rec.targetState === 0 ? 1 : 0;
    rec.targetState = nextState;
    rec.state = 2;
    action.setState(2);

    try {
      action.openUrl(`${getPluginRoot()}/scripts/ToggleAudioDevices.vbs`);
    } catch (err) {
      console.error('toggle-audio launch error:', err);
    }

    plugin.Timeout(`toggle-audio-${context}`, 1500, () => {
      if (!record[context]) return;
      record[context].state = record[context].targetState;
      plugin.getAction(context)?.setState(record[context].state);
    });
  };

  useWatchEvent('action', {
    ActionID,
    willAppear({ context, payload }) {
      applySettings(context, payload?.settings);
      plugin.getAction(context)?.setState(record[context].state);
    },
    willDisappear({ context }) {
      plugin.Untimeout(`toggle-audio-${context}`);
      delete record[context];
    },
    didReceiveSettings({ context, payload }) {
      applySettings(context, payload?.settings);
    },
    keyUp({ context }) {
      toggleDevice(context);
    }
  });

  return { name, ActionID };
}

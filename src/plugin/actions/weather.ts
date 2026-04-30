import { usePluginStore, useWatchEvent } from '@/hooks/plugin.js';
import { watch } from 'vue';
import { CANVAS_SIZE, accentGradient, drawBackground, PALETTES, type Palette } from '../canvas-style.js';

// Map WMO weather code + is_day flag to AccuWeather icon number.
// Icon SVGs live at https://www.accuweather.com/images/weathericons/v2a/{nn}.svg
const wmoToAccuIcon = (code: number, isDay: boolean): number => {
  if (isDay) {
    if (code === 0) return 1;
    if (code === 1) return 2;
    if (code === 2) return 4;
    if (code === 3) return 7;
    if (code === 45 || code === 48) return 11;
    if (code >= 51 && code <= 53) return 12;
    if (code === 55) return 18;
    if (code >= 61 && code <= 65) return 18;
    if (code >= 71 && code <= 77) return 22;
    if (code === 80 || code === 81) return 12;
    if (code === 82) return 15;
    if (code === 85 || code === 86) return 23;
    if (code >= 95) return 15;
    return 1;
  } else {
    if (code === 0) return 33;
    if (code === 1) return 34;
    if (code === 2) return 35;
    if (code === 3) return 38;
    if (code === 45 || code === 48) return 11;
    if (code >= 51 && code <= 55) return 40;
    if (code >= 61 && code <= 65) return 18;
    if (code >= 71 && code <= 77) return 22;
    if (code === 80 || code === 81) return 39;
    if (code === 82) return 42;
    if (code >= 85) return 44;
    if (code >= 95) return 42;
    return 33;
  }
};

const ACCU_ICON_BASE = 'https://www.accuweather.com/images/weathericons/v2a/';
const iconCache = new Map<number, HTMLImageElement>();

const loadAccuIcon = (iconNum: number): Promise<HTMLImageElement> => {
  const cached = iconCache.get(iconNum);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `${ACCU_ICON_BASE}${iconNum.toString().padStart(2, '0')}.svg`;
    img.onload = () => {
      iconCache.set(iconNum, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`icon ${iconNum} failed`));
  });
};

const wmoToPalette = (code: number): Palette => {
  if (code <= 1) return PALETTES.warm;
  if (code >= 95) return PALETTES.purple;
  if (code >= 61 && code <= 82) return PALETTES.cool;
  return PALETTES.slate;
};

type WeatherData = {
  temp: number;
  realfeel: number;
  code: number;
  isDay: boolean;
  precipProbs: number[];
};

type WeatherRecord = {
  data: WeatherData | null;
  lat: number;
  lon: number;
  interval: number;
  isActive: boolean;
};

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;
  const plugin = usePluginStore();
  const record: Record<string, WeatherRecord> = {};
  const timerKey = (ctx: string) => `weather-${ctx}`;

  const canvasFunc = async (context: string, status?: string) => {
    const action = plugin.getAction(context);
    if (!action) return;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (status === 'loading') {
      drawBackground(ctx, PALETTES.cool.bg);
      ctx.fillStyle = accentGradient(ctx, PALETTES.cool);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.fillText('Loading…', 72, 72);
    } else if (status === 'error') {
      drawBackground(ctx, PALETTES.rose.bg);
      ctx.fillStyle = accentGradient(ctx, PALETTES.rose);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.fillText('Error', 72, 60);
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('Fetch failed', 72, 88);
    } else if (record[context]?.data) {
      const data = record[context].data!;
      const palette = wmoToPalette(data.code);
      drawBackground(ctx, palette.bg);

      const iconNum = wmoToAccuIcon(data.code, data.isDay);

      // Icon: centred, leaving bottom strip for text
      const iconSize = 100;
      const iconX = (CANVAS_SIZE - iconSize) / 2;
      const iconY = 6;
      try {
        const img = await loadAccuIcon(iconNum);
        ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
      } catch {
        drawBackground(ctx, palette.bg);
      }

      // Gradient scrim at bottom so text is always readable
      const scrim = ctx.createLinearGradient(0, 100, 0, CANVAS_SIZE);
      scrim.addColorStop(0, 'rgba(0,0,0,0)');
      scrim.addColorStop(1, 'rgba(0,0,0,0.72)');
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 100, CANVAS_SIZE, CANVAS_SIZE - 100);

      // Temperature overlay — bottom centre
      const label = `${data.temp}°C`;
      ctx.font = 'bold 26px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, 72, CANVAS_SIZE - 8);
      ctx.shadowBlur = 0;
    } else {
      drawBackground(ctx, PALETTES.cool.bg);
    }

    action.setImage(canvas.toDataURL('image/png'));
  };

  const fetchWeather = (context: string, lat: number, lon: number, isActive = true) => {
    if (!record[context]) return;

    isActive && canvasFunc(context, 'loading');
    plugin.Unterval(timerKey(context));

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,weather_code,is_day` +
      `&hourly=precipitation_probability` +
      `&timezone=Asia%2FBangkok&forecast_days=1`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (!record[context]) return;
        const cur = json.current;
        const currentHour = new Date().getHours();
        const hourlyProbs: number[] = json.hourly?.precipitation_probability ?? [];
        const precipProbs = hourlyProbs.slice(currentHour, currentHour + 6);

        record[context].data = {
          temp: Math.round(cur.temperature_2m),
          realfeel: Math.round(cur.apparent_temperature),
          code: cur.weather_code,
          isDay: cur.is_day === 1,
          precipProbs
        };
        canvasFunc(context);
      })
      .catch(() => canvasFunc(context, 'error'))
      .finally(() => {
        if (!record[context]) return;
        const interval = record[context].interval || 1800000;
        plugin.Interval(timerKey(context), interval, () => {
          if (record[context]?.isActive) {
            fetchWeather(context, record[context].lat, record[context].lon, false);
          }
        });
      });
  };

  plugin.eventEmitter.subscribe('stopBackground', (data: { device: string }) => {
    plugin.stopBackground(data.device);
  });

  watch(
    () => Array.from(plugin.devices),
    () => {},
    { deep: true }
  );

  useWatchEvent('action', {
    ActionID,
    willAppear({ context, payload }) {
      const settings = (payload?.settings as any) || {};
      if (!record[context]) {
        record[context] = {
          data: null,
          lat: parseFloat(settings.lat) || 13.72,
          lon: parseFloat(settings.lon) || 100.41,
          interval: settings.interval || 1800000,
          isActive: true
        };
      }
      fetchWeather(context, record[context].lat, record[context].lon, true);
    },
    willDisappear({ context }) {
      if (record[context]) {
        record[context].isActive = false;
        plugin.Unterval(timerKey(context));
        delete record[context];
      }
    },
    didReceiveSettings({ context, payload }) {
      const settings = (payload?.settings as any) || {};
      const lat = parseFloat(settings.lat) || 13.72;
      const lon = parseFloat(settings.lon) || 100.41;
      if (record[context]) {
        record[context].lat = lat;
        record[context].lon = lon;
        record[context].interval = settings.interval || 1800000;
      }
      fetchWeather(context, lat, lon, false);
    },
    keyUp({ context }) {
      if (record[context]) {
        fetchWeather(context, record[context].lat, record[context].lon, false);
      }
    }
  });

  return { name, ActionID };
}

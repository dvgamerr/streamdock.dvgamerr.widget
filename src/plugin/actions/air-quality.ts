import { usePluginStore, useWatchEvent } from '@/hooks/plugin.js';
import { watch } from 'vue';
import { CANVAS_SIZE, accentGradient, drawBackground, drawDivider, PALETTES, paletteFromHex } from '../canvas-style.js';

type AQIData = {
  aqi: number;
  level: string;
  color: string;
  sourceUrl: string;
  lastUpdate: string;
};

type ActionRecord = {
  data: AQIData | null;
  interval: number;
  isActive: boolean;
};

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;

  // Event listener
  const plugin = usePluginStore();
  const record: Record<string, ActionRecord> = {};

  const timerKey = (context: string) => `aqi-${context}`;

  const DEFAULT_URL = 'https://www.iqair.com/th-en/thailand/bangkok/nong-khaem';

  const sanitizeUrl = (value: string | undefined) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return DEFAULT_URL;
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
  };

  const getColorFromBadgeClass = (className: string) => {
    const normalized = className.toLowerCase();

    if (normalized.includes('aqi-legend-bg-green')) return '#22C55E';
    if (normalized.includes('aqi-legend-bg-yellow')) return '#ff9b57';
    if (normalized.includes('aqi-legend-bg-orange')) return '#F97316';
    if (normalized.includes('aqi-legend-bg-red')) return '#DC2626';
    if (normalized.includes('aqi-legend-bg-purple')) return '#9333EA';
    if (normalized.includes('aqi-legend-bg-maroon') || normalized.includes('aqi-legend-bg-brown')) return '#7F1D1D';

    return '';
  };

  const getColorFromLevel = (level: string) => {
    const normalized = level.toLowerCase();

    if (normalized.includes('good') || normalized.includes('ดี')) return '#22C55E';
    if (normalized.includes('moderate') || normalized.includes('ปานกลาง')) return '#ff9b57';
    if (normalized.includes('sensitive') || normalized.includes('กลุ่มเสี่ยง')) return '#F97316';
    if (normalized.includes('unhealthy') || normalized.includes('ไม่ดีต่อสุขภาพ')) return '#DC2626';
    if (normalized.includes('very unhealthy') || normalized.includes('ไม่ดีต่อสุขภาพมาก')) return '#9333EA';
    if (normalized.includes('hazardous') || normalized.includes('อันตราย')) return '#7F1D1D';

    return '#FFFFFF';
  };

  const parseIqAirHtml = (html: string) => {
    const strictPattern =
      /<div[^>]*class="([^"]*aqi-legend-bg-[^"]*)"[^>]*>[\s\S]*?<p[^>]*>\s*([0-9]{1,3})\s*<\/p>[\s\S]*?<span[^>]*>\s*US AQI[^<]*<\/span>[\s\S]*?<\/div>\s*<p[^>]*class="[^"]*font-body-l-medium[^"]*"[^>]*>\s*([^<]+?)\s*<\/p>/i;

    const strictMatch = html.match(strictPattern);
    if (strictMatch) {
      const aqi = Number.parseInt(strictMatch[2], 10);
      const level = strictMatch[3].trim();
      const color = getColorFromBadgeClass(strictMatch[1]) || getColorFromLevel(level);
      return { aqi, level, color };
    }

    const documentRoot = new DOMParser().parseFromString(html, 'text/html');

    const labelElement = Array.from(documentRoot.querySelectorAll('span, p, div')).find((element) => /US AQI/i.test((element.textContent || '').replace('⁺', '+')));

    if (!labelElement) {
      throw new Error('US AQI label not found');
    }

    const cardElement = labelElement.closest('div');
    if (!cardElement) {
      throw new Error('AQI card not found');
    }

    const valueElement = Array.from(cardElement.querySelectorAll('p, span, div')).find((element) => /^\d{1,3}$/.test((element.textContent || '').trim()));

    const aqiValue = valueElement?.textContent?.trim() || '';
    const aqi = Number.parseInt(aqiValue, 10);
    if (!Number.isFinite(aqi)) {
      throw new Error('AQI value not found');
    }

    let level = '';
    const siblingText = cardElement.nextElementSibling?.textContent?.trim();
    if (siblingText) {
      level = siblingText;
    }

    if (!level) {
      const wrappedLevel = cardElement.parentElement?.querySelector('p.font-body-l-medium')?.textContent?.trim();
      if (wrappedLevel) {
        level = wrappedLevel;
      }
    }

    if (!level) {
      const fallbackLevel = documentRoot.querySelector('p.font-body-l-medium')?.textContent?.trim();
      if (fallbackLevel) {
        level = fallbackLevel;
      }
    }

    const color = getColorFromBadgeClass(cardElement.className) || getColorFromLevel(level || '');
    return { aqi, level: level || 'Unknown', color };
  };

  // Canvas rendering function with gradient background
  const canvasFunc = async (context: string, status?: string) => {
    const action = plugin.getAction(context);
    if (!action) return;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    if (status === 'loading') {
      drawBackground(ctx, PALETTES.slate.bg);
      ctx.fillStyle = accentGradient(ctx, PALETTES.slate);
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
      const data = record[context].data;
      const palette = paletteFromHex(data.color);
      const levelText = data.level.length > 16 ? `${data.level.slice(0, 15)}…` : data.level;
      const levelFontSize = levelText.length > 12 ? 14 : 18;

      drawBackground(ctx, palette.bg);

      const accent = accentGradient(ctx, palette);

      // US AQI Label (top)
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('US AQI', 72, 32);

      drawDivider(ctx, palette, 42);

      // US AQI Value (Large - centered)
      ctx.fillStyle = accent;
      ctx.font = 'bold 64px "Segoe UI", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.aqi.toString(), 72, 82);

      // AQI Level name (bottom)
      ctx.fillStyle = accent;
      ctx.font = `bold ${levelFontSize}px "Segoe UI", sans-serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(levelText, 72, 132);
    } else {
      drawBackground(ctx, PALETTES.slate.bg);
    }

    action.setImage(canvas.toDataURL('image/png'));
  };

  // Fetch air quality data from IQAir page
  const fetchAirQuality = (context: string, url: string, isActive: boolean = true) => {
    if (!record[context]) return;

    isActive && canvasFunc(context, 'loading');
    plugin.Unterval(timerKey(context));

    const sourceUrl = sanitizeUrl(url);

    fetch(sourceUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
      })
      .then((html) => {
        try {
          const parsed = parseIqAirHtml(html);
          if (!record[context]) {
            return;
          }

          const now = new Date();
          const lastUpdate = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });

          record[context] = {
            ...record[context],
            data: {
              aqi: parsed.aqi,
              level: parsed.level,
              color: parsed.color,
              sourceUrl,
              lastUpdate
            },
            isActive
          };

          canvasFunc(context);
        } catch (error) {
          console.error('Parse error:', error);
          canvasFunc(context, 'error');
        }
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        canvasFunc(context, 'error');
      })
      .finally(() => {
        // Always reschedule — even after errors (via Worker, won't be throttled)
        if (!record[context]) return;

        const interval = record[context]?.interval || 3600000;
        plugin.Interval(timerKey(context), interval, () => {
          if (record[context]?.isActive) {
            fetchAirQuality(context, sourceUrl, false);
          }
        });
      });
  };

  plugin.eventEmitter.subscribe('stopBackground', (data: { device: string }) => {
    // Stop background and release resources
    plugin.stopBackground(data.device);
  });

  // Monitor device events
  watch(
    () => Array.from(plugin.devices),
    (newDevices, oldDevices) => {
      oldDevices.filter((item) => !newDevices.includes(item));
    },
    { deep: true }
  );

  useWatchEvent('action', {
    ActionID,
    willAppear({ context, payload }) {
      const settings = (payload?.settings as any) || {};

      // Initialize record for this context
      if (!record[context]) {
        record[context] = {
          data: null,
          interval: settings.interval || 3600000,
          isActive: true
        };
      }

      const url = sanitizeUrl(settings.url);

      fetchAirQuality(context, url, true);
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
      const url = sanitizeUrl(settings.url);
      const interval = settings.interval || 3600000;

      if (record[context]) {
        record[context].interval = interval;
      }

      fetchAirQuality(context, url, true);
    },

    keyUp({ context }) {
      const action = plugin.getAction(context);
      if (!action) return;

      const settings = (action.settings as any) || {};
      const url = sanitizeUrl(settings.url);

      // Refresh air quality data
      fetchAirQuality(context, url, true);
    }
  });

  return {
    name,
    ActionID
  };
}

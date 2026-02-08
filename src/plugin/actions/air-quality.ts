import { usePluginStore, useWatchEvent } from '@/hooks/plugin.js';
import { watch } from 'vue';

type AQIData = {
  aqi: number;
  level: string;
  color: string;
  sourceUrl: string;
  lastUpdate: string;
};

type ActionRecord = {
  timer: ReturnType<typeof setTimeout> | null;
  data: AQIData | null;
  interval: number;
  isActive: boolean;
};

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;

  // Event listener
  const plugin = usePluginStore();
  const record: Record<string, ActionRecord> = {};

  const normalizeSegment = (value: string | undefined, fallback: string) => {
    const cleaned = (value || '')
      .trim()
      .toLowerCase()
      .replace(/[\\/]+/g, '-')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return cleaned || fallback;
  };

  const buildIqAirUrl = (city: string, district: string) => {
    const citySegment = normalizeSegment(city, 'bangkok');
    const districtSegment = normalizeSegment(district, 'sathorn-district');
    return `https://www.iqair.com/thailand/${citySegment}/${citySegment}/${districtSegment}`;
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
    canvas.width = 144;
    canvas.height = 144;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Background color based on air quality (default black)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 144, 144);

    if (status === 'loading') {
      // Loading animation with spinner
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.fillText('Loading...', 72, 72);

      // Draw simple spinner
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(72, 100, 15, 0, Math.PI * 1.5);
      ctx.stroke();
    } else if (status === 'error') {
      ctx.fillStyle = '#EF4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 24px "Segoe UI", sans-serif';
      ctx.fillText('⚠️ Error', 72, 60);
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillStyle = '#CCCCCC';
      ctx.fillText('Fetch Failed', 72, 88);
    } else if (record[context]?.data) {
      const data = record[context].data;
      const levelText = data.level.length > 16 ? `${data.level.slice(0, 15)}…` : data.level;
      const levelFontSize = levelText.length > 12 ? 14 : 18;

      // Apply background color based on air quality with rounded corners
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.roundRect(0, 0, 144, 144, 12);
      ctx.fill();

      // US AQI Label (top)
      ctx.fillStyle = data.color;
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('US AQI', 72, 35);

      // US AQI Value (Large - centered)
      ctx.fillStyle = data.color;
      ctx.font = 'bold 68px "Segoe UI", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.aqi.toString(), 72, 80);

      // AQI Level name (bottom)
      ctx.fillStyle = data.color;
      ctx.font = `bold ${levelFontSize}px "Segoe UI", sans-serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(levelText, 72, 135);
    }

    action.setImage(canvas.toDataURL('image/png'));
  };

  // Fetch air quality data from IQAir page
  const fetchAirQuality = (context: string, city: string, district: string, isActive: boolean = true) => {
    if (!record[context]) return;

    isActive && canvasFunc(context, 'loading');
    clearTimeout(record[context]?.timer);

    const sourceUrl = buildIqAirUrl(city, district);

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
        if (!record[context]) {
          return;
        }

        const interval = record[context]?.interval || 3600000;
        record[context] = {
          ...record[context],
          timer: setTimeout(() => {
            if (record[context]?.isActive) {
              fetchAirQuality(context, city, district, false);
            }
          }, interval)
        };
      });
  };

  plugin.eventEmitter.subscribe('stopBackground', (data) => {
    // Stop background and release resources
    plugin.stopBackground(data.device);
  });

  // Monitor device events
  watch(
    () => Array.from(plugin.devices),
    (newDevices, oldDevices) => {
      const delDevices = oldDevices.filter((item) => !newDevices.includes(item));
      delDevices.forEach((device) => {
        // Clean up removed devices
      });
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
          timer: null,
          data: null,
          interval: settings.interval || 3600000,
          isActive: true
        };
      }

      const city = settings.city || 'bangkok';
      const district = settings.district || 'sathorn-district';

      fetchAirQuality(context, city, district, true);
    },

    willDisappear({ context }) {
      if (record[context]) {
        record[context].isActive = false;
        clearTimeout(record[context].timer);
        delete record[context];
      }
    },

    didReceiveSettings({ context, payload }) {
      const settings = (payload?.settings as any) || {};
      const city = settings.city || 'bangkok';
      const district = settings.district || 'sathorn-district';
      const interval = settings.interval || 3600000;

      if (record[context]) {
        record[context].interval = interval;
      }

      fetchAirQuality(context, city, district, true);
    },

    keyUp({ context }) {
      // Open IQAir website with location
      const action = plugin.getAction(context);
      if (!action) return;

      const settings = (action.settings as any) || {};
      const city = settings.city || 'bangkok';
      const district = settings.district || 'sathorn-district';
      const url = buildIqAirUrl(city, district);

      // Open URL in default browser
      action.openUrl(url);
    }
  });

  return {
    name,
    ActionID
  };
}

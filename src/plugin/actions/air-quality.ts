import { usePluginStore, useWatchEvent } from '@/hooks/plugin.js';
import { watch } from 'vue';

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;

  // Event listener
  const plugin = usePluginStore();
  const record: Record<string, any> = {};

  // Calculate US AQI from PM2.5 concentration
  const calculatePM25AQI = (pm25: number): number => {
    const breakpoints = [
      { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
      { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
      { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
      { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
      { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
      { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
    ];

    for (const bp of breakpoints) {
      if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
        const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow;
        return Math.round(aqi);
      }
    }
    return pm25 > 500.4 ? 500 : 0;
  };

  // Calculate US AQI from PM10 concentration
  const calculatePM10AQI = (pm10: number): number => {
    const breakpoints = [
      { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
      { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
      { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
      { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
      { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
      { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 },
    ];

    for (const bp of breakpoints) {
      if (pm10 >= bp.cLow && pm10 <= bp.cHigh) {
        const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm10 - bp.cLow) + bp.iLow;
        return Math.round(aqi);
      }
    }
    return pm10 > 604 ? 500 : 0;
  };

  // Helper function to get Air Quality Index level and color based on US AQI
  const getAQILevel = (pm25: number, pm10: number) => {
    const aqi25 = calculatePM25AQI(pm25);
    const aqi10 = calculatePM10AQI(pm10);
    const maxAQI = Math.max(aqi25, aqi10);
    
    if (maxAQI <= 50) {
      return { level: 'Good', color: '#ffffff', aqi: maxAQI }; // Black
    } else if (maxAQI <= 100) {
      return { level: 'Moderate', color: '#ff9b57', aqi: maxAQI }; // Yellow
    } else if (maxAQI <= 150) {
      return { level: 'Unhealthy for Sensitive', color: '#F97316', aqi: maxAQI }; // Orange
    } else if (maxAQI <= 200) {
      return { level: 'Unhealthy', color: '#DC2626', aqi: maxAQI }; // Red
    } else if (maxAQI <= 300) {
      return { level: 'Very Unhealthy', color: '#9333EA', aqi: maxAQI }; // Purple
    } else {
      return { level: 'Hazardous', color: '#7F1D1D', aqi: maxAQI }; // Maroon
    }
  };

  // Load image helper
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
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
      ctx.fillText('Check Location', 72, 88);
    } else if (record[context]?.data) {
      const data = record[context].data;
      const aqiInfo = getAQILevel(data.pm25, data.pm10);

      // Apply background color based on air quality with rounded corners
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.roundRect(0, 0, 144, 144, 12);
      ctx.fill();

      // US AQI Label (top)
      ctx.fillStyle = aqiInfo.color;
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('US AQI', 72, 35);

      // US AQI Value (Large - centered)
      ctx.fillStyle = aqiInfo.color;
      ctx.font = 'bold 68px "Segoe UI", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(aqiInfo.aqi.toString(), 72, 80);

      // AQI Level name (bottom)
      ctx.fillStyle = aqiInfo.color;
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(aqiInfo.level, 72, 135);
    }

    action.setImage(canvas.toDataURL('image/png'));
  };

  // Fetch air quality data from Open-Meteo API
  const fetchAirQuality = (
    context: string,
    latitude: string,
    longitude: string,
    locationName: string,
    isActive: boolean = true
  ) => {
    isActive && canvasFunc(context, 'loading');
    clearTimeout(record[context]?.timer);

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const apiUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality';
    const params = new URLSearchParams({
      latitude: latitude || '13.7',
      longitude: longitude || '100.5',
      hourly: 'pm2_5,pm10',
      start_date: dateStr,
      end_date: dateStr,
      timezone: 'auto',
    });

    fetch(`${apiUrl}?${params}`)
      .then((response) => response.json())
      .then((data) => {
        try {
          if (data.hourly && data.hourly.pm2_5 && data.hourly.pm10) {
            const pm25Values = data.hourly.pm2_5.filter((v: number | null) => v !== null);
            const pm10Values = data.hourly.pm10.filter((v: number | null) => v !== null);

            if (pm25Values.length === 0 || pm10Values.length === 0) {
              throw new Error('No valid data');
            }

            // Get current hour or latest available data
            const currentHour = new Date().getHours();
            const pm25 = pm25Values[currentHour] ?? pm25Values[pm25Values.length - 1];
            const pm10 = pm10Values[currentHour] ?? pm10Values[pm10Values.length - 1];

            // Get last update time
            const now = new Date();
            const lastUpdate = now.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            });

            record[context] = {
              data: {
                pm25: Math.round(pm25),
                pm10: Math.round(pm10),
                locationName: locationName || 'Location',
                lastUpdate: lastUpdate,
              },
              isActive: isActive,
            };

            canvasFunc(context);
          } else {
            throw new Error('Invalid data format');
          }
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
        const interval = record[context]?.interval || 3600000;
        record[context] = {
          ...record[context],
          timer: setTimeout(() => {
            if (record[context]?.isActive) {
              fetchAirQuality(context, latitude, longitude, locationName, false);
            }
          }, interval),
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
      // Initialize record for this context
      if (!record[context]) {
        record[context] = {
          timer: null,
          data: null,
          interval: (payload?.settings as any)?.interval || 3600000,
          isActive: true
        };
      }

      const settings = (payload?.settings as any) || {};
      const latitude = settings.latitude || '13.7';
      const longitude = settings.longitude || '100.5';
      const locationName = settings.locationName || 'Location';

      fetchAirQuality(context, latitude, longitude, locationName, true);
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
      const latitude = settings.latitude || '13.7';
      const longitude = settings.longitude || '100.5';
      const locationName = settings.locationName || 'Location';
      const interval = settings.interval || 3600000;

      if (record[context]) {
        record[context].interval = interval;
      }

      fetchAirQuality(context, latitude, longitude, locationName, true);
    },

    keyUp({ context }) {
      // Open IQAir website with location
      const action = plugin.getAction(context);
      if (!action) return;
      
      const settings = (action.settings as any) || {};
      const locationName = settings.locationName || 'Bangkok';
      
      // Format location name for URL (lowercase, replace spaces with hyphens)
      const formattedLocation = locationName.toLowerCase().replace(/\s+/g, '-');
      const url = `https://www.iqair.com/thailand/${formattedLocation}/${formattedLocation}`;
      
      // Open URL in default browser
      action.openUrl(url);
    }
  });

  return {
    name,
    ActionID,
  };
}

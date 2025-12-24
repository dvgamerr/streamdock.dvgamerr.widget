import { usePluginStore, useWatchEvent } from '@/hooks/plugin.js';

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;

  // Event listener
  const plugin = usePluginStore();
  const record: Record<string, any> = {};

  // Helper function to make GET requests
  const GET = (context: string, url: string, callback: (data: any) => void) => {
    fetch(url)
      .then((response) => response.json())
      .then((data) => callback(data))
      .catch((error) => {
        console.error('Fetch error:', error);
        canvasFunc(context, 'error');
      });
  };

  // Canvas rendering function
  const canvasFunc = (context: string, status?: string) => {
    const action = plugin.getAction(context);
    if (!action) return;

    const canvas = document.createElement('canvas');
    canvas.width = 144;
    canvas.height = 144;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 144, 144);

    if (status === 'loading') {
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText('Loading...', 72, 72);
    } else if (status === 'error') {
      ctx.fillStyle = '#FF4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText('Error', 72, 72);
    } else if (record[context]?.data) {
      const data = record[context].data;
      const isPositive = parseFloat(data.ratio) >= 0;

      // Currency pair code
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText(data.code, 72, 25);

      // Price
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 28px "Segoe UI", sans-serif';
      const priceText = data.price;
      ctx.fillText(priceText, 72, 65);

      // Change percentage
      ctx.fillStyle = isPositive ? '#00FF00' : '#FF4444';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText(data.ratio, 72, 95);

      // Change amount
      ctx.fillStyle = '#AAAAAA';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(data.increase, 72, 115);
    }

    action.setImage(canvas.toDataURL('image/png'));
  };

  // Fetch currency data from Yahoo Finance
  const fetchCurrencyRate = (context: string, from: string, to: string, isActive: boolean = true) => {
    isActive && canvasFunc(context, 'loading');
    clearTimeout(record[context]?.timer);

    const pair = `${from || 'USD'}${to || 'THB'}=X`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${pair}?interval=1d&range=1d`;

    GET(context, url, (e) => {
      try {
        if (e.chart && e.chart.result?.[0]) {
          const result = e.chart.result[0];
          const meta = result.meta;
          const quote = result.indicators?.quote?.[0];

          // Extract rate data
          let currentPrice = meta.regularMarketPrice;
          if (!currentPrice && quote?.close) {
            currentPrice = quote.close[quote.close.length - 1];
          }

          if (!currentPrice || isNaN(currentPrice)) {
            canvasFunc(context, 'error');
            return;
          }

          const previousClose = meta.previousClose || meta.chartPreviousClose || currentPrice;
          const change = currentPrice - previousClose;
          const changePercent = previousClose > 0 ? ((change / previousClose) * 100).toFixed(2) : '0.00';

          record[context].data = {
            code: pair.replace('=X', ''),
            price: parseFloat(currentPrice).toFixed(4),
            ratio: `${parseFloat(changePercent) >= 0 ? '+' : ''}${changePercent}%`,
            increase: `${change >= 0 ? '+' : ''}${change.toFixed(4)}`
          };

          canvasFunc(context);
        } else {
          canvasFunc(context, 'error');
        }
      } catch (err) {
        console.error('Error processing currency data:', err);
        canvasFunc(context, 'error');
      }

      // Refresh every 10 seconds
      const interval = record[context]?.interval || 10000;
      record[context].timer = setTimeout(() => {
        fetchCurrencyRate(context, from, to, false);
      }, interval);
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
          interval: (payload?.settings as any)?.interval || 10000
        };
      }

      const settings = (payload?.settings as any) || {};
      const from = settings.from || 'USD';
      const to = settings.to || 'THB';

      fetchCurrencyRate(context, from, to);
    },
    willDisappear({ context }) {
      // Clean up timer when action disappears
      if (record[context]?.timer) {
        clearTimeout(record[context].timer);
      }
      delete record[context];
    },
    didReceiveSettings({ context, payload }) {
      const settings = (payload?.settings as any) || {};
      const from = settings.from || 'USD';
      const to = settings.to || 'THB';
      const interval = settings.interval || 10000;

      if (record[context]) {
        record[context].interval = interval;
      }

      fetchCurrencyRate(context, from, to, false);
    },
    keyUp({ context }) {
      // Optional: Refresh on key press
      const settings = (plugin.getAction(context)?.settings as any) || {};
      const from = settings.from || 'USD';
      const to = settings.to || 'THB';
      fetchCurrencyRate(context, from, to, false);
    }
  });
}

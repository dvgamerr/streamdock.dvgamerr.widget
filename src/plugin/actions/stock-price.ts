import { usePluginStore, useWatchEvent } from '@/hooks/plugin.js';
import { watch } from 'vue';
import { CANVAS_SIZE, accentGradient, drawBackground, drawDivider, PALETTES } from '../canvas-style.js';

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;

  // Event listener
  const plugin = usePluginStore();
  const record: Record<string, any> = {};

  const timerKey = (context: string) => `stock-${context}`;

  // Canvas rendering function
  const canvasFunc = (context: string, status?: string) => {
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
      ctx.fillText('Check symbol', 72, 88);
    } else if (record[context]?.data) {
      const data = record[context].data;
      const isPositive = parseFloat(data.percentChange) >= 0;
      const palette = isPositive ? PALETTES.green : PALETTES.rose;

      drawBackground(ctx, palette.bg);

      // Stock symbol
      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText(data.displayName || data.symbol, 72, 24);

      drawDivider(ctx, palette, 32);

      // Current price
      ctx.fillStyle = accentGradient(ctx, palette);
      ctx.font = 'bold 26px "Segoe UI", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(`$${data.close}`, 72, 60);

      // Open price row
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Open', 24, 86);

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${data.open}`, CANVAS_SIZE - 24, 86);

      drawDivider(ctx, palette, 98);

      // Change percentage with arrow
      const arrow = isPositive ? '▲' : '▼';
      ctx.fillStyle = accentGradient(ctx, palette);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.fillText(`${arrow} ${data.percentChange}%`, 72, 124);

      if (data.isCustom) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.fillText('Your P/L', 72, 138);
      }
    } else {
      drawBackground(ctx, PALETTES.cool.bg);
    }

    action.setImage(canvas.toDataURL('image/png'));
  };

  // Calculate percentage change
  const calculatePercentChange = (current: number, cost: number): number => {
    if (!cost || cost === 0) return 0;
    return ((current - cost) / cost) * 100;
  };

  // Fetch stock data from Yahoo Finance
  const fetchStockPrice = (context: string, symbol: string, cost?: number, qty?: number, isActive: boolean = true) => {
    if (!record[context]) return;

    isActive && canvasFunc(context, 'loading');
    plugin.Untimeout(timerKey(context));

    if (!symbol || symbol.trim() === '') {
      canvasFunc(context, 'error');
      return;
    }

    const encodedSymbol = encodeURIComponent(symbol.toUpperCase());
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?interval=1mo&range=1mo`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        try {
          if (data.chart && data.chart.result?.[0]) {
            const result = data.chart.result[0];
            const meta = result.meta;
            const quote = result.indicators?.quote?.[0];

            // Extract stock data
            let currentPrice = meta.regularMarketPrice;
            if (!currentPrice && quote?.close) {
              const closeArray = quote.close.filter((val: number) => val !== null);
              currentPrice = closeArray[closeArray.length - 1];
            }

            let openPrice = meta.regularMarketOpen;
            if (!openPrice && quote?.open) {
              const openArray = quote.open.filter((val: number) => val !== null);
              openPrice = openArray[0];
            }

            if (!currentPrice || isNaN(currentPrice)) {
              canvasFunc(context, 'error');
              return;
            }

            // Calculate percentage change
            let percentChange: number;
            let isCustom = false;

            if (cost && parseFloat(cost.toString()) > 0) {
              // Use custom cost for percentage calculation
              percentChange = calculatePercentChange(currentPrice, parseFloat(cost.toString()));
              isCustom = true;
            } else {
              // Use Yahoo Finance's change percentage
              const previousClose = meta.previousClose || meta.chartPreviousClose || currentPrice;
              const change = currentPrice - previousClose;
              percentChange = previousClose > 0 ? (change / previousClose) * 100 : 0;
            }

            const settings = (plugin.getAction(context)?.settings as any) || {};
            record[context].data = {
              symbol: symbol.toUpperCase(),
              displayName: settings.displayName || '',
              close: parseFloat(currentPrice).toFixed(2),
              open: openPrice ? parseFloat(openPrice).toFixed(2) : 'N/A',
              percentChange: percentChange.toFixed(2),
              isCustom: isCustom
            };

            canvasFunc(context);
          } else {
            canvasFunc(context, 'error');
          }
        } catch (err) {
          console.error('Error processing stock data:', err);
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
        const interval = record[context]?.interval || 10000;
        plugin.Timeout(timerKey(context), interval, () => {
          fetchStockPrice(context, symbol, cost, qty, false);
        });
      });
  };

  plugin.eventEmitter.subscribe('stopBackground', (data: EventPayload.stopBackground) => {
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
          data: null,
          interval: (payload?.settings as any)?.interval || 10000
        };
      }

      const settings = (payload?.settings as any) || {};
      const symbol = settings.symbol || 'AAPL';
      const cost = settings.cost ? parseFloat(settings.cost) : undefined;
      const qty = settings.qty ? parseFloat(settings.qty) : undefined;

      fetchStockPrice(context, symbol, cost, qty);
    },
    willDisappear({ context }) {
      // Clean up timer when action disappears
      plugin.Untimeout(timerKey(context));
      delete record[context];
    },
    didReceiveSettings({ context, payload }) {
      const settings = (payload?.settings as any) || {};
      const symbol = settings.symbol || 'AAPL';
      const cost = settings.cost ? parseFloat(settings.cost) : undefined;
      const qty = settings.qty ? parseFloat(settings.qty) : undefined;
      const interval = settings.interval || 10000;

      if (record[context]) {
        record[context].interval = interval;
      }

      fetchStockPrice(context, symbol, cost, qty, false);
    },
    keyUp({ context }) {
      // Refresh on key press
      const settings = (plugin.getAction(context)?.settings as any) || {};
      const symbol = settings.symbol || 'AAPL';
      const cost = settings.cost ? parseFloat(settings.cost) : undefined;
      const qty = settings.qty ? parseFloat(settings.qty) : undefined;
      fetchStockPrice(context, symbol, cost, qty, false);
    }
  });
}

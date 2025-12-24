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

    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 144, 144);

    if (status === 'loading') {
      ctx.fillStyle = '#60A5FA';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 24px "Segoe UI", sans-serif';
      ctx.fillText('Loading...', 72, 72);
    } else if (status === 'error') {
      ctx.fillStyle = '#EF4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 24px "Segoe UI", sans-serif';
      ctx.fillText('Error', 72, 60);
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillStyle = '#CCCCCC';
      ctx.fillText('Check Symbol', 72, 88);
    } else if (record[context]?.data) {
      const data = record[context].data;
      const isPositive = parseFloat(data.percentChange) >= 0;
      const changeColor = isPositive ? '#10B981' : '#EF4444';

      // Stock Symbol (use displayName if available)
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText(data.displayName || data.symbol, 72, 22);

      // Divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 32);
      ctx.lineTo(124, 32);
      ctx.stroke();

      // Current Price (Close)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`$${data.close}`, 72, 62);

      // Open Price Label
      ctx.fillStyle = '#AAAAAA';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('Open:', 42, 82);

      // Open Price Value
      ctx.fillStyle = '#CCCCCC';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText(`$${data.open}`, 102, 82);

      // Divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 92);
      ctx.lineTo(124, 92);
      ctx.stroke();

      // Change percentage with arrow
      const arrow = isPositive ? '▲' : '▼';
      ctx.fillStyle = changeColor;
      ctx.font = 'bold 24px "Segoe UI", sans-serif';
      ctx.fillText(`${arrow} ${data.percentChange}%`, 72, 118);

      // Profit/Loss label (if custom calculation)
      if (data.isCustom) {
        ctx.fillStyle = '#AAAAAA';
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.fillText('Your P/L', 72, 135);
      }
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
    isActive && canvasFunc(context, 'loading');
    clearTimeout(record[context]?.timer);

    if (!symbol || symbol.trim() === '') {
      canvasFunc(context, 'error');
      return;
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1mo&range=1mo`;

    GET(context, url, (e) => {
      try {
        if (e.chart && e.chart.result?.[0]) {
          const result = e.chart.result[0];
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
            percentChange = previousClose > 0 ? ((change / previousClose) * 100) : 0;
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

      // Refresh based on interval
      const interval = record[context]?.interval || 10000;
      record[context].timer = setTimeout(() => {
        fetchStockPrice(context, symbol, cost, qty, false);
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
      const symbol = settings.symbol || 'AAPL';
      const cost = settings.cost ? parseFloat(settings.cost) : undefined;
      const qty = settings.qty ? parseFloat(settings.qty) : undefined;

      fetchStockPrice(context, symbol, cost, qty);
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

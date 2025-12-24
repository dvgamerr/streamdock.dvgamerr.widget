import { usePluginStore, useWatchEvent } from '@/hooks/plugin.js';

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;

  // Event listener
  const plugin = usePluginStore();
  let intervalId: string | null = null;
  let currentInterval: number = 15;
  let lastGoldPrice: number = 0;
  let lastExchangeRate: number = 1;

  // Fetch gold price from YLG Bullion API
  const fetchGoldPrice = async () => {
    try {
      const response = await fetch('https://register.ylgbullion.co.th/api/price/gold');
      const data = await response.json();
      const goldPrice = data.spot?.tin || 'N/A';
      const exchangeRate = parseFloat(data.exchange_sale || 1);

      // Store last values
      lastGoldPrice = goldPrice;
      lastExchangeRate = exchangeRate;

      // Update all actions with the gold price
      const actions = plugin.getActions(ActionID);
      actions.forEach((actionItem) => {
        const actionData = plugin.getAction(actionItem.context);
        const currency = (actionData?.settings as any)?.currency || 'USD';
        updateCanvas(actionItem.context, goldPrice, exchangeRate, currency);
      });
    } catch (error) {
      console.error('Failed to fetch gold price:', error);
    }
  };

  // Update canvas with gold price
  const updateCanvas = (context: string, price: number, exchangeRate: number, currency: string) => {
    const action = plugin.getAction(context);
    if (!action) return;

    const canvas = document.createElement('canvas');
    canvas.width = 144;
    canvas.height = 144;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Calculate price based on currency
      const finalPrice = currency === 'USD' ? price : price * exchangeRate;

      // Format price with commas
      const formattedPrice = finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // Background with gradient
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 144, 144);

      // Gold price text
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw "GOLD" label
      ctx.font = 'bold 22px "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('GOLD', 72, 40);

      // Draw price (larger and formatted)
      ctx.font = `bold ${currency === 'USD' ? '32px' : '24px'} "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillText(formattedPrice, 72, 80);

      // Draw currency label
      ctx.font = '16px "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#AAAAAA';
      ctx.fillText(currency, 72, 115);

      action.setImage(canvas.toDataURL('image/png'));
    }
  };

  plugin.eventEmitter.subscribe('stopBackground', (data) => {
    // Stop background and release resources
    plugin.stopBackground(data.device);
  });

  // Monitor device events
  watch(
    () => Array.from(plugin.devices),
    (newDevices, oldDevices) => {
      // Compare device list changes
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
      // Get interval from settings (default 15 seconds)
      const interval = (payload.settings as any)?.interval || 15;
      currentInterval = interval;

      // Start fetching gold price with configured interval
      if (!intervalId) {
        intervalId = `gold-price-${ActionID}`;
        plugin.Interval(intervalId, interval * 1000, fetchGoldPrice);
        fetchGoldPrice(); // Fetch immediately
      }
    },
    willDisappear({ context }) {
      // Stop interval if no more actions
      const actions = plugin.getActions(ActionID);
      if (actions.length === 0 && intervalId) {
        plugin.Unterval(intervalId);
        intervalId = null;
      }
    },
    keyUp({ context }) {
      // Open TradingView when button is pressed
      const action = plugin.getAction(context);
      if (action) {
        action.openUrl('https://th.tradingview.com/symbols/XAUUSD/');
      }
    },
    didReceiveSettings({ context, payload }) {
      // Update interval when settings change
      const interval = (payload.settings as any)?.interval || 15;
      const currency = (payload.settings as any)?.currency || 'USD';

      if (interval !== currentInterval && intervalId) {
        currentInterval = interval;
        // Restart interval with new timing
        plugin.Unterval(intervalId);
        plugin.Interval(intervalId, interval * 1000, fetchGoldPrice);
        fetchGoldPrice(); // Fetch immediately with new interval
      } else {
        // Currency changed, update display immediately with last known values
        if (lastGoldPrice > 0) {
          updateCanvas(context, lastGoldPrice, lastExchangeRate, currency);
        } else {
          // If no data yet, fetch new data
          fetchGoldPrice();
        }
      }
    }
  });
}

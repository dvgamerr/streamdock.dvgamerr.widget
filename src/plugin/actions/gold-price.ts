import { usePluginStore, useWatchEvent } from '@/hooks/plugin.js';
import { CANVAS_SIZE, accentGradient, drawBackground, drawDivider, PALETTES } from '../canvas-style.js';

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;

  // Event listener
  const plugin = usePluginStore();
  let intervalId: string | null = null;
  let currentInterval: number = 15;
  let lastGoldPrice: number = 0;
  let lastExchangeRate: number = 1;

  // Get settings with defaults
  const getSettings = (context: string) => {
    const action = plugin.getAction(context);
    const settings = (action?.settings as any) || {};
    return {
      currency: settings.currency || 'USD',
      interval: settings.interval || 15
    };
  };

  // Fetch gold price from YLG Bullion API
  const fetchGoldPrice = async () => {
    // Update all actions with loading state
    const actions = plugin.getActions(ActionID);

    try {
      const response = await fetch('https://register.ylgbullion.co.th/api/price/gold');
      const data = await response.json();
      const goldPrice = data.spot?.tin || 'N/A';
      const exchangeRate = parseFloat(data.exchange_sale || 1);

      // Store last values
      lastGoldPrice = goldPrice;
      lastExchangeRate = exchangeRate;

      // Update all actions with the gold price
      actions.forEach((actionItem) => {
        const { currency } = getSettings(actionItem.context);
        updateCanvas(actionItem.context, goldPrice, exchangeRate, currency);
      });
    } catch (error) {
      console.error('Failed to fetch gold price:', error);
      // Update all actions with error state
      actions.forEach((actionItem) => {
        const { currency } = getSettings(actionItem.context);
        updateCanvas(actionItem.context, 0, 1, currency, 'error');
      });
    }
  };

  // Update canvas with gold price
  const updateCanvas = (context: string, price: number, exchangeRate: number, currency: string, status?: string) => {
    const action = plugin.getAction(context);
    if (!action) return;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    if (status === 'error') {
      drawBackground(ctx, PALETTES.rose.bg);
      ctx.fillStyle = accentGradient(ctx, PALETTES.rose);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.fillText('Error', 72, 60);
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('Check connection', 72, 88);
    } else {
      const palette = PALETTES.gold;
      drawBackground(ctx, palette.bg);

      // Calculate price based on currency
      const finalPrice = currency === 'USD' ? price : price * exchangeRate;
      const formattedPrice = finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // Title: GOLD with currency
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText(`GOLD (${currency})`, 72, 30);

      drawDivider(ctx, palette, 40);

      // Price
      ctx.fillStyle = accentGradient(ctx, palette);
      ctx.font = `bold ${currency === 'USD' ? '30px' : '24px'} "Segoe UI", sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(formattedPrice, 72, 80);

      // Subtitle
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Spot Tin', 72, 122);
    }

    action.setImage(canvas.toDataURL('image/png'));
  };

  plugin.eventEmitter.subscribe('stopBackground', (data: { device: string }) => {
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
      const { interval } = getSettings(context);
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
      const { interval, currency } = getSettings(context);

      if (interval !== currentInterval && intervalId) {
        currentInterval = interval;
        // Restart interval with new timing
        plugin.Unterval(intervalId);
        plugin.Interval(intervalId, interval * 1000, fetchGoldPrice);
        fetchGoldPrice(); // Fetch immediately with new interval
      } else {
        fetchGoldPrice();
        updateCanvas(context, lastGoldPrice, lastExchangeRate, currency);
      }
    }
  });
}

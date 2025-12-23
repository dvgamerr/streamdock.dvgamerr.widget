import { usePluginStore, useWatchEvent } from '@/hooks/plugin';
export default function (name) {
    const ActionID = `${window.argv[3].plugin.uuid}.${name}`;
    // Event listener
    const plugin = usePluginStore();
    let intervalId = null;
    // Fetch gold price from YLG Bullion API
    const fetchGoldPrice = async () => {
        try {
            const response = await fetch('https://register.ylgbullion.co.th/api/price/gold');
            const data = await response.json();
            const goldPrice = data.spot?.tin || 'N/A';
            // Update all actions with the gold price
            const actions = plugin.getActions(ActionID);
            actions.forEach((action) => {
                updateCanvas(action.context, goldPrice);
            });
        }
        catch (error) {
            console.error('Failed to fetch gold price:', error);
        }
    };
    // Update canvas with gold price
    const updateCanvas = (context, price) => {
        const action = plugin.getAction(context);
        if (!action)
            return;
        const canvas = document.createElement('canvas');
        canvas.width = 144;
        canvas.height = 144;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Format price with commas
            const formattedPrice = typeof price === 'number' ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : price;
            // Background with gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, 144);
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(1, '#2a2a2a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 144, 144);
            // Gold price text
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Draw "GOLD" label
            ctx.font = 'bold 22px "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText('GOLD', 72, 40);
            // Draw price (larger and formatted)
            ctx.font = 'bold 32px "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText(formattedPrice, 72, 80);
            // Draw USD label
            ctx.font = '16px "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillStyle = '#AAAAAA';
            ctx.fillText('USD', 72, 115);
            action.setImage(canvas.toDataURL('image/png'));
        }
    };
    plugin.eventEmitter.subscribe('stopBackground', (data) => {
        // Stop background and release resources
        plugin.stopBackground(data.device);
    });
    // Monitor device events
    watch(() => Array.from(plugin.devices), (newDevices, oldDevices) => {
        // Compare device list changes
        const delDevices = oldDevices.filter((item) => !newDevices.includes(item));
        delDevices.forEach((device) => {
            // Clean up removed devices
        });
    }, { deep: true });
    useWatchEvent('action', {
        ActionID,
        willAppear({ context }) {
            console.log('Action created:', context);
            // Start fetching gold price every 15 seconds
            if (!intervalId) {
                intervalId = `gold-price-${ActionID}`;
                plugin.Interval(intervalId, 15000, fetchGoldPrice);
                fetchGoldPrice(); // Fetch immediately
            }
        },
        willDisappear({ context }) {
            console.log('Action removed:', context);
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
        }
    });
}

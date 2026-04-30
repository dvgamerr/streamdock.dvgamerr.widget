import { usePluginStore, useWatchEvent } from '@/hooks/plugin.js';
import { CANVAS_SIZE, accentGradient, drawBackground, drawDivider, PALETTES } from '../canvas-style.js';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isWorkTime = (now: Date, startH: number, endH: number): boolean => {
  const day = now.getDay(); // 0=Sun … 6=Sat
  if (day === 0 || day === 6) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= startH * 60 && mins < endH * 60;
};

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;
  const plugin = usePluginStore();
  const record: Record<string, { startH: number; endH: number }> = {};
  const timerKey = (ctx: string) => `work-hours-${ctx}`;

  const canvasFunc = (context: string) => {
    const action = plugin.getAction(context);
    if (!action) return;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { startH = 9, endH = 18 } = record[context] || {};
    const now = new Date();
    const working = isWorkTime(now, startH, endH);
    const palette = working ? PALETTES.warm : PALETTES.slate;

    drawBackground(ctx, palette.bg);
    const accent = accentGradient(ctx, palette);

    // Status badge (top)
    const badge = working ? 'WORK' : 'REST';
    ctx.fillStyle = accent;
    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(badge, 72, 24);

    drawDivider(ctx, palette, 32);

    // HH:MM (large clock)
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    ctx.fillStyle = accent;
    ctx.font = 'bold 40px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${hh}:${mm}`, 72, 70);

    // Day of week
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(DAY_NAMES[now.getDay()], 72, 100);

    drawDivider(ctx, palette, 108);

    // Work-hours progress bar
    const startMins = startH * 60;
    const endMins = endH * 60;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const progress = Math.min(1, Math.max(0, (nowMins - startMins) / (endMins - startMins)));

    const barX = 16;
    const barY = 116;
    const barW = CANVAS_SIZE - 32;
    const barH = 8;

    // Track
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();

    // Fill
    if (progress > 0) {
      const fillGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
      fillGrad.addColorStop(0, palette.from);
      fillGrad.addColorStop(1, palette.to);
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, Math.max(barH, barW * progress), barH, 4);
      ctx.fill();
    }

    // Start / end labels
    ctx.fillStyle = 'rgba(255,255,255,0.40)';
    ctx.font = '9px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${startH}:00`, barX, barY + barH + 2);
    ctx.textAlign = 'right';
    ctx.fillText(`${endH}:00`, barX + barW, barY + barH + 2);

    action.setImage(canvas.toDataURL('image/png'));
  };

  useWatchEvent('action', {
    ActionID,
    willAppear({ context, payload }) {
      const settings = (payload?.settings as any) || {};
      record[context] = {
        startH: settings.startH ?? 9,
        endH: settings.endH ?? 18
      };
      canvasFunc(context);
      plugin.Interval(timerKey(context), 60000, () => canvasFunc(context));
    },
    willDisappear({ context }) {
      plugin.Unterval(timerKey(context));
      delete record[context];
    },
    didReceiveSettings({ context, payload }) {
      const settings = (payload?.settings as any) || {};
      if (record[context]) {
        record[context].startH = settings.startH ?? 9;
        record[context].endH = settings.endH ?? 18;
      }
      canvasFunc(context);
    }
  });

  return { name, ActionID };
}

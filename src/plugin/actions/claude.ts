import { usePluginStore, useWatchEvent } from '@/hooks/plugin.js';
import { CANVAS_SIZE, PALETTES, accentGradient, drawBackground } from '../canvas-style.js';

type UsageSegment = {
  found: boolean;
  used_percentage: number | null;
  reset_text: string | null;
  raw_line: string;
  raw_block: string;
};

type ClaudeUsagePayload = {
  ok: boolean;
  stale?: boolean;
  updatedAt?: string;
  source?: 'live' | 'cache';
  auth?: {
    ok: boolean;
    state: string;
    message: string | null;
  };
  usage?: {
    five_hour: UsageSegment;
    weekly: UsageSegment;
  } | null;
  error?: string | null;
};

type ClaudeRecord = {
  payload: ClaudeUsagePayload | null;
  frame: number;
  loading: boolean;
  showDetails: boolean;
};

const SERVER_URL = 'http://127.0.0.1:39452/usage';
const FETCH_INTERVAL = 60_000;
const RETRY_INTERVAL = 4_000;
const ANIMATION_INTERVAL = 120;
const CLAUDE_LOGO_COLOR = '#D97757';

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;
  const plugin = usePluginStore();
  const record: Record<string, ClaudeRecord> = {};
  let lastServerBootAt = 0;
  let iconLoaded = false;
  let iconFallbackTried = false;

  const getPluginRoot = () => {
    const href = window.location.href;
    const lastSlash = href.lastIndexOf('/');
    return lastSlash === -1 ? href : href.slice(0, lastSlash);
  };

  const iconImage = new Image();
  iconImage.onload = () => {
    iconLoaded = true;
    Object.keys(record).forEach((context) => canvasFunc(context));
  };
  iconImage.onerror = () => {
    if (!iconFallbackTried) {
      iconFallbackTried = true;
      iconImage.src = `${getPluginRoot()}/images/claude.svg`;
      return;
    }

    iconLoaded = false;
    Object.keys(record).forEach((context) => canvasFunc(context));
  };
  iconImage.src = `${getPluginRoot()}/images/claudecode-color.svg`;

  const fetchTimerKey = (context: string) => `claude-fetch-${context}`;
  const animationTimerKey = (context: string) => `claude-anim-${context}`;

  const ensureRecord = (context: string) => {
    if (!record[context]) {
      record[context] = {
        payload: null,
        frame: 0,
        loading: false,
        showDetails: false
      };
    }

    return record[context];
  };

  const clampPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
  };

  const bootUsageServer = (context: string) => {
    if (Date.now() - lastServerBootAt < 15_000) return;

    const action = plugin.getAction(context);
    if (!action) return;

    lastServerBootAt = Date.now();
    try {
      action.openUrl(`${getPluginRoot()}/scripts/ClaudeUsageServer.vbs`);
    } catch (error) {
      console.error('claude usage server launch error:', error);
    }
  };

  const fetchJson = async (url: string, timeoutMs: number) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store'
      });
      const json = (await response.json()) as ClaudeUsagePayload;
      return json;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const startAnimation = (context: string) => {
    plugin.Unterval(animationTimerKey(context));
    plugin.Interval(animationTimerKey(context), ANIMATION_INTERVAL, () => {
      const rec = record[context];
      if (!rec) return;
      rec.frame += 1;
      canvasFunc(context);
    });
  };

  const scheduleFetch = (context: string, delay: number) => {
    plugin.Untimeout(fetchTimerKey(context));
    plugin.Timeout(fetchTimerKey(context), delay, () => {
      fetchUsage(context, false);
    });
  };

  const fetchUsage = async (context: string, showLoading: boolean = true) => {
    const rec = ensureRecord(context);
    bootUsageServer(context);

    rec.loading = showLoading && !rec.payload;
    canvasFunc(context);

    try {
      const payload = await fetchJson(SERVER_URL, 12_000);
      rec.payload = payload;
      rec.loading = false;
      canvasFunc(context);

      const retrySoon = !payload.usage && !payload.auth?.ok;
      scheduleFetch(context, retrySoon ? RETRY_INTERVAL : FETCH_INTERVAL);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      rec.loading = false;
      rec.payload = rec.payload
        ? {
            ...rec.payload,
            stale: true,
            error: rec.payload.error || message
          }
        : {
            ok: false,
            stale: true,
            error: message,
            auth: {
              ok: false,
              state: 'offline',
              message
            },
            usage: null
          };

      bootUsageServer(context);
      canvasFunc(context);
      scheduleFetch(context, RETRY_INTERVAL);
    }
  };

  const drawUsageRing = (ctx: CanvasRenderingContext2D, percent: number, stale: boolean, isDead: boolean) => {
    const centerX = CANVAS_SIZE / 2;
    const centerY = 58;
    const radius = 42;
    const start = -Math.PI / 2;
    const end = start + (Math.PI * 2 * percent) / 100;
    const palette = PALETTES.warm;

    ctx.save();
    ctx.lineCap = 'round';

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    const ring = ctx.createLinearGradient(26, 18, 118, 108);
    ring.addColorStop(0, isDead ? '#777' : stale ? '#f5d0a9' : palette.from);
    ring.addColorStop(1, isDead ? '#444' : stale ? '#caa07c' : palette.to);
    ctx.strokeStyle = ring;
    ctx.shadowColor = isDead ? 'rgba(100,100,100,0.20)' : stale ? 'rgba(229, 190, 138, 0.30)' : 'rgba(255, 133, 84, 0.36)';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, start, end);
    ctx.stroke();

    ctx.restore();
  };

  const drawClaudeLogo = (ctx: CanvasRenderingContext2D, context: string, isDead: boolean) => {
    const rec = record[context];
    const frame = rec?.frame || 0;
    const lift = isDead ? 0 : (Math.sin(frame * 0.42) + 1) / 2;
    const bob = isDead ? 7 : -3 + Math.sin(frame * 0.42) * 4.4;
    const rotate = isDead ? 0.32 : Math.sin(frame * 0.26) * 0.11;
    const scaleX = isDead ? 0.9 : 0.98 + lift * 0.18;
    const scaleY = isDead ? 0.9 : 1.08 - lift * 0.16;

    ctx.save();
    ctx.translate(72, 58 + bob);
    ctx.rotate(rotate);
    ctx.scale(scaleX, scaleY);

    if (iconLoaded) {
      if (isDead) {
        ctx.filter = 'grayscale(100%) brightness(0.52)';
      } else {
        ctx.shadowColor = 'rgba(217, 119, 87, 0.25)';
        ctx.shadowBlur = 14;
      }
      ctx.drawImage(iconImage, -29, -29, 58, 58);
    } else {
      ctx.strokeStyle = isDead ? 'rgba(110,110,110,0.7)' : accentGradient(ctx, PALETTES.warm);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  };

  const canvasFunc = (context: string) => {
    const action = plugin.getAction(context);
    if (!action) return;

    const rec = ensureRecord(context);
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fiveHour = rec.payload?.usage?.five_hour;
    const weekly = rec.payload?.usage?.weekly;
    const percent = clampPercent(fiveHour?.used_percentage);
    const hasUsage = Boolean(fiveHour?.found);
    const authState = rec.payload?.auth?.state || '';
    const hasAuthIssue = !rec.payload?.auth?.ok && !!authState;
    const stale = Boolean(rec.payload?.stale);
    const showError = !rec.loading && !hasUsage && (hasAuthIssue || !!rec.payload?.error);
    const showDetails = rec.showDetails;

    drawBackground(ctx, showError ? PALETTES.rose.bg : stale ? '#332218' : '#2a170f');

    if (rec.loading && !rec.payload) {
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px "Segoe UI", sans-serif';
      ctx.fillText('...', 72, 120);
      action.setImage(canvas.toDataURL('image/png'));
      return;
    }

    if (showError) {
      ctx.fillStyle = accentGradient(ctx, PALETTES.rose);
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.fillText(authState === 'missing_credentials' ? 'LOGIN' : 'ERROR', 72, 124);

      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.font = 'bold 10px "Segoe UI", sans-serif';
      ctx.fillText(authState === 'missing_credentials' ? 'open Claude once' : 'helper offline', 72, 138);
      action.setImage(canvas.toDataURL('image/png'));
      return;
    }

    const isDead = hasUsage && percent >= 100;
    const fiveHourPercent = fiveHour?.found ? `${Math.round(clampPercent(fiveHour.used_percentage))}%` : '--';
    const weeklyPercent = weekly?.found ? `${Math.round(clampPercent(weekly.used_percentage))}%` : '--';
    const fiveHourReset = fiveHour?.reset_text || '--';
    const weeklyReset = weekly?.reset_text || '--';

    if (!showDetails) {
      drawUsageRing(ctx, hasUsage ? percent : 12, stale, isDead);
      drawClaudeLogo(ctx, context, isDead);

      const resetTime = fiveHour?.reset_text?.match(/\d{2}:\d{2}$/)?.[0] ?? (hasUsage ? `${Math.round(percent)}%` : '--');
      ctx.fillStyle = isDead ? 'rgba(140,140,140,0.88)' : CLAUDE_LOGO_COLOR;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.fillText(resetTime, 72, 140);

      action.setImage(canvas.toDataURL('image/png'));
      return;
    }

    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillText(`5H ${fiveHourPercent}`, 14, 30);
    ctx.fillText(`7D ${weeklyPercent}`, 14, 82);

    ctx.fillStyle = stale ? '#f5d0a9' : 'rgba(255,255,255,0.56)';
    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillText(fiveHourReset, 14, 50);
    ctx.fillText(weeklyReset, 14, 102);

    ctx.fillStyle = 'rgba(255,255,255,0.36)';
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.fillText('press to hide text', 14, 132);

    action.setImage(canvas.toDataURL('image/png'));
  };

  useWatchEvent('action', {
    ActionID,
    willAppear({ context }) {
      ensureRecord(context);
      startAnimation(context);
      fetchUsage(context, true);
    },
    willDisappear({ context }) {
      plugin.Untimeout(fetchTimerKey(context));
      plugin.Unterval(animationTimerKey(context));
      delete record[context];
    },
    keyUp({ context }) {
      const rec = ensureRecord(context);
      rec.showDetails = !rec.showDetails;
      rec.frame += 1;
      canvasFunc(context);
      fetchUsage(context, false);
    }
  });

  return { name, ActionID };
}

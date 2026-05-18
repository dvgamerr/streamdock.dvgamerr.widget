#!/usr/bin/env bun

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PORT = 39452;
const HOST = '127.0.0.1';
const CACHE_TTL_MS = 60_000;
const CACHE_PATH = join(process.env.TEMP || process.env.TMP || process.cwd(), 'streamdock-claude-usage.json');
const CREDENTIALS_PATH = join(process.env.CLAUDE_HOME || process.env.USERPROFILE || homedir(), '.claude', '.credentials.json');

let memoryCache = null;
let inflight = null;

const jsonHeaders = {
  'access-control-allow-origin': '*',
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8'
};

const formatResetText = (seconds) =>
  new Date(seconds * 1000).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
    hour12: false
  });

const toSegment = (utilization, reset) => {
  const used = utilization ? Math.round(parseFloat(utilization) * 10000) / 100 : null;
  const resetSeconds = reset ? Number(reset) : null;

  return {
    found: utilization !== null,
    used_percentage: Number.isFinite(used) ? used : null,
    reset_text: Number.isFinite(resetSeconds) ? formatResetText(resetSeconds) : reset || null,
    raw_line: JSON.stringify({ utilization, reset }),
    raw_block: JSON.stringify({ utilization, reset })
  };
};

const authStatus = (ok, state, message = null) => ({
  ok,
  state,
  message
});

const readDiskCache = async () => {
  if (!existsSync(CACHE_PATH)) return null;

  try {
    const text = await readFile(CACHE_PATH, 'utf8');
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const writeDiskCache = async (payload) => {
  try {
    await Bun.write(CACHE_PATH, JSON.stringify(payload, null, 2));
  } catch {
    // Ignore cache write failures.
  }
};

const readAccessToken = async () => {
  if (!existsSync(CREDENTIALS_PATH)) {
    return {
      ok: false,
      auth: authStatus(false, 'missing_credentials', `Claude credentials not found at ${CREDENTIALS_PATH}`),
      token: null
    };
  }

  try {
    const raw = await readFile(CREDENTIALS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const token = parsed?.claudeAiOauth?.accessToken || null;

    if (!token) {
      return {
        ok: false,
        auth: authStatus(false, 'missing_token', 'No OAuth access token in ~/.claude/.credentials.json'),
        token: null
      };
    }

    return {
      ok: true,
      auth: authStatus(true, 'authenticated', null),
      token
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      auth: authStatus(false, 'unreadable_credentials', message),
      token: null
    };
  }
};

const fetchLiveUsage = async () => {
  const tokenResult = await readAccessToken();
  const basePayload = {
    ok: false,
    stale: false,
    source: 'live',
    updatedAt: new Date().toISOString(),
    auth: tokenResult.auth,
    usage: null,
    error: null
  };

  if (!tokenResult.ok || !tokenResult.token) {
    return basePayload;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenResult.token}`,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: '0' }]
      }),
      signal: AbortSignal.timeout(15_000)
    });

    const usage = {
      five_hour: toSegment(
        response.headers.get('anthropic-ratelimit-unified-5h-utilization'),
        response.headers.get('anthropic-ratelimit-unified-5h-reset')
      ),
      weekly: toSegment(
        response.headers.get('anthropic-ratelimit-unified-7d-utilization'),
        response.headers.get('anthropic-ratelimit-unified-7d-reset')
      )
    };

    const payload = {
      ...basePayload,
      ok: response.ok,
      usage,
      error: response.ok ? null : `Anthropic API returned HTTP ${response.status}`
    };

    memoryCache = payload;
    await writeDiskCache(payload);
    return payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const cached = memoryCache || (await readDiskCache());

    if (cached?.usage) {
      return {
        ...cached,
        stale: true,
        source: 'cache',
        error: message
      };
    }

    return {
      ...basePayload,
      error: message
    };
  }
};

const getUsage = async (forceRefresh = false) => {
  if (!forceRefresh && memoryCache?.updatedAt) {
    const age = Date.now() - Date.parse(memoryCache.updatedAt);
    if (Number.isFinite(age) && age < CACHE_TTL_MS) return memoryCache;
  }

  if (!inflight) {
    inflight = fetchLiveUsage().finally(() => {
      inflight = null;
    });
  }

  return inflight;
};

Bun.serve({
  hostname: HOST,
  port: PORT,
  idleTimeout: 255,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...jsonHeaders,
          'access-control-allow-methods': 'GET, OPTIONS'
        }
      });
    }

    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          ok: true,
          updatedAt: new Date().toISOString(),
          cachePath: CACHE_PATH
        }),
        { headers: jsonHeaders }
      );
    }

    if (url.pathname === '/usage') {
      const payload = await getUsage(url.searchParams.get('fresh') === '1');
      return new Response(JSON.stringify(payload), { headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ ok: false, error: 'not_found' }), {
      status: 404,
      headers: jsonHeaders
    });
  }
});

console.log(`Claude usage helper listening on http://${HOST}:${PORT}`);

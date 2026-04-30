// Shared canvas styling helpers for all action widgets.
// Aims for a consistent "dark moody radial background + gradient accent"
// look inspired by the project's icon design language.

export const CANVAS_SIZE = 144;
export const CANVAS_RADIUS = 18;

export type Palette = {
  /** Inner accent of the radial background (warm tint at the centre). */
  bg: string;
  /** Top colour of the accent gradient. */
  from: string;
  /** Bottom colour of the accent gradient. */
  to: string;
};

export const PALETTES: Record<string, Palette> = {
  warm: { bg: '#3a1a10', from: '#FFB061', to: '#FF5C7A' }, // orange → pink
  rose: { bg: '#2e0a18', from: '#FDA4AF', to: '#F43F5E' }, // pink/red
  green: { bg: '#0d2a1c', from: '#86EFAC', to: '#22C55E' }, // mint → green
  gold: { bg: '#2a1f08', from: '#FFE27A', to: '#F59E0B' }, // gold
  cool: { bg: '#0c1a2e', from: '#93C5FD', to: '#38BDF8' }, // sky
  purple: { bg: '#1c0a2a', from: '#C4B5FD', to: '#8B5CF6' }, // violet
  slate: { bg: '#1a1d24', from: '#CBD5E1', to: '#64748B' } // neutral
};

/**
 * Paint the signature dark radial background with rounded corners.
 * Pass an accent colour (typically `palette.bg`) for the centre tint.
 */
export const drawBackground = (ctx: CanvasRenderingContext2D, accent: string = '#1a1418') => {
  const cx = CANVAS_SIZE / 2;
  const cy = CANVAS_SIZE / 2 - 6;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, CANVAS_SIZE, CANVAS_SIZE, CANVAS_RADIUS);
  ctx.clip();

  // Base black wash so the gradient stays moody.
  ctx.fillStyle = '#070608';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Radial accent.
  const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, CANVAS_SIZE * 0.85);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Subtle inner border to echo the outlined-icon look.
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(0.5, 0.5, CANVAS_SIZE - 1, CANVAS_SIZE - 1, CANVAS_RADIUS);
  ctx.stroke();

  ctx.restore();
};

/** Vertical accent gradient spanning the canvas. */
export const accentGradient = (ctx: CanvasRenderingContext2D, palette: Palette) => {
  const g = ctx.createLinearGradient(0, 18, 0, CANVAS_SIZE - 18);
  g.addColorStop(0, palette.from);
  g.addColorStop(1, palette.to);
  return g;
};

/** Horizontal hairline divider in the accent gradient. */
export const drawDivider = (ctx: CanvasRenderingContext2D, palette: Palette, y: number) => {
  const g = ctx.createLinearGradient(20, y, CANVAS_SIZE - 20, y);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, palette.from);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = g;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, y);
  ctx.lineTo(CANVAS_SIZE - 20, y);
  ctx.stroke();
  ctx.globalAlpha = 1;
};

/** Pick a palette from a hex colour by hue family — used by air-quality. */
export const paletteFromHex = (hex: string): Palette => {
  const h = hex.replace('#', '').toLowerCase();
  if (h === '22c55e') return PALETTES.green;
  if (h === 'ff9b57' || h === 'f59e0b') return PALETTES.gold;
  if (h === 'f97316') return PALETTES.warm;
  if (h === 'dc2626') return PALETTES.rose;
  if (h === '9333ea') return PALETTES.purple;
  if (h === '7f1d1d') return { bg: '#2a0606', from: '#F87171', to: '#7F1D1D' };
  return PALETTES.slate;
};

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const toFixed = (value: number, digits = 3) => {
  if (!Number.isFinite(value)) return '—';
  return Number.parseFloat(value.toFixed(digits)).toString();
};

export const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

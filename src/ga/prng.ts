export interface PRNG {
  seed: number;
  next(): number;
  nextInRange(min: number, max: number): number;
  nextInt(max: number): number;
  nextGaussian(mean: number, stdDev: number): number;
  shuffle<T>(array: T[]): void;
}

export const createMulberry32 = (seed: number): PRNG => {
  let state = seed >>> 0;
  let spare: number | null = null;

  const next = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const nextGaussian = (mean: number, stdDev: number) => {
    if (spare !== null) {
      const value = spare;
      spare = null;
      return mean + value * stdDev;
    }
    let u = 0;
    let v = 0;
    while (u === 0) u = next();
    while (v === 0) v = next();
    const mag = Math.sqrt(-2.0 * Math.log(u));
    const z0 = mag * Math.cos(2.0 * Math.PI * v);
    const z1 = mag * Math.sin(2.0 * Math.PI * v);
    spare = z1;
    return mean + z0 * stdDev;
  };

  const shuffle = <T>(array: T[]) => {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  return {
    seed,
    next,
    nextInRange(min: number, max: number) {
      return min + (max - min) * next();
    },
    nextInt(max: number) {
      return Math.floor(next() * max);
    },
    nextGaussian,
    shuffle,
  };
};

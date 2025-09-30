import type { Chromosome } from './types';
import type { PRNG } from './prng';

export const singlePointCrossover = (
  parentA: Chromosome,
  parentB: Chromosome,
  rng: PRNG,
): Chromosome => {
  if (parentA.length !== parentB.length || parentA.length < 2) {
    return [...parentA];
  }
  const point = rng.nextInt(parentA.length - 1) + 1;
  return [...parentA.slice(0, point), ...parentB.slice(point)];
};

export const uniformCrossover = (
  parentA: Chromosome,
  parentB: Chromosome,
  rng: PRNG,
): Chromosome => {
  const result: Chromosome = [];
  const length = Math.min(parentA.length, parentB.length);
  for (let i = 0; i < length; i += 1) {
    result.push(rng.next() < 0.5 ? parentA[i] : parentB[i]);
  }
  for (let i = length; i < parentA.length; i += 1) {
    result.push(parentA[i]);
  }
  return result;
};

export const crossover = (
  parentA: Chromosome,
  parentB: Chromosome,
  method: 'single' | 'uniform',
  rng: PRNG,
): Chromosome => {
  if (method === 'single') {
    return singlePointCrossover(parentA, parentB, rng);
  }
  return uniformCrossover(parentA, parentB, rng);
};

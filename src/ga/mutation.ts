import type { Chromosome, GAConfig } from './types';
import type { PRNG } from './prng';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const mutateChromosome = (
  genes: Chromosome,
  config: GAConfig,
  rng: PRNG,
): Chromosome => {
  const mutated: Chromosome = [];
  for (let i = 0; i < genes.length; i += 1) {
    const bounds = config.bounds[i] ?? config.bounds[config.bounds.length - 1] ?? { min: -10, max: 10 };
    const shouldMutate = rng.next() < config.mutationRate;
    if (!shouldMutate) {
      mutated.push(clamp(genes[i], bounds.min, bounds.max));
      continue;
    }
    const delta = rng.nextGaussian(0, config.mutationStdDev);
    mutated.push(clamp(genes[i] + delta, bounds.min, bounds.max));
  }
  return mutated;
};

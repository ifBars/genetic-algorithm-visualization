import type { Individual } from './types';
import type { PRNG } from './prng';

const makeRouletteWheel = (population: Individual[]) => {
  const minFitness = Math.min(...population.map((p) => p.fitness));
  const offset = minFitness < 0 ? Math.abs(minFitness) + 1e-6 : 0;
  let total = 0;
  const cumulative: number[] = population.map((ind) => {
    total += ind.fitness + offset;
    return total;
  });
  return { cumulative, total };
};

export const rouletteSelect = (population: Individual[], rng: PRNG): Individual => {
  const { cumulative, total } = makeRouletteWheel(population);
  if (total <= 0) {
    return population[Math.floor(rng.next() * population.length)];
  }
  const target = rng.next() * total;
  const index = cumulative.findIndex((value) => value >= target);
  return population[index === -1 ? population.length - 1 : index];
};

export const tournamentSelect = (
  population: Individual[],
  rng: PRNG,
  tournamentSize: number,
): Individual => {
  const size = Math.max(2, Math.min(tournamentSize, population.length));
  let best: Individual = population[rng.nextInt(population.length)];
  for (let i = 1; i < size; i += 1) {
    const challenger = population[rng.nextInt(population.length)];
    if (challenger.fitness > best.fitness) {
      best = challenger;
    }
  }
  return best;
};

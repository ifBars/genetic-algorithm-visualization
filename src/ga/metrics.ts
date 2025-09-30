import type { Individual } from './types';

export const computeAverageFitness = (population: Individual[]) => {
  if (!population.length) return 0;
  const sum = population.reduce((acc, ind) => acc + ind.fitness, 0);
  return sum / population.length;
};

export const computeDiversity = (population: Individual[]) => {
  if (!population.length) return 0;
  const length = population[0]?.genes.length ?? 0;
  if (length === 0) return 0;

  const means = new Array(length).fill(0);
  population.forEach((ind) => {
    ind.genes.forEach((value, idx) => {
      means[idx] += value;
    });
  });
  for (let i = 0; i < length; i += 1) {
    means[i] /= population.length;
  }

  const variances = new Array(length).fill(0);
  population.forEach((ind) => {
    ind.genes.forEach((value, idx) => {
      const diff = value - means[idx];
      variances[idx] += diff * diff;
    });
  });
  const avgVariance = variances.reduce((acc, value) => acc + value, 0) / (length * population.length);
  return Math.sqrt(avgVariance);
};

export const sortByFitnessDesc = (population: Individual[]) =>
  [...population].sort((a, b) => b.fitness - a.fitness);

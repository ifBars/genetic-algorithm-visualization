import { clamp } from '../utils/math';
import { simulateIndividual } from './simulation';
import type {
  PlatformerConfig,
  PlatformerIndividual,
  PlatformerLevel,
  SimulationResult,
} from './types';

const randomGene = () => Math.random() * 2 - 1;

const randomGaussian = () => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const makeBlankIndividual = (config: PlatformerConfig): PlatformerIndividual => ({
  id: '',
  genes: Array.from({ length: config.steps * 2 }, randomGene),
  fitness: 0,
  reachedGoal: false,
  fell: false,
  path: [],
  stepsTaken: 0,
});

export const createInitialPopulation = (config: PlatformerConfig): PlatformerIndividual[] =>
  Array.from({ length: config.populationSize }, () => makeBlankIndividual(config));

export const evaluatePopulation = (
  population: PlatformerIndividual[],
  config: PlatformerConfig,
  level: PlatformerLevel,
  generation: number,
): PlatformerIndividual[] =>
  population.map((individual, index) => {
    const { fitness, reachedGoal, fell, path, stepsTaken }: SimulationResult = simulateIndividual(
      individual.genes,
      config,
      level,
    );
    return {
      ...individual,
      id: `g${generation}-${index}`,
      fitness,
      reachedGoal,
      fell,
      path,
      stepsTaken,
    };
  });

const tournamentSelect = (population: PlatformerIndividual[], size = 3) => {
  let best = population[Math.floor(Math.random() * population.length)];
  for (let i = 1; i < size; i += 1) {
    const candidate = population[Math.floor(Math.random() * population.length)];
    if (candidate.fitness > best.fitness) {
      best = candidate;
    }
  }
  return best;
};

const crossover = (
  parentA: PlatformerIndividual,
  parentB: PlatformerIndividual,
  rate: number,
): number[] => {
  if (Math.random() > rate) {
    return [...parentA.genes];
  }
  const genes: number[] = [];
  for (let i = 0; i < parentA.genes.length; i += 1) {
    genes.push(Math.random() < 0.5 ? parentA.genes[i] : parentB.genes[i] ?? parentA.genes[i]);
  }
  return genes;
};

const mutate = (genes: number[], config: PlatformerConfig): number[] =>
  genes.map((gene) => {
    if (Math.random() > config.mutationRate) {
      return clamp(gene, -1, 1);
    }
    const mutated = gene + randomGaussian() * config.mutationStdDev;
    return clamp(mutated, -1, 1);
  });

export const evolvePopulation = (
  evaluated: PlatformerIndividual[],
  config: PlatformerConfig,
): PlatformerIndividual[] => {
  const sorted = [...evaluated].sort((a, b) => b.fitness - a.fitness);
  const next: PlatformerIndividual[] = [];

  const eliteCount = Math.min(config.eliteCount, sorted.length);
  for (let i = 0; i < eliteCount; i += 1) {
    const elite = sorted[i];
    next.push({
      ...elite,
      id: '',
      genes: [...elite.genes],
      path: [],
      stepsTaken: 0,
      reachedGoal: false,
      fell: false,
      fitness: 0,
    });
  }

  while (next.length < config.populationSize) {
    const parentA = tournamentSelect(sorted);
    const parentB = tournamentSelect(sorted);
    const childGenes = mutate(crossover(parentA, parentB, config.crossoverRate), config);
    next.push({
      id: '',
      genes: childGenes,
      fitness: 0,
      reachedGoal: false,
      fell: false,
      path: [],
      stepsTaken: 0,
    });
  }

  return next;
};

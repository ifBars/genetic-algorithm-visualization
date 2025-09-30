import type { ConfigPreset, GAConfig } from '../ga/types';
import { fitnessPresets } from '../ga/fitness';

const toBounds = (length: number, source: Array<{ min: number; max: number }>) => {
  const last = source[source.length - 1] ?? { min: -10, max: 10 };
  if (source.length >= length) {
    return source.slice(0, length);
  }
  return [...source, ...Array.from({ length: length - source.length }, () => ({ ...last }))];
};

export const createDefaultConfig = (): GAConfig => {
  const preset = fitnessPresets[0];
  const chromosomeLength = preset.suggestedLength;
  return {
    populationSize: 120,
    chromosomeLength,
    selection: 'roulette',
    tournamentSize: 3,
    crossover: 'single',
    crossoverRate: 0.8,
    mutationRate: 0.1,
    mutationStdDev: 0.2,
    elitism: 2,
    bounds: toBounds(chromosomeLength, preset.suggestedBounds),
    fitnessFnName: 'preset1',
    customFitnessCode: 'return Math.sin(x) * Math.cos(y) + 0.5 * Math.sin(2 * x);',
    seed: 1337,
    maxGenerations: 400,
  };
};

export const configPresets: ConfigPreset[] = [
  {
    id: 'fast',
    label: 'Fast Demo',
    description: 'Small population for quick visual feedback (~60 gens).',
    apply: (config) => ({
      ...config,
      populationSize: Math.max(10, Math.min(120, Math.round(config.populationSize * 0.6))),
      mutationRate: 0.18,
      mutationStdDev: 0.35,
      maxGenerations: 120,
    }),
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Moderate exploration with roulette selection.',
    apply: (config) => ({
      ...config,
      populationSize: 160,
      selection: 'roulette',
      crossover: 'uniform',
      crossoverRate: 0.75,
      mutationRate: 0.12,
      mutationStdDev: 0.25,
      elitism: 4,
      maxGenerations: 250,
    }),
  },
  {
    id: 'explore',
    label: 'Exploratory',
    description: 'Large population with tournament pressure for deep search.',
    apply: (config) => ({
      ...config,
      populationSize: 320,
      selection: 'tournament',
      tournamentSize: 5,
      crossover: 'single',
      crossoverRate: 0.88,
      mutationRate: 0.08,
      mutationStdDev: 0.4,
      elitism: 6,
      maxGenerations: 500,
    }),
  },
];

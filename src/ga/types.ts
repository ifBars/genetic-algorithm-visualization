export type Gene = number;

export type Chromosome = Gene[];

export type FitnessPresetId = 'preset1' | 'preset2' | 'preset3' | 'preset4' | 'preset5';

export interface Individual {
  id: string;
  genes: Chromosome;
  fitness: number;
  parents?: string[];
}

export interface GAConfig {
  populationSize: number;
  chromosomeLength: number;
  selection: 'roulette' | 'tournament';
  tournamentSize: number;
  crossover: 'single' | 'uniform';
  crossoverRate: number;
  mutationRate: number;
  mutationStdDev: number;
  elitism: number;
  bounds: Array<{ min: number; max: number }>;
  fitnessFnName: FitnessPresetId | 'custom';
  customFitnessCode?: string;
  seed: number;
  maxGenerations: number;
}

export interface GAState {
  generation: number;
  population: Individual[];
  bestSoFar: Individual | null;
  history: Array<{ gen: number; best: number; avg: number; diversity: number }>;
  running: boolean;
}

export type FitnessFunction = (genes: Chromosome) => number;

export interface FitnessDefinition {
  id: FitnessPresetId;
  name: string;
  description: string;
  suggestedBounds: Array<{ min: number; max: number }>;
  suggestedLength: number;
  evaluate: FitnessFunction;
}

export interface ConfigPreset {
  id: 'fast' | 'balanced' | 'explore';
  label: string;
  description: string;
  apply: (config: GAConfig) => GAConfig;
}

export interface ExportPayload {
  config: GAConfig;
  lastGenerations: GAState['history'];
  bestIndividual: Individual | null;
}

export interface EngineSnapshot {
  state: GAState;
  config: GAConfig;
}

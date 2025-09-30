import { buildFitness } from './fitness';
import { mutateChromosome } from './mutation';
import { crossover } from './crossover';
import { rouletteSelect, tournamentSelect } from './selection';
import { computeAverageFitness, computeDiversity, sortByFitnessDesc } from './metrics';
import { createMulberry32 } from './prng';
import type { PRNG } from './prng';
import type { Chromosome, GAConfig, GAState, Individual } from './types';

const DEFAULT_BOUND = { min: -10, max: 10 };

const cloneGenes = (genes: Chromosome) => genes.map((value) => value);

export class GAEngine {
  private config!: GAConfig;

  private rng!: PRNG;

  private fitnessFn!: (genes: Chromosome) => number;

  private bounds!: GAConfig['bounds'];

  private idCounter = 0;

  private state!: GAState;

  private fitnessError?: string;

  constructor(config: GAConfig) {
    const { state } = this.reset(config);
    this.state = state;
  }

  getState = (): GAState => this.state;

  getConfig = () => this.config;

  getFitnessError = () => this.fitnessError;

  setRunning = (running: boolean) => {
    this.state = { ...this.state, running };
    return this.state;
  };

  reset = (config: GAConfig) => {
    const appliedConfig = { ...config, bounds: config.bounds.length ? config.bounds : [DEFAULT_BOUND, DEFAULT_BOUND] };
    this.config = appliedConfig;
    const { fn, error, appliedBounds } = buildFitness(appliedConfig);
    this.fitnessFn = fn;
    this.fitnessError = error;
    this.bounds = appliedBounds.length ? appliedBounds : appliedConfig.bounds;
    this.rng = createMulberry32(appliedConfig.seed >>> 0);
    this.idCounter = 0;
    const initialPopulation = Array.from({ length: appliedConfig.populationSize }, () =>
      this.createIndividual(this.randomGenes(), []),
    );
    this.state = this.evaluatePopulation(initialPopulation, 0, false, undefined);
    return { state: this.state, error: this.fitnessError };
  };

  step = (): GAState => {
    if (this.state.generation >= this.config.maxGenerations) {
      this.state = { ...this.state, running: false };
      return this.state;
    }

    const sorted = sortByFitnessDesc(this.state.population);
    const nextPopulation: Individual[] = [];

    const eliteCount = Math.max(0, Math.min(this.config.elitism, sorted.length));
    for (let i = 0; i < eliteCount; i += 1) {
      const elite = sorted[i];
      nextPopulation.push(this.createIndividual(cloneGenes(elite.genes), [elite.id]));
    }

    while (nextPopulation.length < this.config.populationSize) {
      const parentA = this.selectParent(sorted);
      const parentB = this.selectParent(sorted);
      const shouldCrossover = this.rng.next() < this.config.crossoverRate;
      const baseGenes = shouldCrossover
        ? crossover(parentA.genes, parentB.genes, this.config.crossover, this.rng)
        : cloneGenes(parentA.fitness >= parentB.fitness ? parentA.genes : parentB.genes);
      const genes = mutateChromosome(baseGenes, this.config, this.rng);
      nextPopulation.push(this.createIndividual(genes, [parentA.id, parentB.id]));
    }

    if (nextPopulation.length > this.config.populationSize) {
      nextPopulation.length = this.config.populationSize;
    }

    this.state = this.evaluatePopulation(nextPopulation, this.state.generation + 1, this.state.running, this.state);
    return this.state;
  };

  private selectParent = (population: Individual[]): Individual => {
    if (this.config.selection === 'roulette') {
      return rouletteSelect(population, this.rng);
    }
    return tournamentSelect(population, this.rng, this.config.tournamentSize);
  };

  private createIndividual = (genes: Chromosome, parents: string[]): Individual => {
    this.idCounter += 1;
    const fitness = this.fitnessFn(genes);
    return {
      id: `i${this.idCounter}`,
      genes,
      fitness,
      parents: parents.length ? parents : undefined,
    };
  };

  private evaluatePopulation = (
    population: Individual[],
    generation: number,
    running: boolean,
    previous: GAState | undefined,
  ): GAState => {
    const evaluated = population.map((individual) => ({
      ...individual,
      fitness: this.fitnessFn(individual.genes),
    }));
    const sorted = sortByFitnessDesc(evaluated);
    const best = sorted[0] ?? null;
    const avg = computeAverageFitness(evaluated);
    const diversity = computeDiversity(evaluated);
    const historyEntry = { gen: generation, best: best?.fitness ?? 0, avg, diversity };
    const previousHistory = previous?.history ?? [];
    const history = generation === 0 ? [historyEntry] : [...previousHistory, historyEntry];
    const previousBest = previous?.bestSoFar ?? null;
    const bestSoFar = !previousBest || !best || best.fitness >= previousBest.fitness ? best : previousBest;
    return {
      generation,
      population: evaluated,
      bestSoFar,
      history,
      running,
    };
  };

  private randomGenes = (): Chromosome =>
    Array.from({ length: this.config.chromosomeLength }, (_, index) => {
      const bounds = this.bounds[index] ?? this.bounds[this.bounds.length - 1] ?? DEFAULT_BOUND;
      return this.rng.nextInRange(bounds.min, bounds.max);
    });
}

export const createEngine = (config: GAConfig) => new GAEngine(config);

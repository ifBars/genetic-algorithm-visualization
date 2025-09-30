import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { defaultLevel } from './level';
import {
  createInitialPopulation,
  evaluatePopulation,
  evolvePopulation,
} from './genetics';
import { defaultPlatformerConfig } from './config';
import type {
  PlatformerConfig,
  PlatformerIndividual,
  PlatformerLevel,
} from './types';

interface HistoryEntry {
  gen: number;
  best: number;
  avg: number;
  reached: number;
}

interface TrainerState {
  generation: number;
  evaluated: PlatformerIndividual[];
  populationBase: PlatformerIndividual[];
  bestEver: PlatformerIndividual | null;
  history: HistoryEntry[];
}

const computeStats = (evaluated: PlatformerIndividual[]) => {
  if (!evaluated.length) {
    return { best: 0, avg: 0, reached: 0, bestIndividual: null as PlatformerIndividual | null };
  }
  const sorted = [...evaluated].sort((a, b) => b.fitness - a.fitness);
  const bestIndividual = sorted[0];
  const sum = evaluated.reduce((acc, individual) => acc + individual.fitness, 0);
  const reached = evaluated.filter((individual) => individual.reachedGoal).length;
  return {
    best: bestIndividual.fitness,
    avg: sum / evaluated.length,
    reached,
    bestIndividual,
  };
};

const createInitialState = (
  config: PlatformerConfig,
  level: PlatformerLevel,
): TrainerState => {
  const initialPopulation = createInitialPopulation(config);
  const evaluated = evaluatePopulation(initialPopulation, config, level, 0);
  const stats = computeStats(evaluated);
  return {
    generation: 0,
    evaluated,
    populationBase: evolvePopulation(evaluated, config),
    bestEver: stats.bestIndividual,
    history: [
      {
        gen: 0,
        best: stats.best,
        avg: stats.avg,
        reached: stats.reached,
      },
    ],
  };
};

export const usePlatformerTrainer = (initialConfig?: PlatformerConfig) => {
  const level = useMemo(() => defaultLevel, []);
  const [config, setConfig] = useState<PlatformerConfig>(initialConfig ?? defaultPlatformerConfig);
  const [state, setState] = useState<TrainerState>(() => createInitialState(initialConfig ?? defaultPlatformerConfig, level));
  const [running, setRunning] = useState(false);
  const [loopDelay, setLoopDelay] = useState(600);

  const loopRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const reset = useCallback(
    (overrides?: Partial<PlatformerConfig>) => {
      setConfig((current) => {
        const nextConfig = { ...current, ...overrides };
        setState(createInitialState(nextConfig, level));
        return nextConfig;
      });
      setRunning(false);
      runningRef.current = false;
      if (loopRef.current) {
        window.clearTimeout(loopRef.current);
        loopRef.current = null;
      }
    },
    [level],
  );

  const step = useCallback(() => {
    setState((current) => {
      const generation = current.generation + 1;
      const evaluated = evaluatePopulation(current.populationBase, config, level, generation);
      const stats = computeStats(evaluated);
      const nextPopulation = evolvePopulation(evaluated, config);
      const bestEver = stats.bestIndividual && (!current.bestEver || stats.bestIndividual.fitness > current.bestEver.fitness)
        ? stats.bestIndividual
        : current.bestEver;
      return {
        generation,
        evaluated,
        populationBase: nextPopulation,
        bestEver,
        history: [...current.history.slice(-199), {
          gen: generation,
          best: stats.best,
          avg: stats.avg,
          reached: stats.reached,
        }],
      };
    });
  }, [config, level]);

  const pause = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (loopRef.current) {
      window.clearTimeout(loopRef.current);
      loopRef.current = null;
    }
  }, []);

  const run = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);

    const tick = () => {
      if (!runningRef.current) return;
      step();
      loopRef.current = window.setTimeout(tick, loopDelay);
    };

    loopRef.current = window.setTimeout(tick, 10);
  }, [loopDelay, step]);

  useEffect(() => () => pause(), [pause]);

  useEffect(() => {
    if (!runningRef.current) return;
    pause();
    run();
  }, [loopDelay, pause, run]);

  return {
    level,
    config,
    reset,
    applyConfig: reset,
    step,
    run,
    pause,
    running,
    loopDelay,
    setLoopDelay,
    state,
  };
};

import type { ExportPayload, GAConfig, GAState } from '../ga/types';

const clampBoundsArray = (bounds: GAConfig['bounds'], length: number) => {
  const safeBounds = bounds.map((bound) => {
    const min = Number.isFinite(bound.min) ? bound.min : -10;
    const max = Number.isFinite(bound.max) ? bound.max : 10;
    return min < max ? { min, max } : { min: Math.min(min, max) - 0.1, max: Math.max(min, max) };
  });
  const last = safeBounds[safeBounds.length - 1] ?? { min: -10, max: 10 };
  if (safeBounds.length >= length) {
    return safeBounds.slice(0, length);
  }
  return [...safeBounds, ...Array.from({ length: length - safeBounds.length }, () => ({ ...last }))];
};

export const normaliseConfig = (config: GAConfig): GAConfig => {
  const chromosomeLength = Math.max(1, Math.round(config.chromosomeLength));
  const populationSize = Math.min(1000, Math.max(10, Math.round(config.populationSize)));
  const maxGenerations = Math.max(1, Math.round(config.maxGenerations));
  const elitism = Math.max(0, Math.min(populationSize - 1, Math.round(config.elitism)));
  const tournamentSize = Math.max(2, Math.min(populationSize, Math.round(config.tournamentSize)));
  const crossoverRate = Math.min(1, Math.max(0, config.crossoverRate));
  const mutationRate = Math.min(1, Math.max(0, config.mutationRate));
  const mutationStdDev = Math.max(0, config.mutationStdDev);
  const bounds = clampBoundsArray(config.bounds, chromosomeLength);
  const seed = Math.floor(config.seed);

  return {
    ...config,
    chromosomeLength,
    populationSize,
    maxGenerations,
    elitism,
    tournamentSize,
    crossoverRate,
    mutationRate,
    mutationStdDev,
    bounds,
    seed,
  };
};

const isHistoryEntry = (entry: unknown): entry is GAState['history'][number] => {
  if (!entry || typeof entry !== 'object') return false;
  const maybe = entry as Record<string, unknown>;
  return ['gen', 'best', 'avg', 'diversity'].every((key) => typeof maybe[key] === 'number');
};

export const validateExportPayload = (data: unknown): { ok: true; payload: ExportPayload } | { ok: false; error: string } => {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'File is not a JSON object.' };
  }
  const maybe = data as Record<string, unknown>;
  if (!maybe.config || typeof maybe.config !== 'object') {
    return { ok: false, error: 'Missing config in export file.' };
  }
  const config = normaliseConfig(maybe.config as GAConfig);
  const lastGenerations = Array.isArray(maybe.lastGenerations) ? maybe.lastGenerations : [];
  const history = lastGenerations.filter(isHistoryEntry) as GAState['history'];
  const best = maybe.bestIndividual && typeof maybe.bestIndividual === 'object' ? maybe.bestIndividual : null;
  return {
    ok: true,
    payload: {
      config,
      lastGenerations: history,
      bestIndividual: best as ExportPayload['bestIndividual'],
    },
  };
};

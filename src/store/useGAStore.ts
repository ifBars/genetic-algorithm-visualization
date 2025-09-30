import { create } from 'zustand';

import { createEngine } from '../ga/engine';
import type { ConfigPreset, GAConfig, GAState, FitnessPresetId } from '../ga/types';
import { createDefaultConfig, configPresets } from '../data/presets';
import { normaliseConfig, validateExportPayload } from '../utils/validation';
import { populationToCsv } from '../utils/csv';
import { downloadTextFile } from '../utils/download';
import { fitnessPresets, getPresetSuggestion } from '../ga/fitness';

interface GAStoreState {
  config: GAConfig;
  gaState: GAState;
  pinnedIndividualId: string | null;
  lastError: string | null;
  fitnessError: string | null;
  setConfig: (update: Partial<GAConfig>) => void;
  setBounds: (index: number, min: number, max: number) => void;
  setChromosomeLength: (length: number) => void;
  setFitnessFnName: (fitness: GAConfig['fitnessFnName']) => void;
  setCustomFitnessCode: (code: string) => void;
  run: () => void;
  pause: () => void;
  step: () => void;
  reset: (options?: { seed?: number }) => void;
  reseed: () => void;
  applyPreset: (preset: ConfigPreset['id']) => void;
  exportSnapshotCsv: () => void;
  exportRunJson: () => void;
  importRun: (json: string) => Promise<{ ok: boolean; error?: string }>;
  pinIndividual: (id: string | null) => void;
  clearError: () => void;
}

const defaultConfig = createDefaultConfig();
const engine = createEngine(defaultConfig);
engine.setRunning(false);
const initialState = engine.getState();

const ensureBounds = (config: GAConfig, length: number) => {
  const safeBounds = [...config.bounds];
  const last = safeBounds[safeBounds.length - 1] ?? { min: -10, max: 10 };
  if (safeBounds.length >= length) {
    return safeBounds.slice(0, length);
  }
  return [...safeBounds, ...Array.from({ length: length - safeBounds.length }, () => ({ ...last }))];
};

const applyConfig = (current: GAConfig, update: Partial<GAConfig>): GAConfig => {
  const merged = { ...current, ...update } as GAConfig;
  merged.bounds = ensureBounds(merged, merged.chromosomeLength);
  return normaliseConfig(merged);
};

export const useGAStore = create<GAStoreState>((set, get) => ({
  config: defaultConfig,
  gaState: initialState,
  pinnedIndividualId: null,
  lastError: engine.getFitnessError() ?? null,
  fitnessError: engine.getFitnessError() ?? null,

  setConfig: (update) => {
    const nextConfig = applyConfig(get().config, update);
    const { state, error } = engine.reset(nextConfig);
    engine.setRunning(false);
    set({
      config: nextConfig,
      gaState: { ...state, running: false },
      fitnessError: error ?? null,
    });
  },

  setBounds: (index, min, max) => {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return;
    const bounds = [...get().config.bounds];
    const adjustedMin = Math.min(min, max - 1e-6);
    const adjustedMax = Math.max(max, min + 1e-6);
    bounds[index] = { min: adjustedMin, max: adjustedMax };
    get().setConfig({ bounds });
  },

  setChromosomeLength: (length) => {
    const actual = Math.max(1, Math.round(length));
    const current = get().config.fitnessFnName;
    const fallbackId: FitnessPresetId = current === 'custom' ? 'preset1' : current;
    const preset = getPresetSuggestion(fallbackId);
    const bounds = ensureBounds({ ...get().config, bounds: preset.suggestedBounds }, actual);
    get().setConfig({ chromosomeLength: actual, bounds });
  },

  setFitnessFnName: (fitnessName) => {
    if (fitnessName === 'custom') {
      get().setConfig({ fitnessFnName: fitnessName });
      return;
    }
    const preset = getPresetSuggestion(fitnessName);
    const adjusted = applyConfig(get().config, {
      fitnessFnName: fitnessName,
      chromosomeLength: preset.suggestedLength,
      bounds: ensureBounds({ ...get().config, bounds: preset.suggestedBounds }, preset.suggestedLength),
    });
    const { state, error } = engine.reset(adjusted);
    engine.setRunning(false);
    set({
      config: adjusted,
      gaState: { ...state, running: false },
      fitnessError: error ?? null,
    });
  },

  setCustomFitnessCode: (code) => {
    const nextConfig = applyConfig(get().config, { customFitnessCode: code, fitnessFnName: 'custom' });
    const { state, error } = engine.reset(nextConfig);
    engine.setRunning(false);
    set({
      config: nextConfig,
      gaState: { ...state, running: false },
      fitnessError: error ?? null,
    });
  },

  run: () => {
    const { gaState, config } = get();
    if (gaState.running || gaState.generation >= config.maxGenerations) return;
    const fresh = engine.setRunning(true);
    set({ gaState: { ...fresh, running: true } });
  },

  pause: () => {
    if (!get().gaState.running) return;
    const fresh = engine.setRunning(false);
    set({ gaState: { ...fresh, running: false } });
  },

  step: () => {
    const { config } = get();
    const next = engine.step();
    const running = next.generation < config.maxGenerations ? get().gaState.running : false;
    if (!running && next.generation >= config.maxGenerations) {
      engine.setRunning(false);
    }
    set({ gaState: { ...next, running } });
  },

  reset: (options) => {
    const seed = options?.seed ?? get().config.seed;
    const nextConfig = applyConfig(get().config, { seed });
    const { state, error } = engine.reset(nextConfig);
    engine.setRunning(false);
    set({
      config: nextConfig,
      gaState: { ...state, running: false },
      fitnessError: error ?? null,
    });
  },

  reseed: () => {
    const randomSeed = (() => {
      if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
        const buffer = new Uint32Array(1);
        crypto.getRandomValues(buffer);
        return buffer[0];
      }
      return Math.floor(Math.random() * 10_000_000);
    })();
    get().reset({ seed: randomSeed });
  },

  applyPreset: (presetId) => {
    const preset = configPresets.find((item) => item.id === presetId);
    if (!preset) return;
    const nextConfig = preset.apply(get().config);
    get().setConfig(nextConfig);
  },

  exportSnapshotCsv: () => {
    const { gaState } = get();
    const csv = populationToCsv(gaState.population);
    if (!csv) {
      set({ lastError: 'Population is empty; nothing to export.' });
      return;
    }
    downloadTextFile(`ga-population-gen-${gaState.generation}.csv`, csv);
  },

  exportRunJson: () => {
    const { config, gaState } = get();
    const payload = {
      config,
      lastGenerations: gaState.history.slice(-50),
      bestIndividual: gaState.bestSoFar,
    };
    downloadTextFile(`ga-run-gen-${gaState.generation}.json`, JSON.stringify(payload, null, 2));
  },

  importRun: async (json) => {
    try {
      const parsed = JSON.parse(json);
      const result = validateExportPayload(parsed);
      if (!result.ok) {
        set({ lastError: result.error });
        return { ok: false, error: result.error };
      }
      const { payload } = result;
      const { state, error } = engine.reset(payload.config);
      engine.setRunning(false);
      set({
        config: payload.config,
        gaState: { ...state, running: false },
        fitnessError: error ?? null,
      });
      const targetGeneration = payload.lastGenerations.at(-1)?.gen ?? 0;
      while (
        engine.getState().generation < targetGeneration &&
        engine.getState().generation < payload.config.maxGenerations
      ) {
        engine.step();
      }
      const after = engine.setRunning(false);
      set({ gaState: { ...after, running: false } });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse JSON import.';
      set({ lastError: message });
      return { ok: false, error: message };
    }
  },

  pinIndividual: (id) => set({ pinnedIndividualId: id }),

  clearError: () => set({ lastError: null, fitnessError: engine.getFitnessError() ?? null }),
}));

export const selectConfig = (state: GAStoreState) => state.config;
export const selectGAState = (state: GAStoreState) => state.gaState;
export const selectPinnedIndividualId = (state: GAStoreState) => state.pinnedIndividualId;
export const selectFitnessError = (state: GAStoreState) => state.fitnessError;
export const selectLastError = (state: GAStoreState) => state.lastError;
export const selectConfigPresets = () => configPresets;
export const selectFitnessPresets = () => fitnessPresets;

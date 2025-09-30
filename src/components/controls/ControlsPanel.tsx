import { useRef } from 'react';
import type { ChangeEvent } from 'react';

import {
  selectConfig,
  selectConfigPresets,
  selectFitnessError,
  selectFitnessPresets,
  selectGAState,
  selectLastError,
  useGAStore,
} from '../../store/useGAStore';
import type { ConfigPreset, GAConfig } from '../../ga/types';
import { toFixed } from '../../utils/math';

const numberFromEvent = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const value = Number(event.target.value);
  return Number.isFinite(value) ? value : 0;
};

const useActions = () => {
  const setConfig = useGAStore((state) => state.setConfig);
  const setBounds = useGAStore((state) => state.setBounds);
  const setChromosomeLength = useGAStore((state) => state.setChromosomeLength);
  const setFitnessFnName = useGAStore((state) => state.setFitnessFnName);
  const setCustomFitnessCode = useGAStore((state) => state.setCustomFitnessCode);
  const run = useGAStore((state) => state.run);
  const pause = useGAStore((state) => state.pause);
  const step = useGAStore((state) => state.step);
  const reset = useGAStore((state) => state.reset);
  const reseed = useGAStore((state) => state.reseed);
  const applyPreset = useGAStore((state) => state.applyPreset);
  const exportSnapshotCsv = useGAStore((state) => state.exportSnapshotCsv);
  const exportRunJson = useGAStore((state) => state.exportRunJson);
  const importRun = useGAStore((state) => state.importRun);
  const clearError = useGAStore((state) => state.clearError);

  return {
    setConfig,
    setBounds,
    setChromosomeLength,
    setFitnessFnName,
    setCustomFitnessCode,
    run,
    pause,
    step,
    reset,
    reseed,
    applyPreset,
    exportSnapshotCsv,
    exportRunJson,
    importRun,
    clearError,
  };
};

const PresetButtons = ({ presets }: { presets: ConfigPreset[] }) => {
  const applyPreset = useGAStore((state) => state.applyPreset);

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          title={preset.description}
          onClick={() => applyPreset(preset.id)}
          className="rounded-full border border-slate-700/70 bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-accent/60 hover:text-accent"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
};

export const ControlsPanel = () => {
  const config = useGAStore(selectConfig);
  const gaState = useGAStore(selectGAState);
  const presets = selectConfigPresets();
  const fitnessPresets = selectFitnessPresets();
  const actions = useActions();
  const fitnessError = useGAStore(selectFitnessError);
  const lastError = useGAStore(selectLastError);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    actions.importRun(text);
  };

  return (
    <aside className="flex w-full flex-col gap-5 rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-100 shadow-lg shadow-slate-950/50 lg:w-80 xl:w-96">
      <section aria-label="Run controls" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Controls</h2>
          <span className="text-xs text-slate-400">Generation {gaState.generation}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={actions.run}
            disabled={gaState.running || gaState.generation >= config.maxGenerations}
            className="rounded-2xl border border-emerald-500/50 bg-emerald-500/20 py-2 text-center font-semibold text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Run
          </button>
          <button
            type="button"
            onClick={actions.pause}
            disabled={!gaState.running}
            className="rounded-2xl border border-amber-500/50 bg-amber-500/10 py-2 text-center font-semibold text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={actions.step}
            disabled={gaState.generation >= config.maxGenerations}
            className="rounded-2xl border border-slate-600 bg-slate-800 py-2 font-semibold text-slate-200 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            Step
          </button>
          <button
            type="button"
            onClick={() => actions.reset()}
            className="rounded-2xl border border-slate-600 bg-slate-800 py-2 font-semibold text-slate-200 transition hover:border-rose-500 hover:text-rose-300"
          >
            Reset
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={actions.exportSnapshotCsv}
            className="rounded-full border border-slate-700/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-accent/60 hover:text-accent"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={actions.exportRunJson}
            className="rounded-full border border-slate-700/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-accent/60 hover:text-accent"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="rounded-full border border-slate-700/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-accent/60 hover:text-accent"
          >
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="application/json"
            onChange={handleImportFile}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
        {fitnessError && (
          <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200" role="alert">
            {fitnessError}
          </p>
        )}
        {lastError && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-200" role="alert">
            <span className="mt-0.5">{lastError}</span>
            <button
              type="button"
              className="ml-auto text-rose-200 underline"
              onClick={actions.clearError}
            >
              Dismiss
            </button>
          </div>
        )}
      </section>

      <section aria-label="Configuration presets" className="space-y-3">
        <header className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-100">Config Presets</h3>
          <span className="text-xs text-slate-500">Quick start</span>
        </header>
        <PresetButtons presets={presets} />
      </section>

      <section aria-label="Population settings" className="space-y-4">
        <h3 className="font-semibold text-slate-100">Population</h3>
        <label className="block text-xs uppercase tracking-wide text-slate-400" title="Number of individuals tracked per generation">
          Population Size
          <input
            type="number"
            min={10}
            max={1000}
            value={config.populationSize}
            onChange={(event) => actions.setConfig({ populationSize: numberFromEvent(event) })}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          />
          <span className="mt-1 block text-[10px] text-slate-500">2D default; set to 1 for 1D traces.</span>
        </label>
        <label className="block text-xs uppercase tracking-wide text-slate-400" title="Number of genes in each chromosome">
          Chromosome Length
          <input
            type="number"
            min={1}
            value={config.chromosomeLength}
            onChange={(event) => actions.setChromosomeLength(numberFromEvent(event))}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          />
        </label>
        <label className="block text-xs uppercase tracking-wide text-slate-400" title="Maximum generations before automatic pause">
          Generation Limit
          <input
            type="number"
            min={1}
            value={config.maxGenerations}
            onChange={(event) => actions.setConfig({ maxGenerations: numberFromEvent(event) })}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          />
        </label>
        <label className="block text-xs uppercase tracking-wide text-slate-400" title="How many top individuals survive untouched each generation">
          Elitism Count
          <input
            type="number"
            min={0}
            max={config.populationSize - 1}
            value={config.elitism}
            onChange={(event) => actions.setConfig({ elitism: numberFromEvent(event) })}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          />
        </label>
      </section>

      <section aria-label="Selection and crossover" className="space-y-3">
        <h3 className="font-semibold text-slate-100">Selection</h3>
        <label className="block text-xs uppercase tracking-wide text-slate-400" title="Selection pressure algorithm">
          Selection Method
          <select
            value={config.selection}
            onChange={(event) => actions.setConfig({ selection: event.target.value as GAConfig['selection'] })}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          >
            <option value="roulette">Roulette Wheel</option>
            <option value="tournament">Tournament</option>
          </select>
        </label>
        {config.selection === 'tournament' && (
          <label className="block text-xs uppercase tracking-wide text-slate-400" title="Competitors per tournament">
            Tournament Size
            <input
              type="number"
              min={2}
              max={config.populationSize}
              value={config.tournamentSize}
              onChange={(event) => actions.setConfig({ tournamentSize: numberFromEvent(event) })}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
            />
          </label>
        )}

        <div className="grid grid-cols-1 gap-3">
          <div>
            <h4 className="text-xs uppercase tracking-wide text-slate-400" title="Parent mixing strategy">
              Crossover
            </h4>
            <div className="mt-1 flex gap-3 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="crossover"
                  value="single"
                  checked={config.crossover === 'single'}
                  onChange={() => actions.setConfig({ crossover: 'single' })}
                />
                Single Point
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="crossover"
                  value="uniform"
                  checked={config.crossover === 'uniform'}
                  onChange={() => actions.setConfig({ crossover: 'uniform' })}
                />
                Uniform
              </label>
            </div>
          </div>
          <label className="block text-xs uppercase tracking-wide text-slate-400" title="Probability of crossover being applied">
            Crossover Rate
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={config.crossoverRate}
              onChange={(event) => actions.setConfig({ crossoverRate: Number(event.target.value) })}
              className="mt-1 w-full"
            />
            <span className="mt-1 inline-block text-xs text-slate-300">{toFixed(config.crossoverRate, 2)}</span>
          </label>
        </div>
      </section>

      <section aria-label="Mutation settings" className="space-y-3">
        <h3 className="font-semibold text-slate-100">Mutation</h3>
        <label className="block text-xs uppercase tracking-wide text-slate-400" title="Per-gene probability of applying mutation">
          Mutation Rate
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={config.mutationRate}
            onChange={(event) => actions.setConfig({ mutationRate: Number(event.target.value) })}
            className="mt-1 w-full"
          />
          <span className="mt-1 inline-block text-xs text-slate-300">{toFixed(config.mutationRate, 2)}</span>
        </label>
        <label className="block text-xs uppercase tracking-wide text-slate-400" title="Standard deviation of Gaussian mutation noise">
          Mutation Std Dev
          <input
            type="number"
            min={0}
            step={0.01}
            value={config.mutationStdDev}
            onChange={(event) => actions.setConfig({ mutationStdDev: numberFromEvent(event) })}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          />
        </label>
      </section>

      <section aria-label="Fitness configuration" className="space-y-3">
        <h3 className="font-semibold text-slate-100">Fitness Function</h3>
        <label className="block text-xs uppercase tracking-wide text-slate-400" title="Preset optimisation surfaces">
          Preset
          <select
            value={config.fitnessFnName}
            onChange={(event) => actions.setFitnessFnName(event.target.value as GAConfig['fitnessFnName'])}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          >
            {fitnessPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </label>
        <textarea
          value={config.customFitnessCode ?? ''}
          onChange={(event) => actions.setCustomFitnessCode(event.target.value)}
          placeholder={'return Math.sin(genes[0]);'}
          spellCheck={false}
          rows={5}
          aria-label="Custom fitness function"
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 font-mono text-xs text-slate-100"
        />
        <p className="text-xs text-slate-400">
          Custom code runs as <code>f(genes)</code>. Use math helpers from <code>Math.*</code>. Values are clamped to bounds.
        </p>
      </section>

      <section aria-label="Gene bounds" className="space-y-3">
        <h3 className="font-semibold text-slate-100">Gene Bounds</h3>
        <div className="space-y-3">
          {config.bounds.map((bound, index) => {
            const sliderMin = Math.min(bound.min - 5, -20);
            const sliderMax = Math.max(bound.max + 5, 20);
            return (
              <div key={index} className="rounded border border-slate-700 bg-slate-900/60 p-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Gene {index + 1}
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-xs text-slate-300" title="Lower bound">
                    Min
                    <input
                      type="number"
                      value={bound.min}
                      onChange={(event) => actions.setBounds(index, numberFromEvent(event), bound.max)}
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                    />
                  </label>
                  <label className="text-xs text-slate-300" title="Upper bound">
                    Max
                    <input
                      type="number"
                      value={bound.max}
                      onChange={(event) => actions.setBounds(index, bound.min, numberFromEvent(event))}
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                    />
                  </label>
                </div>
                <div className="mt-3 space-y-2">
                  <label className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-slate-500" title="Adjust lower bound quickly">
                    Min Slider
                    <input
                      type="range"
                      min={sliderMin}
                      max={sliderMax}
                      step={0.1}
                      value={bound.min}
                      onChange={(event) => actions.setBounds(index, Number(event.target.value), bound.max)}
                      className="flex-1"
                    />
                  </label>
                  <label className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-slate-500" title="Adjust upper bound quickly">
                    Max Slider
                    <input
                      type="range"
                      min={sliderMin}
                      max={sliderMax}
                      step={0.1}
                      value={bound.max}
                      onChange={(event) => actions.setBounds(index, bound.min, Number(event.target.value))}
                      className="flex-1"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-label="Seed control" className="space-y-2">
        <h3 className="font-semibold text-slate-100">Determinism</h3>
        <label className="block text-xs uppercase tracking-wide text-slate-400" title="Deterministic seed for reproducible runs">
          Seed
          <input
            type="number"
            value={config.seed}
            onChange={(event) => actions.setConfig({ seed: numberFromEvent(event) })}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          />
        </label>
        <button
          type="button"
          onClick={actions.reseed}
          className="w-full rounded border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-accent hover:text-accent"
        >
          Reseed
        </button>
      </section>
    </aside>
  );
};

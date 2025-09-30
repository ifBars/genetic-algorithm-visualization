import { useMemo } from 'react';

import { ControlsPanel } from '../components/controls/ControlsPanel';
import { ChartCard } from '../components/charts/ChartCard';
import { BestFitnessChart } from '../components/charts/BestFitnessChart';
import { FitnessHistogram } from '../components/charts/FitnessHistogram';
import { SearchSpaceScatter } from '../components/charts/SearchSpaceScatter';
import { DiversityChart } from '../components/charts/DiversityChart';
import { OneDFunctionChart } from '../components/charts/OneDFunctionChart';
import { PopulationInspector } from '../components/inspector/PopulationInspector';
import {
  selectConfig,
  selectGAState,
  selectPinnedIndividualId,
  useGAStore,
} from '../store/useGAStore';
import { useRunLoop } from '../hooks/useRunLoop';
import { toFixed } from '../utils/math';

export const VisualizerPage = () => {
  useRunLoop();
  const config = useGAStore(selectConfig);
  const gaState = useGAStore(selectGAState);
  const pinnedId = useGAStore(selectPinnedIndividualId);
  const pinIndividual = useGAStore((state) => state.pinIndividual);

  const latest = gaState.history.at(-1);
  const stats = useMemo(
    () => ({
      best: latest?.best ?? 0,
      avg: latest?.avg ?? 0,
      diversity: latest?.diversity ?? 0,
      running: gaState.running,
    }),
    [gaState.running, latest],
  );

  const pinnedIndividual = useMemo(
    () => gaState.population.find((individual) => individual.id === pinnedId) ?? null,
    [gaState.population, pinnedId],
  );

  return (
    <div className="flex flex-col gap-8 pb-16 text-slate-100 xl:flex-row xl:items-start xl:gap-10">
      <div className="xl:w-[22rem] xl:flex-shrink-0">
        <div className="xl:sticky xl:top-6">
          <ControlsPanel />
        </div>
      </div>

      <main className="flex flex-1 flex-col gap-8">
        <header className="rounded-3xl border border-white/10 bg-slate-900/70 p-7 shadow-lg shadow-slate-950/60">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold text-slate-100">Genetic Algorithm Visualizer</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Track live metrics as each generation evolves. Pin individuals to inspect their genes, compare presets, and export data snapshots without losing reproducibility.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4 sm:gap-6">
              <div className="flex flex-col gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4 shadow-inner shadow-emerald-900/30">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Best Fitness</span>
                <span className="text-[26px] font-semibold leading-tight text-emerald-100">{toFixed(stats.best, 3)}</span>
                <span className="text-[10px] text-emerald-200/70">Highest score so far</span>
              </div>
              <div className="flex flex-col gap-2 rounded-2xl border border-sky-500/40 bg-sky-500/10 px-5 py-4 shadow-inner shadow-sky-900/30">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Average Fitness</span>
                <span className="text-[26px] font-semibold leading-tight text-sky-100">{toFixed(stats.avg, 3)}</span>
                <span className="text-[10px] text-sky-200/70">Population mean this tick</span>
              </div>
              <div className="flex flex-col gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 shadow-inner shadow-amber-900/30">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Diversity</span>
                <span className="text-[26px] font-semibold leading-tight text-amber-100">{toFixed(stats.diversity, 3)}</span>
                <span className="text-[10px] text-amber-200/70">Variance across genes</span>
              </div>
              <div
                className={`flex flex-col gap-2 rounded-2xl border px-5 py-4 shadow-inner ${
                  stats.running
                    ? 'border-lime-500/40 bg-lime-500/10 shadow-lime-900/30'
                    : 'border-slate-700/60 bg-slate-900/60 shadow-slate-950/30'
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Status</span>
                <span className={`text-[26px] font-semibold leading-tight ${stats.running ? 'text-lime-200' : 'text-slate-200'}`}>
                  {stats.running ? 'Running' : 'Idle'}
                </span>
                <span className="text-[10px] text-slate-400/70">Loop updates every tick</span>
              </div>
            </div>
          </div>
        </header>

        <section className="grid auto-rows-[320px] grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartCard title="Fitness Over Generations" description="Best, average, and diversity by generation">
            <BestFitnessChart history={gaState.history} />
          </ChartCard>
          <ChartCard title="Fitness Distribution" description="Histogram of current population">
            <FitnessHistogram population={gaState.population} />
          </ChartCard>
          <ChartCard
            title={config.chromosomeLength === 1 ? 'Function Trace (1D)' : 'Search Space Scatter'}
            description={config.chromosomeLength === 1 ? 'Function curve with population markers' : 'Positions scaled by first two genes'}
          >
            {config.chromosomeLength === 1 ? (
              <OneDFunctionChart config={config} population={gaState.population} pinnedId={pinnedId} />
            ) : (
              <SearchSpaceScatter population={gaState.population} config={config} pinnedId={pinnedId} />
            )}
          </ChartCard>
          <ChartCard title="Diversity" description="Gene variance proxy over time">
            <DiversityChart history={gaState.history} />
          </ChartCard>
        </section>

        <div className="space-y-6">
          <PopulationInspector
            population={gaState.population}
            config={config}
            pinnedId={pinnedId}
            onPin={pinIndividual}
          />

          {pinnedIndividual ? (
            <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-200 shadow-lg shadow-slate-950/60" aria-live="polite">
              <h2 className="text-sm font-semibold text-slate-100">Pinned Individual</h2>
              <p className="mt-1 text-xs text-slate-400">ID {pinnedIndividual.id}</p>
              <div className="mt-4 flex flex-wrap gap-6 text-xs text-slate-200">
                <span>
                  Fitness: <span className="font-semibold text-emerald-200">{toFixed(pinnedIndividual.fitness, 4)}</span>
                </span>
                <span>
                  Genes: <span className="font-mono">[{pinnedIndividual.genes.map((gene) => toFixed(gene, 3)).join(', ')}]</span>
                </span>
                <span>
                  Parents: {pinnedIndividual.parents?.join(', ') ?? '—'}
                </span>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
};

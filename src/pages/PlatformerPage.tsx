import { useMemo, useState } from 'react';

import { PlatformerCanvas } from '../components/platformer/PlatformerCanvas';
import { defaultPlatformerConfig, exploreConfig, fastConfig } from '../platformer/config';
import { usePlatformerTrainer } from '../platformer/usePlatformerTrainer';
import type { PlatformerConfig } from '../platformer/types';
import { toFixed } from '../utils/math';

const formatPercent = (value: number) => `${toFixed(value * 100, 1)}%`;

const ConfigNumberInput = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  note,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  note?: string;
  onChange: (value: number) => void;
}) => (
  <label className="flex flex-col gap-1 text-xs text-slate-300">
    <span className="font-semibold text-slate-200">{label}</span>
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onChange(Number(event.target.value))}
      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100 focus:border-accent focus:outline-none focus:ring-0"
    />
    {note ? <span className="text-[10px] text-slate-500">{note}</span> : null}
  </label>
);

const presetOptions: Array<{ label: string; description: string; overrides: Partial<PlatformerConfig> }> = [
  { label: 'Default', description: 'Balanced exploration & exploitation', overrides: defaultPlatformerConfig },
  { label: 'Fast', description: 'Smaller population, shorter episode', overrides: fastConfig },
  { label: 'Explore', description: 'Larger population and longer episodes', overrides: exploreConfig },
];

export const PlatformerPage = () => {
  const [panelTab, setPanelTab] = useState<'config' | 'stats'>('config');
  const { level, config, state, reset, applyConfig, run, pause, step, running, loopDelay, setLoopDelay } =
    usePlatformerTrainer(defaultPlatformerConfig);

  const latestHistory = state.history.at(-1);
  const bestCurrent = useMemo(
    () => state.evaluated.reduce((best, individual) => (individual.fitness > (best?.fitness ?? -Infinity) ? individual : best), null as typeof state.bestEver),
    [state.evaluated],
  );
  const bestEver = state.bestEver && bestCurrent && bestCurrent.fitness > state.bestEver.fitness ? bestCurrent : state.bestEver;
  const activePath = bestCurrent?.path ?? bestEver?.path ?? [];

  const reachRate = latestHistory && state.generation > 0 ? latestHistory.reached / config.populationSize : 0;

  const handleConfigChange = (patch: Partial<PlatformerConfig>) => {
    pause();
    applyConfig(patch);
  };

  return (
    <div className="flex flex-col gap-6 pb-12 text-slate-100 lg:flex-row">
      <div className="lg:w-80 lg:flex-shrink-0 xl:w-96">
        <aside className="flex w-full flex-col gap-5 rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-sm text-slate-100 shadow-lg shadow-slate-950/60 lg:sticky lg:top-6">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-100">Trainer Controls</h2>
            <p className="text-xs leading-5 text-slate-400">Run the GA platformer experiment and tweak learning parameters.</p>
          </header>

          <div className="grid grid-cols-2 gap-3 text-[11px] uppercase tracking-wide text-slate-400">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-4">
              <span>Generation</span>
              <p className="mt-2 text-2xl font-semibold text-slate-100">{state.generation}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <span>Best Fitness</span>
              <p className="mt-2 text-2xl font-semibold text-emerald-100">
                {toFixed(bestCurrent?.fitness ?? latestHistory?.best ?? 0, 2)}
              </p>
            </div>
            <div className="rounded-2xl border border-sky-500/40 bg-sky-500/10 p-4">
              <span>Avg Fitness</span>
              <p className="mt-2 text-2xl font-semibold text-sky-100">{toFixed(latestHistory?.avg ?? 0, 2)}</p>
            </div>
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
              <span>Goal Reach</span>
              <p className="mt-2 text-2xl font-semibold text-amber-100">{formatPercent(reachRate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={run}
              disabled={running}
              className="rounded-2xl border border-emerald-500/50 bg-emerald-500/20 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
            >
              Run
            </button>
            <button
              type="button"
              onClick={pause}
              disabled={!running}
              className="rounded-2xl border border-amber-500/50 bg-amber-500/10 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={step}
              className="rounded-2xl border border-slate-600 bg-slate-800 py-2 text-sm font-semibold text-slate-200 transition hover:border-accent hover:text-accent"
            >
              Step
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-2xl border border-slate-600 bg-slate-800 py-2 text-sm font-semibold text-slate-200 transition hover:border-rose-500 hover:text-rose-300"
            >
              Reset
            </button>
          </div>

          <div className="space-y-2">
            <label className="flex flex-col gap-1 text-xs text-slate-300">
              <span className="font-semibold text-slate-200">Generation Interval ({loopDelay} ms)</span>
              <input
                type="range"
                min={15}
                max={50000}
                step={25}
                value={loopDelay}
                onChange={(event) => setLoopDelay(Number(event.target.value))}
                className="accent-accent"
              />
              <span className="text-[10px] text-slate-500">Lower values speed up evolution but cost more CPU.</span>
            </label>
          </div>

          <div>
            <div className="flex gap-2 rounded-xl border border-slate-700/60 bg-slate-950/70 p-1.5 text-xs">
              <button
                type="button"
                onClick={() => setPanelTab('config')}
                className={`flex-1 rounded-md px-2 py-1 font-medium transition ${
                  panelTab === 'config'
                    ? 'bg-accent text-slate-900 shadow'
                    : 'text-slate-300 hover:text-accent'
                }`}
              >
                Config
              </button>
              <button
                type="button"
                onClick={() => setPanelTab('stats')}
                className={`flex-1 rounded-md px-2 py-1 font-medium transition ${
                  panelTab === 'stats'
                    ? 'bg-accent text-slate-900 shadow'
                    : 'text-slate-300 hover:text-accent'
                }`}
              >
                History
              </button>
            </div>
          </div>

        {panelTab === 'config' ? (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Learning Parameters</h3>
            <div className="grid grid-cols-1 gap-3">
              <ConfigNumberInput
                label="Population Size"
                value={config.populationSize}
                min={10}
                max={10000}
                step={5}
                onChange={(value) => handleConfigChange({ populationSize: Math.max(10, Math.min(10000, Math.round(value))) })}
              />
              <ConfigNumberInput
                label="Episode Steps"
                value={config.steps}
                min={60}
                max={260}
                step={10}
                onChange={(value) => handleConfigChange({ steps: Math.max(40, Math.min(260, Math.round(value))) })}
              />
              <ConfigNumberInput
                label="Mutation Rate"
                value={config.mutationRate}
                min={0.01}
                max={0.6}
                step={0.01}
                onChange={(value) => handleConfigChange({ mutationRate: Math.min(0.6, Math.max(0.01, value)) })}
              />
              <ConfigNumberInput
                label="Mutation Std Dev"
                value={config.mutationStdDev}
                min={0.05}
                max={0.8}
                step={0.05}
                onChange={(value) => handleConfigChange({ mutationStdDev: Math.min(0.8, Math.max(0.05, value)) })}
              />
              <ConfigNumberInput
                label="Crossover Rate"
                value={config.crossoverRate}
                min={0.1}
                max={1}
                step={0.05}
                onChange={(value) => handleConfigChange({ crossoverRate: Math.min(1, Math.max(0.1, value)) })}
              />
              <ConfigNumberInput
                label="Max Speed"
                value={config.maxSpeed}
                min={2}
                max={50}
                step={0.5}
                onChange={(value) => handleConfigChange({ maxSpeed: Math.min(50, Math.max(2, value)) })}
              />
              <ConfigNumberInput
                label="Ground Accel"
                value={config.maxAccel}
                min={4}
                max={32}
                step={1}
                onChange={(value) => handleConfigChange({ maxAccel: Math.min(32, Math.max(4, value)) })}
              />
              <ConfigNumberInput
                label="Air Accel"
                value={config.airAccel}
                min={1}
                max={20}
                step={0.5}
                onChange={(value) => handleConfigChange({ airAccel: Math.min(20, Math.max(1, value)) })}
              />
              <ConfigNumberInput
                label="Friction"
                value={config.friction}
                min={0.6}
                max={0.99}
                step={0.01}
                onChange={(value) => handleConfigChange({ friction: Math.min(0.99, Math.max(0.6, value)) })}
                note="Velocity retained each step; lower values mean more drift."
              />
              <ConfigNumberInput
                label="Jump Velocity"
                value={config.jumpVelocity}
                min={4}
                max={16}
                step={0.1}
                onChange={(value) => handleConfigChange({ jumpVelocity: Math.min(16, Math.max(4, value)) })}
                note="Base vertical impulse when jumping with no stored momentum."
              />
              <ConfigNumberInput
                label="Momentum Build"
                value={config.momentumBuildRate}
                min={0}
                max={3}
                step={0.05}
                onChange={(value) => handleConfigChange({ momentumBuildRate: Math.min(3, Math.max(0, value)) })}
                note="Charge gained by reversing horizontal input while grounded."
              />
              <ConfigNumberInput
                label="Momentum Decay"
                value={config.momentumDecay}
                min={0}
                max={3}
                step={0.05}
                onChange={(value) => handleConfigChange({ momentumDecay: Math.min(3, Math.max(0, value)) })}
                note="Rate at which stored momentum bleeds off each second."
              />
              <ConfigNumberInput
                label="Momentum Boost"
                value={config.momentumJumpBoost}
                min={0}
                max={2}
                step={0.05}
                onChange={(value) => handleConfigChange({ momentumJumpBoost: Math.min(2, Math.max(0, value)) })}
                note="Multiplier converting stored momentum into extra jump power."
              />
              <ConfigNumberInput
                label="Momentum Cap"
                value={config.momentumMax}
                min={0.5}
                max={10}
                step={0.1}
                onChange={(value) => handleConfigChange({ momentumMax: Math.min(10, Math.max(0.5, value)) })}
                note="Upper bound on stored momentum charge."
              />
              <ConfigNumberInput
                label="Strafe Threshold"
                value={config.strafeThreshold}
                min={0}
                max={1}
                step={0.05}
                onChange={(value) => handleConfigChange({ strafeThreshold: Math.min(1, Math.max(0, value)) })}
                note="Minimum horizontal input magnitude to count as a strafe."
              />
              <ConfigNumberInput
                label="Direction Cost"
                value={config.directionCost}
                min={0}
                max={1}
                step={0.05}
                onChange={(value) => handleConfigChange({ directionCost: Math.min(1, Math.max(0, value)) })}
                note="Penalty for reversing momentum between frames"
              />
              <ConfigNumberInput
                label="Elite Count"
                value={config.eliteCount}
                min={0}
                max={10}
                step={1}
                onChange={(value) => handleConfigChange({ eliteCount: Math.max(0, Math.min(10, Math.round(value))) })}
                note="Top performers copied directly to next generation"
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Presets</h4>
              <div className="flex flex-wrap gap-2">
                {presetOptions.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="rounded-full border border-slate-600 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-accent hover:text-accent"
                    onClick={() => handleConfigChange(preset.overrides)}
                    title={preset.description}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-300">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent Generations</h3>
            <ul className="space-y-2">
              {state.history
                .slice(-8)
                .reverse()
                .map((entry) => (
                  <li key={entry.gen} className="flex items-center justify-between rounded-2xl border border-slate-700/60 bg-slate-950/70 px-3 py-2">
                    <span className="text-slate-400">Gen {entry.gen}</span>
                    <span className="font-semibold text-emerald-300">{toFixed(entry.best, 2)}</span>
                    <span className="text-slate-400">Avg {toFixed(entry.avg, 2)}</span>
                    <span className="text-amber-300">{formatPercent(entry.reached / config.populationSize)}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </aside>
      </div>

      <main className="flex flex-1 flex-col gap-6">
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/60">
          <header className="flex flex-wrap items-center justify-between gap-5">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-slate-100">Platformer Evolution Playground</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Observe a genetic algorithm teaching agents to clear pits, scale ledges, and tag the goal flag.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 text-[11px] uppercase tracking-wide text-slate-400 sm:grid-cols-3">
              <div className="flex flex-col rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
                <span>Best Ever</span>
                <span className="mt-2 text-2xl font-semibold text-emerald-100">{toFixed(bestEver?.fitness ?? 0, 2)}</span>
              </div>
              <div className="flex flex-col rounded-2xl border border-sky-500/40 bg-sky-500/10 px-4 py-3">
                <span>Reached Goal</span>
                <span className="mt-2 text-2xl font-semibold text-sky-100">{latestHistory?.reached ?? 0}</span>
              </div>
              <div
                className={`flex flex-col rounded-2xl border px-4 py-3 ${
                  running ? 'border-lime-500/40 bg-lime-500/10 text-lime-200' : 'border-slate-700/60 bg-slate-900/60 text-slate-300'
                }`}
              >
                <span>Status</span>
                <span className="mt-2 text-2xl font-semibold">{running ? 'Running' : 'Idle'}</span>
              </div>
            </div>
          </header>

          <div className="mt-6 h-[380px] rounded-2xl border border-white/10 bg-slate-950/80 p-4">
            <PlatformerCanvas
              level={level}
              config={config}
              path={activePath}
              running={running}
              generation={state.generation}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-sm text-slate-200 shadow-lg shadow-slate-950/60">
            <h2 className="text-sm font-semibold text-slate-100">Current Champion</h2>
            {bestCurrent ? (
              <div className="mt-3 space-y-2 text-xs text-slate-300">
                <p>
                  <span className="text-slate-400">Fitness:</span>{' '}
                  <span className="font-semibold text-emerald-300">{toFixed(bestCurrent.fitness, 3)}</span>
                </p>
                <p>
                  <span className="text-slate-400">Steps Taken:</span> {bestCurrent.stepsTaken} / {config.steps}
                </p>
                <p>
                  <span className="text-slate-400">Reached Goal:</span>{' '}
                  {bestCurrent.reachedGoal ? (
                    <span className="font-semibold text-emerald-300">Yes</span>
                  ) : (
                    <span className="font-semibold text-rose-300">Not Yet</span>
                  )}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-400">Run the trainer to evaluate the initial population.</p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-sm text-slate-200 shadow-lg shadow-slate-950/60">
            <h2 className="text-sm font-semibold text-slate-100">Best Ever Genome Snapshot</h2>
            {bestEver ? (
              <div className="mt-3 space-y-2 text-xs text-slate-300">
                <p>
                  <span className="text-slate-400">Fitness:</span>{' '}
                  <span className="font-semibold text-emerald-300">{toFixed(bestEver.fitness, 3)}</span>
                </p>
                <p className="text-slate-400">First 10 gene pairs (move / jump):</p>
                <p className="font-mono text-[11px] leading-relaxed text-slate-300">
                  {bestEver.genes
                    .slice(0, 20)
                    .map((gene, index) => `${index % 2 === 0 ? 'H' : 'J'}:${toFixed(gene, 2)}`)
                    .join(' ')}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-400">No champion yet. Run a few generations to find one.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

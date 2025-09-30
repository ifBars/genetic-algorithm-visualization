import type { Individual, GAConfig } from '../../ga/types';
import { toFixed } from '../../utils/math';
import { GeneSparkline } from './GeneSparkline';

interface PopulationInspectorProps {
  population: Individual[];
  config: GAConfig;
  pinnedId: string | null;
  onPin: (id: string | null) => void;
  topCount?: number;
}

export const PopulationInspector = ({
  population,
  config,
  pinnedId,
  onPin,
  topCount = 10,
}: PopulationInspectorProps) => {
  const sorted = [...population].sort((a, b) => b.fitness - a.fitness).slice(0, topCount);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/60">
      <header className="flex items-center justify-between pb-3">
        <h3 className="text-sm font-semibold text-slate-100">Population Inspector</h3>
        <span className="text-xs text-slate-400">Top {sorted.length} individuals</span>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/5 text-xs">
          <thead className="text-slate-400">
            <tr className="text-left uppercase tracking-wide">
              <th className="px-2 py-2">Rank</th>
              <th className="px-2 py-2">Fitness</th>
              <th className="px-2 py-2">Genes</th>
              <th className="px-2 py-2">Parents</th>
              <th className="px-2 py-2">Sparkline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-100">
            {sorted.map((individual, index) => {
              const isPinned = individual.id === pinnedId;
              return (
                <tr
                  key={individual.id}
                  onClick={() => onPin(isPinned ? null : individual.id)}
                  className={`cursor-pointer transition hover:bg-slate-800/60 ${
                    isPinned ? 'bg-rose-500/20' : ''
                  }`}
                  aria-selected={isPinned}
                >
                  <td className="whitespace-nowrap px-2 py-2">#{index + 1}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-semibold text-emerald-300">
                    {toFixed(individual.fitness, 3)}
                  </td>
                  <td className="px-2 py-2 font-mono text-[11px] text-slate-300">
                    [{individual.genes.map((gene) => toFixed(gene, 2)).join(', ')}]
                  </td>
                  <td className="px-2 py-2 text-slate-400">
                    {individual.parents?.join(', ') ?? '—'}
                  </td>
                  <td className="px-2 py-1">
                    <GeneSparkline genes={individual.genes} stroke={isPinned ? '#f43f5e' : '#38bdf8'} />
                  </td>
                </tr>
              );
            })}
            {!sorted.length && (
              <tr>
                <td colSpan={5} className="px-2 py-6 text-center text-slate-500">
                  Population not initialised.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <footer className="pt-4 text-[11px] text-slate-400">
        Click a row to pin an individual across charts. Bounds: {config.bounds
          .map((bound, index) => `g${index + 1}: [${toFixed(bound.min, 2)}, ${toFixed(bound.max, 2)}]`)
          .join(' | ')}
      </footer>
    </section>
  );
};

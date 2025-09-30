import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

import type { GAConfig, Individual } from '../../ga/types';

interface SearchSpaceScatterProps {
  population: Individual[];
  config: GAConfig;
  pinnedId: string | null;
}

export const SearchSpaceScatter = ({ population, config, pinnedId }: SearchSpaceScatterProps) => {
  if (config.chromosomeLength < 2) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Add a second gene to view the 2D scatter plot.
      </div>
    );
  }

  const data = population.map((individual) => ({
    id: individual.id,
    x: individual.genes[0],
    y: individual.genes[1],
    fitness: individual.fitness,
    pinned: pinnedId === individual.id,
  }));
  const best = [...population].sort((a, b) => b.fitness - a.fitness)[0];
  const bestPoint = best
    ? [{ id: best.id, x: best.genes[0], y: best.genes[1], fitness: best.fitness }]
    : [];
  const boundsX = config.bounds[0];
  const boundsY = config.bounds[1] ?? config.bounds[0];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis type="number" dataKey="x" stroke="rgb(148,163,184)" name="Gene 1" domain={[boundsX.min, boundsX.max]} />
        <YAxis type="number" dataKey="y" stroke="rgb(148,163,184)" name="Gene 2" domain={[boundsY.min, boundsY.max]} />
        <ZAxis type="number" dataKey="fitness" range={[40, 160]} name="Fitness" />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Legend />
        <Scatter
          name="Population"
          data={data.filter((point) => !point.pinned && point.id !== best?.id)}
          fill="rgba(56,189,248,0.7)"
        />
        {bestPoint.length ? <Scatter name="Best" data={bestPoint} fill="#f59e0b" /> : null}
        {pinnedId ? (
          <Scatter
            name="Pinned"
            data={data.filter((point) => point.pinned)}
            fill="#f43f5e"
          />
        ) : null}
      </ScatterChart>
    </ResponsiveContainer>
  );
};

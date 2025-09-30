import { useMemo } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { buildFitness } from '../../ga/fitness';
import type { GAConfig, Individual } from '../../ga/types';

interface OneDFunctionChartProps {
  config: GAConfig;
  population: Individual[];
  pinnedId: string | null;
}

export const OneDFunctionChart = ({ config, population, pinnedId }: OneDFunctionChartProps) => {
  const { fn } = useMemo(() => buildFitness(config), [config]);
  const bound = config.bounds[0];
  const min = bound?.min ?? -10;
  const max = bound?.max ?? 10;
  const samples = useMemo(() => {
    const steps = 160;
    const delta = (max - min) / steps;
    return Array.from({ length: steps + 1 }, (_, index) => {
      const x = min + index * delta;
      return { x, value: fn([x]) };
    });
  }, [fn, max, min]);

  const scatterData = population.map((individual) => ({
    id: individual.id,
    x: individual.genes[0],
    value: individual.fitness,
    pinned: pinnedId === individual.id,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={samples} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis dataKey="x" stroke="rgb(148,163,184)" fontSize={12} />
        <YAxis stroke="rgb(148,163,184)" fontSize={12} />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={false} name="Fitness" />
        <Scatter
          name="Population"
          data={scatterData.filter((point) => !point.pinned)}
          fill="#a855f7"
          line={false}
          shape="circle"
        />
        {pinnedId ? (
          <Scatter name="Pinned" data={scatterData.filter((point) => point.pinned)} fill="#f43f5e" />
        ) : null}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { Individual } from '../../ga/types';

interface FitnessHistogramProps {
  population: Individual[];
}

const buildHistogram = (population: Individual[], binCount = 12) => {
  if (!population.length) return [];
  const fitnessValues = population.map((individual) => individual.fitness);
  const min = Math.min(...fitnessValues);
  const max = Math.max(...fitnessValues);
  const range = Math.max(1e-6, max - min);
  const step = range / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => ({
    label: `${(min + index * step).toFixed(2)}`,
    count: 0,
  }));
  population.forEach((individual) => {
    const bucket = Math.min(binCount - 1, Math.floor((individual.fitness - min) / step));
    bins[bucket].count += 1;
  });
  return bins;
};

export const FitnessHistogram = ({ population }: FitnessHistogramProps) => {
  const data = buildHistogram(population);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis dataKey="label" stroke="rgb(148,163,184)" fontSize={11} interval={1} angle={-25} dy={10} height={50} />
        <YAxis stroke="rgb(148,163,184)" fontSize={12} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'rgba(56,189,248,0.12)' }}
          contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Bar dataKey="count" fill="rgba(56,189,248,0.7)" />
      </BarChart>
    </ResponsiveContainer>
  );
};

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { GAState } from '../../ga/types';

interface BestFitnessChartProps {
  history: GAState['history'];
}

export const BestFitnessChart = ({ history }: BestFitnessChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={history} margin={{ top: 10, right: 16, bottom: 6, left: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
      <XAxis dataKey="gen" stroke="rgb(148,163,184)" fontSize={12} />
      <YAxis stroke="rgb(148,163,184)" fontSize={12} />
      <Tooltip
        contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8 }}
        labelStyle={{ color: '#e2e8f0' }}
      />
      <Legend wrapperStyle={{ paddingTop: 8 }} />
      <Line type="monotone" dataKey="best" stroke="#38bdf8" dot={false} name="Best" strokeWidth={2} />
      <Line type="monotone" dataKey="avg" stroke="#a855f7" dot={false} name="Average" strokeWidth={1.5} />
      <Line type="monotone" dataKey="diversity" stroke="#f97316" dot={false} name="Diversity" strokeDasharray="4 2" />
    </LineChart>
  </ResponsiveContainer>
);

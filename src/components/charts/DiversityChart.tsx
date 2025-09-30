import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { GAState } from '../../ga/types';

interface DiversityChartProps {
  history: GAState['history'];
}

export const DiversityChart = ({ history }: DiversityChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={history} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
      <defs>
        <linearGradient id="diversityGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#f97316" stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
      <XAxis dataKey="gen" stroke="rgb(148,163,184)" fontSize={12} />
      <YAxis stroke="rgb(148,163,184)" fontSize={12} />
      <Tooltip
        contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8 }}
        labelStyle={{ color: '#e2e8f0' }}
      />
      <Area type="monotone" dataKey="diversity" stroke="#f97316" fill="url(#diversityGradient)" strokeWidth={2} />
    </AreaChart>
  </ResponsiveContainer>
);

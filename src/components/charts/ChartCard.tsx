import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const ChartCard = ({ title, description, children }: ChartCardProps) => (
  <section className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
    <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      {description ? <span className="text-xs text-slate-400">{description}</span> : null}
    </header>
    <div className="flex-1">
      {children}
    </div>
  </section>
);

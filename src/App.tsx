import { useState } from 'react';

import { VisualizerPage } from './pages/VisualizerPage';
import { PlatformerPage } from './pages/PlatformerPage';
import { LearningPage } from './pages/LearningPage';

const tabs = [
  { id: 'visualizer', label: 'Charts & Metrics', component: VisualizerPage },
  { id: 'platformer', label: 'Platformer Trainer', component: PlatformerPage },
  { id: 'learning', label: 'Learn the GA', component: LearningPage },
] as const;

const App = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]['id']>('visualizer');
  const ActivePage = tabs.find((tab) => tab.id === activeTab)?.component ?? VisualizerPage;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,_#0f172a,_#020617_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 mix-blend-soft-light [background-image:radial-gradient(circle_at_1px_1px,_rgba(56,189,248,0.18),_transparent_0)] [background-size:36px_36px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-accent/20 via-slate-950/40 to-transparent" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-white/5 bg-slate-950/60 px-4 py-6 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 text-slate-200 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 self-start rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                Live playground
              </span>
              <div>
                <h1 className="text-2xl font-semibold text-slate-100 sm:text-3xl">Genetic Algorithm Playground</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Experiment with analytic fitness functions, inspect evolving populations, and watch agents learn to clear the platformer course in real time.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <nav className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring ${
                      activeTab === tab.id
                        ? 'bg-accent text-slate-900 shadow-lg shadow-accent/30'
                        : 'border border-slate-700/70 bg-slate-900/70 text-slate-300 hover:border-accent/60 hover:text-accent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              <button
                type="button"
                onClick={() => setActiveTab('learning')}
                className="inline-flex items-center gap-2 self-start rounded-full border border-slate-700/70 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-accent/60 hover:text-accent lg:self-end"
              >
                Need a primer? Read the guide
                <span aria-hidden className="text-base">→</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-10 lg:px-6">
          <ActivePage />
        </main>

        <footer className="border-t border-white/5 bg-slate-950/70 px-4 py-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-200">Tune · Observe · Iterate</p>
              <p className="mt-1 max-w-md leading-5">
                Use the tabs to toggle between data-rich dashboards, the platformer trainer, and a guided walkthrough of the genetic algorithm workflow.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring ${
                    activeTab === tab.id
                      ? 'bg-accent text-slate-900'
                      : 'border border-slate-700/70 bg-slate-900/60 text-slate-300 hover:border-accent/60 hover:text-accent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;

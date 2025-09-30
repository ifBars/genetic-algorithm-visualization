import { Fragment, useMemo, useState } from 'react';
import { createMulberry32 } from '../ga/prng';
import { rouletteSelect, tournamentSelect } from '../ga/selection';
import { crossover } from '../ga/crossover';
import { mutateChromosome } from '../ga/mutation';
import type { Chromosome, GAConfig, Individual } from '../ga/types';

const cycleSteps = [
  {
    title: 'Seed the Population',
    body:
      'Generate chromosomes using deterministic PRNG seeds so runs stay reproducible. Config tweaks alter chromosome length, value bounds, and seeding strategy.',
  },
  {
    title: 'Evaluate Fitness',
    body:
      'Run the fitness function to score each individual. In the charts tab this happens against analytic functions; in the platformer it simulates a full level playthrough.',
  },
  {
    title: 'Select Parents',
    body:
      'The store exposes tournament and roulette selection strategies. Higher-fitness individuals gain more weight without removing lower performers entirely.',
  },
  {
    title: 'Recombine & Mutate',
    body:
      'Crossover mixes parent genes to form offspring; mutation nudges genes using configurable rates and deviation. Diversity charts reveal whether exploration is collapsing.',
  },
  {
    title: 'Survivor Selection',
    body:
      'Elitism pins top performers straight into the next population while offspring fill remaining slots. History logs track the best, average, and diversity per generation.',
  },
  {
    title: 'Repeat & Observe',
    body:
      'Run multiple generations, watching metrics to decide when to pause, step manually, or export data for deeper analysis.',
  },
];

const parameterGroups: Array<{
  group: string;
  hint: string;
  items: Array<{ label: string; insight: string }>;
}> = [
  {
    group: 'Population Structure',
    hint: 'Controls how many solutions compete and how long each experience lasts.',
    items: [
      { label: 'Population Size', insight: 'Large pools improve exploration but slow evaluation; smaller pools converge faster but risk premature convergence.' },
      { label: 'Chromosome Length', insight: 'Longer genomes represent richer behaviours or functions; match to the decision space you want to search.' },
      { label: 'Episode Steps', insight: 'Platformer only: longer evaluations let agents recover from mistakes but cost CPU time.' },
    ],
  },
  {
    group: 'Genetic Operators',
    hint: 'Balance exploitation of strong genes with exploration of new candidates.',
    items: [
      { label: 'Crossover Rate', insight: 'High crossover encourages mixing of solutions; lower values keep more parent genomes intact.' },
      { label: 'Mutation Rate & Std Dev', insight: 'Use low rates for fine-tuning and higher values when diversity collapses. Std dev controls how bold each mutation is.' },
      { label: 'Elite Count', insight: 'Guarantees the very best survive. Too much elitism reduces variety; too little may lose winning behaviours.' },
    ],
  },
  {
    group: 'Scoring & Selection',
    hint: 'Shape the fitness landscape and how winners pass on their genes.',
    items: [
      { label: 'Fitness Function', insight: 'Visualizer: adjust targets via presets. Platformer: distance to flag, time efficiency, and penalties underpin the score.' },
      { label: 'Selection Method', insight: 'Tournament picks the best out of random subsets; roulette weights probability by fitness. Try both to compare convergence patterns.' },
      { label: 'Diversity Metric', insight: 'Variance-based proxy helps see genetic drift; falling near zero suggests you need to shake up operators or parameters.' },
    ],
  },
];

const visualizerCallouts = [
  {
    title: 'Fitness Over Generations',
    detail:
      'Track best, average, and diversity together. Diverging best vs. average hints at strong elites; converging lines show the population stabilising.',
  },
  {
    title: 'Fitness Distribution',
    detail:
      'Histogram reveals whether the population is bimodal, skewed, or flat. Use it to spot stagnation when all bars bunch near the average.',
  },
  {
    title: 'Search Space',
    detail:
      'Scatter and 1D plots place individuals in the decision space. When dots cluster tightly you may lower mutation or tweak selection to explore further.',
  },
  {
    title: 'Population Inspector',
    detail:
      'Pin individuals to study genes, parents, and fitness lineage. Pair this with the chart history to understand how breakthroughs emerged.',
  },
];

const platformerCallouts = [
  {
    title: 'Trainer Controls',
    detail:
      'Run continuously to watch emergent strategies, or step generation-by-generation when testing parameter tweaks.',
  },
  {
    title: 'Best Ever vs. Current Champion',
    detail:
      'Best Ever highlights long-term retention; Current Champion exposes whether the latest population is outperforming history.',
  },
  {
    title: 'Reach Rate & Goal Count',
    detail:
      'Monitoring how many agents touch the flag captures real task success beyond raw fitness improvements.',
  },
  {
    title: 'Genome Snapshot',
    detail:
      'Inspect gene pairs (horizontal / jump) to connect numeric values with observed movement patterns.',
  },
];

const glossary = [
  { term: 'Chromosome', description: 'An ordered list of genes representing a solution candidate. Genes stay numeric for charts and platformer inputs.' },
  { term: 'Fitness Landscape', description: 'The mapping from chromosome space to fitness scores. Understanding its shape helps pick operators and parameters.' },
  { term: 'Elitism', description: 'A survivor selection strategy that copies top individuals directly to the next generation.' },
  { term: 'Mutation Drift', description: 'Accumulated random change that keeps the population exploring new areas of the search space.' },
  { term: 'Deterministic Seed', description: 'Fixed random seeds that allow rerunning experiments with identical stochastic events for debugging and demos.' },
];

const MobileTOC = ({ items }: { items: Array<{ id: string; label: string }> }) => (
  <nav className="sticky top-16 z-10 flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm shadow-lg shadow-slate-950/40 backdrop-blur lg:hidden">
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Jump to section</div>
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="rounded-full border border-slate-700/60 bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-accent hover:text-accent"
        >
          {item.label}
        </a>
      ))}
    </div>
  </nav>
);



export const LearningPage = () => {
  const toc = [
    { id: 'intro', label: 'Overview' },
    { id: 'lifecycle', label: 'GA Life-Cycle' },
    { id: 'tuning', label: 'Tuning Parameters' },
    { id: 'playgrounds', label: 'Interactive Playgrounds' },
    { id: 'charts', label: 'Charts & Metrics' },
    { id: 'platformer', label: 'Platformer Trainer' },
    { id: 'glossary', label: 'Glossary' },
  ];

  return (
    <div className="w-full text-slate-100">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="hidden lg:block lg:w-72">
          <nav className="sticky top-24 rounded-3xl border border-white/10 bg-slate-900/60 p-5 text-sm shadow-lg shadow-slate-950/50">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">On this page</div>
            <ul className="space-y-1">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="block rounded px-2 py-1 text-slate-300 transition hover:text-accent">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 space-y-8 pb-12">
          <MobileTOC items={toc} />

          <section id="intro" className="scroll-mt-28 rounded-3xl border border-white/10 bg-slate-900/70 p-6 lg:p-8 shadow-lg shadow-slate-950/60">
            <h1 className="text-2xl font-semibold text-slate-100 sm:text-3xl">Learn the Genetic Algorithm Toolkit</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              This guide connects the analytics dashboard and the platformer trainer so you can experiment confidently.
              Work through the GA life-cycle, then jump into each page with targeted goals.
            </p>
            <div className="mt-4 grid gap-3 text-xs text-slate-300 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/80 p-3">
                <h2 className="text-sm font-semibold text-slate-100">Start with the fundamentals</h2>
                <p className="mt-1 leading-5 text-slate-400">Follow the life-cycle to understand how selection, crossover, and mutation interact over generations.</p>
              </div>
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/80 p-3">
                <h2 className="text-sm font-semibold text-slate-100">Experiment with intent</h2>
                <p className="mt-1 leading-5 text-slate-400">Use the playbooks and charts to validate hunches, compare presets, and export data for deeper dives.</p>
              </div>
            </div>
          </section>

          <section id="lifecycle" className="scroll-mt-28 rounded-3xl border border-white/10 bg-slate-900/70 p-6 lg:p-8 shadow-lg shadow-slate-950/50">
            <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Genetic Algorithm Life-Cycle</h2>
                <p className="text-sm text-slate-400">Follow these beats each generation while watching live metrics update.</p>
              </div>
            </header>
            <ol className="grid gap-3 text-sm text-slate-200 md:grid-cols-2 xl:grid-cols-3">
              {cycleSteps.map((step, index) => (
                <li key={step.title} className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-semibold text-accent">{index + 1}</span>
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">{step.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">{step.body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="tuning" className="scroll-mt-28 rounded-3xl border border-white/10 bg-slate-900/70 p-6 lg:p-8 shadow-lg shadow-slate-950/50">
            <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Tuning Parameters</h2>
                <p className="text-sm text-slate-400">Adjust values in the panels with purpose—every knob shapes exploration vs. exploitation.</p>
              </div>
            </header>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {parameterGroups.map((group) => (
                <article key={group.group} className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-5 text-xs text-slate-300">
                  <h3 className="text-sm font-semibold text-slate-100">{group.group}</h3>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{group.hint}</p>
                  <ul className="mt-3 space-y-2 leading-5">
                    {group.items.map((item) => (
                      <li key={item.label}>
                        <span className="font-semibold text-slate-200">{item.label}:</span>{' '}
                        <span>{item.insight}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section id="playgrounds" className="scroll-mt-28 rounded-3xl border border-white/10 bg-slate-900/70 p-6 lg:p-8 shadow-lg shadow-slate-950/50">
            <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Interactive Playgrounds</h2>
                <p className="text-sm text-slate-400">Prototype with deterministic seeds to see how each operator behaves before running full evolutions.</p>
              </div>
            </header>
            <InteractivePlaygrounds />
          </section>

          <section id="charts" className="scroll-mt-28 rounded-3xl border border-white/10 bg-slate-900/70 p-6 lg:p-8 shadow-lg shadow-slate-950/50">
            <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Reading the Charts &amp; Metrics</h2>
                <p className="text-sm text-slate-400">Translate each widget into actionable questions about your experiment.</p>
              </div>
            </header>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visualizerCallouts.map((callout) => (
                <article key={callout.title} className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-5 text-xs text-slate-300">
                  <h3 className="text-sm font-semibold text-slate-100">{callout.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{callout.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="platformer" className="scroll-mt-28 rounded-3xl border border-white/10 bg-slate-900/70 p-6 lg:p-8 shadow-lg shadow-slate-950/50">
            <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Mastering the Platformer Trainer</h2>
                <p className="text-sm text-slate-400">Connect numeric metrics to on-screen behaviour to validate hypotheses.</p>
              </div>
            </header>
            <div className="grid gap-5 md:grid-cols-2">
              {platformerCallouts.map((callout) => (
                <article key={callout.title} className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-5 text-xs text-slate-300">
                  <h3 className="text-sm font-semibold text-slate-100">{callout.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{callout.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="glossary" className="scroll-mt-28 rounded-3xl border border-white/10 bg-slate-900/70 p-6 lg:p-8 shadow-lg shadow-slate-950/50">
            <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Glossary &amp; Next Steps</h2>
                <p className="text-sm text-slate-400">Keep these definitions handy while exploring presets or crafting new experiments.</p>
              </div>
            </header>
            <dl className="grid gap-3 text-xs text-slate-300 sm:grid-cols-2 xl:grid-cols-3">
              {glossary.map((entry) => (
                <Fragment key={entry.term}>
                  <dt className="font-semibold text-slate-200">{entry.term}</dt>
                  <dd className="text-[11px] leading-5 text-slate-400">{entry.description}</dd>
                </Fragment>
              ))}
            </dl>
          </section>
          </main>
        </div>
    </div>
  );
};

export default LearningPage;

// ---------- Interactive Playgrounds ----------

const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 lg:p-8 shadow-lg shadow-slate-950/50">
    <header className="mb-4 flex flex-col gap-2">
      <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
      {description ? <p className="text-sm text-slate-400">{description}</p> : null}
    </header>
    {children}
  </section>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs font-semibold text-slate-200">{children}</span>
);

const Slider = ({
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) => (
  <div className="flex w-full items-center gap-3">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="accent-accent flex-1"
    />
    <span className="w-16 text-right text-xs text-slate-300">{value}{suffix ?? ''}</span>
  </div>
);

const ToggleGroup = ({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt.id}
        type="button"
        onClick={() => onChange(opt.id)}
        className={`rounded-md px-3 py-1 text-xs font-medium transition ${
          value === opt.id
            ? 'bg-accent text-slate-900 shadow'
            : 'border border-slate-600 bg-slate-800 text-slate-300 hover:border-accent hover:text-accent'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const Bar = ({ color, width, label }: { color: string; width: number; label: string }) => (
  <div className="mb-2">
    <div className="flex justify-between text-[11px] text-slate-400"><span>{label}</span><span>{(width * 100).toFixed(1)}%</span></div>
    <div className="h-2 rounded bg-slate-800">
      <div className="h-2 rounded" style={{ width: `${Math.max(2, width * 100)}%`, backgroundColor: color }} />
    </div>
  </div>
);

const seedInput = (
  seed: number,
  setSeed: (v: number) => void,
) => (
  <label className="flex flex-col gap-2 text-xs text-slate-300">
    <Label>Seed</Label>
    <input
      type="number"
      value={seed}
      onChange={(e) => setSeed(Number(e.target.value))}
      className="w-full min-w-0 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100 focus:border-accent focus:outline-none"
    />
  </label>
);

const InteractivePlaygrounds = () => {
  return (
    <div className="flex flex-col gap-6">
      <SelectionPlayground />
      <CrossoverPlayground />
      <div className="grid gap-6 lg:grid-cols-2">
        <MutationPlayground />
        <TipsAccordion />
      </div>
    </div>
  );
};

// --- Selection Playground ---
const SelectionPlayground = () => {
  const [count, setCount] = useState(3);
  const [seed, setSeed] = useState(42);
  const [method, setMethod] = useState<'roulette' | 'tournament'>('roulette');
  const [tournamentSize, setTournamentSize] = useState(3);
  const [samples, setSamples] = useState(1000);

  const [fitness, setFitness] = useState<number[]>(() => Array.from({ length: 3 }, (_, i) => (i + 1) * 2));

  // keep fitness array sized to count
  const popFitness = useMemo(() => {
    const arr = fitness.slice(0, count);
    while (arr.length < count) arr.push((arr.length + 1) * 2);
    return arr;
  }, [fitness, count]);

  const population: Individual[] = useMemo(
    () =>
      popFitness.map((f, i) => ({ id: `id-${i}`, fitness: f, genes: [f] })),
    [popFitness],
  );

  const rouletteProb = useMemo(() => {
    const min = Math.min(...population.map((p) => p.fitness));
    const offset = min < 0 ? Math.abs(min) + 1e-6 : 0;
    const total = population.reduce((s, p) => s + p.fitness + offset, 0);
    return total > 0 ? population.map((p) => (p.fitness + offset) / total) : population.map(() => 1 / population.length);
  }, [population]);

  const frequencies = useMemo(() => {
    const rng = createMulberry32(seed);
    const freq = new Array(population.length).fill(0);
    for (let i = 0; i < samples; i += 1) {
      const picked = method === 'roulette' ? rouletteSelect(population, rng) : tournamentSelect(population, rng, tournamentSize);
      const idx = population.findIndex((p) => p.id === picked.id);
      if (idx >= 0) freq[idx] += 1;
    }
    return freq.map((c) => c / samples);
  }, [population, method, tournamentSize, samples, seed]);

  return (
    <Section title="Selection Playground" description="Adjust fitness and see how often each individual gets picked.">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full rounded-xl border border-slate-700/60 bg-slate-900/70 p-5 lg:max-w-sm">
          <div className="space-y-4 text-sm">
            <label className="flex flex-col gap-2">
              <Label>Individuals</Label>
              <Slider value={count} min={3} max={16} step={1} onChange={setCount} />
            </label>
            <label className="flex flex-col gap-2">
              <Label>Samples</Label>
              <Slider value={samples} min={100} max={5000} step={100} onChange={setSamples} />
            </label>
            <div className="flex flex-col gap-2">
              <Label>Method</Label>
              <ToggleGroup
                value={method}
                onChange={(v) => setMethod(v as 'roulette' | 'tournament')}
                options={[
                  { id: 'roulette', label: 'Roulette' },
                  { id: 'tournament', label: 'Tournament' },
                ]}
              />
            </div>
            {method === 'tournament' ? (
              <label className="flex flex-col gap-2">
                <Label>k</Label>
                <Slider value={tournamentSize} min={2} max={Math.max(2, count)} step={1} onChange={setTournamentSize} />
              </label>
            ) : null}
            {seedInput(seed, setSeed)}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-5">
            <h3 className="text-sm font-semibold text-slate-100">Fitness & Roulette Probabilities</h3>
            <div className="mt-3 space-y-3">
              {population.map((p, i) => (
                <div key={p.id} className="rounded-md border border-slate-700/60 bg-slate-900/80 p-4">
                  <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Individual {i + 1}</span>
                    <span>Fitness {p.fitness.toFixed(2)}</span>
                  </div>
                  <Bar color="#60a5fa" width={rouletteProb[i]} label="Expected prob" />
                  <label className="mt-3 block text-[11px] text-slate-400">
                    Adjust
                    <input
                      type="range"
                      min={-10}
                      max={20}
                      step={0.5}
                      value={p.fitness}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setFitness((cur) => {
                          const copy = cur.slice();
                          copy[i] = v;
                          return copy;
                        });
                      }}
                      className="accent-accent mt-1 w-full"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-5">
            <h3 className="text-sm font-semibold text-slate-100">Observed Picks (Monte Carlo)</h3>
            <div className="mt-3">
              {population.map((p, i) => (
                <Bar key={p.id} color="#34d399" width={frequencies[i]} label={`Individual ${i + 1}`} />
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">Compare blue (expected) vs. green (observed). Tournament ignores negative fitness but still favors stronger individuals.</p>
          </div>
        </div>
      </div>
    </Section>
  );
};

// --- Crossover Playground ---
const CrossoverPlayground = () => {
  const [length, setLength] = useState(10);
  const [seed, setSeed] = useState(7);
  const [method, setMethod] = useState<'single' | 'uniform'>('single');

  const rng = useMemo(() => createMulberry32(seed), [seed]);
  const parentA = useMemo<Chromosome>(() => Array.from({ length }, () => Number((rng.nextInRange(-1, 1)).toFixed(2))), [length, seed]);
  const parentB = useMemo<Chromosome>(() => Array.from({ length }, () => Number((rng.nextInRange(-1, 1)).toFixed(2))), [length, seed]);

  const child = useMemo(() => {
    const local = createMulberry32(seed + 1);
    return crossover(parentA, parentB, method, local);
  }, [parentA, parentB, method, seed]);

  const GeneRow = ({ title, genes, highlight }: { title: string; genes: number[]; highlight?: 'A' | 'B' | 'C' }) => (
    <div className="mb-2">
      <div className="mb-1 text-[11px] text-slate-400">{title}</div>
      <div className="flex flex-wrap gap-1">
        {genes.map((g, i) => {
          const fromA = Math.abs(child[i] - parentA[i]) < 1e-9;
          const fromB = Math.abs(child[i] - parentB[i]) < 1e-9;
          const bg = highlight === 'C' ? (fromA ? 'bg-sky-500/30 border-sky-500/50' : fromB ? 'bg-amber-500/30 border-amber-500/50' : 'bg-slate-800/50 border-slate-700/60') : 'bg-slate-800/50 border-slate-700/60';
          return (
            <span key={i} className={`rounded border px-2 py-1 font-mono text-[11px] text-slate-200 ${bg}`}>{g.toFixed(2)}</span>
          );
        })}
      </div>
    </div>
  );

  return (
    <Section title="Crossover Playground" description="Mix two parents. Child genes are tinted by their source (A blue / B amber).">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full rounded-xl border border-slate-700/60 bg-slate-900/70 p-5 text-xs lg:max-w-sm">
          <div className="space-y-4">
            <label className="flex flex-col gap-2"><Label>Length</Label><Slider value={length} min={2} max={24} step={1} onChange={setLength} /></label>
            <div className="flex flex-col gap-2">
              <Label>Method</Label>
              <ToggleGroup
                value={method}
                onChange={(v) => setMethod(v as 'single' | 'uniform')}
                options={[{ id: 'single', label: 'Single-Point' }, { id: 'uniform', label: 'Uniform' }]}
              />
            </div>
            {seedInput(seed, setSeed)}
          </div>
        </div>
        <div className="flex-1">
          <GeneRow title="Parent A" genes={parentA} />
          <GeneRow title="Parent B" genes={parentB} />
          <GeneRow title="Child" genes={child} highlight="C" />
          <p className="mt-2 text-[11px] text-slate-400">Single-point copies a prefix from A then a suffix from B; uniform flips a coin per gene.</p>
        </div>
      </div>
    </Section>
  );
};

// --- Mutation Playground ---
const MutationPlayground = () => {
  const [length, setLength] = useState(12);
  const [rate, setRate] = useState(0.15);
  const [std, setStd] = useState(0.2);
  const [seed, setSeed] = useState(99);
  const [samples, setSamples] = useState(400);

  const base = useMemo<Chromosome>(() => Array.from({ length }, (_, i) => Number(((i / (length - 1)) * 2 - 1).toFixed(2))), [length]);
  const bounds = useMemo(() => Array.from({ length }, () => ({ min: -1, max: 1 })), [length]);

  const cfg: GAConfig = useMemo(() => ({
    populationSize: 0,
    chromosomeLength: length,
    selection: 'roulette',
    tournamentSize: 3,
    crossover: 'single',
    crossoverRate: 1,
    mutationRate: rate,
    mutationStdDev: std,
    elitism: 0,
    bounds,
    fitnessFnName: 'preset1',
    seed: 0,
    maxGenerations: 0,
  }), [length, rate, std, bounds]);

  const mutated = useMemo(() => mutateChromosome(base, cfg, createMulberry32(seed)), [base, cfg, seed]);

  const stats = useMemo(() => {
    const rng = createMulberry32(seed);
    let changed = 0;
    for (let i = 0; i < samples; i += 1) {
      const m = mutateChromosome(base, cfg, rng);
      for (let j = 0; j < m.length; j += 1) {
        if (Math.abs(m[j] - base[j]) > 1e-9) changed += 1;
      }
    }
    const totalGenes = samples * length;
    return { changedPct: totalGenes ? changed / totalGenes : 0 };
  }, [base, cfg, samples, seed, length]);

  const CellRow = ({ title, genes, compare }: { title: string; genes: number[]; compare?: number[] }) => (
    <div className="mb-2">
      <div className="mb-1 text-[11px] text-slate-400">{title}</div>
      <div className="flex flex-wrap gap-1">
        {genes.map((g, i) => {
          const changed = compare ? Math.abs(genes[i] - (compare[i] as number)) > 1e-9 : false;
          const bg = changed ? 'bg-rose-500/30 border-rose-500/50' : 'bg-slate-800/50 border-slate-700/60';
          return (
            <span key={i} className={`rounded border px-2 py-1 font-mono text-[11px] text-slate-200 ${bg}`}>{g.toFixed(2)}</span>
          );
        })}
      </div>
    </div>
  );

  return (
    <Section title="Mutation Playground" description="Tweaking rate and std dev shows how many genes change and by how much.">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
        <label className="flex items-center gap-2"><Label>Length</Label><Slider value={length} min={4} max={32} step={1} onChange={setLength} /></label>
        <label className="flex items-center gap-2"><Label>Rate</Label><Slider value={Number(rate.toFixed(2))} min={0} max={1} step={0.01} onChange={setRate} /></label>
        <label className="flex items-center gap-2"><Label>Std Dev</Label><Slider value={Number(std.toFixed(2))} min={0.01} max={1} step={0.01} onChange={setStd} /></label>
        <label className="flex items-center gap-2"><Label>Samples</Label><Slider value={samples} min={100} max={5000} step={100} onChange={setSamples} /></label>
        {seedInput(seed, setSeed)}
      </div>
      <CellRow title="Base" genes={base} />
      <CellRow title="One Mutation" genes={mutated} compare={base} />
      <div className="mt-3 text-[11px] text-slate-400">Estimated mutated genes across {samples} trials: {(stats.changedPct * 100).toFixed(1)}% (expected ≈ {Math.round(rate * 100)}%).</div>
    </Section>
  );
};

// --- Tips Accordion ---
const TipsAccordion = () => {
  const [open, setOpen] = useState<string | null>(null);
  const items = [
    { id: 'diversity', title: 'Avoiding premature convergence', body: 'Increase mutation rate or std dev, reduce elitism, or switch to tournament selection with smaller k. Watch the Diversity chart for recovery.' },
    { id: 'exploitation', title: 'Speeding up exploitation', body: 'Increase elitism slightly, raise tournament size, and lower mutation once near a good region. Monitor Best vs. Average gap on the charts.' },
    { id: 'stability', title: 'Keeping runs reproducible', body: 'Use fixed seeds in both tabs. This freezes the PRNG so you can compare parameter changes without stochastic noise.' },
  ];
  return (
    <Section title="Playbook Tips">
      <ul className="space-y-2 text-sm">
        {items.map((it) => (
          <li key={it.id} className="overflow-hidden rounded-lg border border-slate-700/60">
            <button
              type="button"
              onClick={() => setOpen((cur) => (cur === it.id ? null : it.id))}
              className="flex w-full items-center justify-between bg-slate-900/70 px-4 py-2 text-left text-slate-200 hover:text-accent"
            >
              <span className="text-xs font-semibold">{it.title}</span>
              <span className="text-slate-500">{open === it.id ? '−' : '+'}</span>
            </button>
            {open === it.id ? <div className="bg-slate-900/50 px-4 py-3 text-[12px] text-slate-300">{it.body}</div> : null}
          </li>
        ))}
      </ul>
    </Section>
  );
};

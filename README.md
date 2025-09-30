# Genetic Algorithm Visualizer

Interactive, deterministic-friendly GA playground built with React 18, Vite, TypeScript, Tailwind CSS, Zustand, and Recharts. Configure operators, tune bounds, and watch the population evolve with live charts and export/import tooling.

## Features

- **Configurable pipeline** – roulette or tournament selection, single-point or uniform crossover, Gaussian mutation, and elitism.
- **Deterministic runs** – seedable Mulberry32 PRNG supports run/pause/step/reset controls without losing reproducibility.
- **Multi-chart dashboard** – best/average fitness over time, distribution histogram, diversity trend, 2D scatter, and 1D function view when applicable.
- **Inspector tooling** – sortable top-N table with gene sparklines and pinned-individual highlighting across charts.
- **Import/export** – JSON payload restores runs (config + last 50 generations + best individual) and CSV snapshot exports the current population.
- **Tailwind styling** – responsive layout with accessible focus states and WCAG-friendly contrast.

## Getting Started

```bash
npm install
npm run dev
```

The app runs entirely in the browser and produces a static `dist/` build suitable for GitHub Pages, Netlify, or similar hosts via `npm run build`.

## Project Structure

- `src/ga/` – core GA types, engine, operators, and fitness utilities.
- `src/store/` – Zustand-powered state management and import/export actions.
- `src/components/` – controls, charts (Recharts), inspector, and layout helpers.
- `src/hooks/useRunLoop.ts` – `requestAnimationFrame` loop keeping simulation work off the React render cycle.
- `src/utils/` – helpers for math, CSV generation, downloads, and validation.
- `src/data/presets.ts` – default configuration and quick presets.

## Accessibility & Browser Support

- Keyboard navigable controls with visible focus states and descriptive labels/tooltips.
- Responsive layout targeting the latest two versions of Chrome, Edge, Firefox, and Safari.

Feel free to tweak presets, bounds, or fitness functions to craft new optimisation landscapes.

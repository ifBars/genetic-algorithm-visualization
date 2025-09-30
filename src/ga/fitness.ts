import type { Chromosome, FitnessDefinition, FitnessFunction, GAConfig, FitnessPresetId } from './types';

const clampToBounds = (genes: Chromosome, bounds: GAConfig['bounds']) =>
  genes.map((value, index) => {
    const range = bounds[index] ?? bounds[bounds.length - 1] ?? { min: -10, max: 10 };
    return Math.min(range.max, Math.max(range.min, value));
  });

const presetDefinitions: Record<FitnessPresetId, FitnessDefinition> = {
  preset1: {
    id: 'preset1',
    name: 'Sinusoidal Ridge (2D)',
    description: 'Maximise sin(x) * cos(y) + 0.5 * sin(2x) over [-π, π]^2.',
    suggestedBounds: [
      { min: -Math.PI, max: Math.PI },
      { min: -Math.PI, max: Math.PI },
    ],
    suggestedLength: 2,
    evaluate: (genes: Chromosome) => {
      const [x = 0, y = 0] = genes;
      return Math.sin(x) * Math.cos(y) + 0.5 * Math.sin(2 * x);
    },
  },
  preset2: {
    id: 'preset2',
    name: 'Offset Bowl (2D)',
    description: 'Maximise a multi-peak bowl around (1, -2).',
    suggestedBounds: [
      { min: -6, max: 6 },
      { min: -6, max: 6 },
    ],
    suggestedLength: 2,
    evaluate: (genes: Chromosome) => {
      const [x = 0, y = 0] = genes;
      const bowl = -((x - 1) ** 2 + (y + 2) ** 2);
      const waves = 0.6 * Math.sin(3 * x) + 0.4 * Math.cos(2 * y);
      return bowl + waves;
    },
  },
  preset3: {
    id: 'preset3',
    name: 'Inverted Rastrigin (3D)',
    description: 'Multi-peak surface with a global optimum at the origin. Maximisation version of Rastrigin.',
    suggestedBounds: [
      { min: -5.12, max: 5.12 },
      { min: -5.12, max: 5.12 },
      { min: -5.12, max: 5.12 },
    ],
    suggestedLength: 3,
    evaluate: (genes: Chromosome) => {
      const [x = 0, y = 0, z = 0] = genes;
      const values = [x, y, z];
      const terms = values.reduce((sum, value) => sum + (value ** 2 - 10 * Math.cos(2 * Math.PI * value)), 0);
      const baseline = 30 + terms;
      return 60 - baseline;
    },
  },
  preset4: {
    id: 'preset4',
    name: 'Himmelblau Peaks (2D)',
    description: 'Classic Himmelblau surface inverted for maximisation with four symmetric peaks.',
    suggestedBounds: [
      { min: -6, max: 6 },
      { min: -6, max: 6 },
    ],
    suggestedLength: 2,
    evaluate: (genes: Chromosome) => {
      const [x = 0, y = 0] = genes;
      const term1 = (x ** 2 + y - 11) ** 2;
      const term2 = (x + y ** 2 - 7) ** 2;
      return 300 - (term1 + term2);
    },
  },
  preset5: {
    id: 'preset5',
    name: 'Offset Plateau (4D)',
    description: 'Four-dimensional plateau with gentle ridges and absolute-value penalties to encourage exploration.',
    suggestedBounds: [
      { min: -4, max: 4 },
      { min: -4, max: 4 },
      { min: -4, max: 4 },
      { min: -4, max: 4 },
    ],
    suggestedLength: 4,
    evaluate: (genes: Chromosome) => {
      const [x = 0, y = 0, z = 0, w = 0] = genes;
      const bowl = -0.7 * ((x - 1.5) ** 2 + (y + 0.75) ** 2 + (z - 0.25) ** 2 + (w + 1.25) ** 2);
      const terraces = 0.6 * Math.sin(2 * x) + 0.5 * Math.cos(3 * y) + 0.4 * Math.sin(2.5 * z) + 0.4 * Math.cos(1.5 * w);
      const plateau = -0.2 * (Math.abs(x) + Math.abs(y) + Math.abs(z) + Math.abs(w));
      return 12 + bowl + terraces + plateau;
    },
  },
};

export const fitnessPresets = Object.values(presetDefinitions);

const compileCustom = (config: GAConfig) => {
  const code = config.customFitnessCode?.trim();
  if (!code) {
    return {
      fn: presetDefinitions.preset1.evaluate,
      error: 'Provide custom fitness code or select a preset.',
    } as { fn: FitnessFunction; error?: string };
  }

  const sandboxHeader =
    "'use strict'; const { abs, acos, asin, atan, atan2, ceil, cos, exp, floor, log, max, min, pow, random, round, sign, sin, sqrt, tan, PI, E } = Math;" +
    'const [x, y, z, w] = genes;';
  const wrapped = code.includes('return') ? code : `return (${code});`;

  try {
    // eslint-disable-next-line no-new-func
    const evaluator = new Function('genes', `${sandboxHeader}\n${wrapped}`) as FitnessFunction;
    const probe = new Array(config.chromosomeLength).fill(0);
    const sample = evaluator(probe);
    if (Number.isNaN(sample) || !Number.isFinite(sample)) {
      return {
        fn: presetDefinitions.preset1.evaluate,
        error: 'Custom fitness returned an invalid number.',
      };
    }
    return { fn: evaluator };
  } catch (error) {
    return {
      fn: presetDefinitions.preset1.evaluate,
      error: error instanceof Error ? error.message : 'Failed to compile custom fitness.',
    };
  }
};

export const buildFitness = (
  config: GAConfig,
): { fn: FitnessFunction; error?: string; appliedBounds: GAConfig['bounds'] } => {
  if (config.fitnessFnName === 'custom') {
    const result = compileCustom(config);
    const appliedBounds = config.bounds.length
      ? config.bounds
      : presetDefinitions.preset1.suggestedBounds;
    return { fn: (genes) => result.fn(clampToBounds(genes, appliedBounds)), error: result.error, appliedBounds };
  }

  const preset = presetDefinitions[config.fitnessFnName];
  return {
    fn: (genes) => preset.evaluate(clampToBounds(genes, config.bounds.length ? config.bounds : preset.suggestedBounds)),
    appliedBounds: config.bounds.length ? config.bounds : preset.suggestedBounds,
  };
};

export const getPresetSuggestion = (id: FitnessPresetId) => presetDefinitions[id];

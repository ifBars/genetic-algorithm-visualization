import type { Individual } from '../ga/types';

export const populationToCsv = (population: Individual[]): string => {
  if (!population.length) return '';
  const length = population[0].genes.length;
  const header = [
    'id',
    ...Array.from({ length }, (_, index) => `gene_${index + 1}`),
    'fitness',
    'parents',
  ];
  const rows = population.map((individual) => [
    individual.id,
    ...individual.genes.map((value) => value.toPrecision(6)),
    individual.fitness.toPrecision(6),
    individual.parents?.join(' ') ?? '',
  ]);
  return [header, ...rows].map((columns) => columns.join(',')).join('\n');
};

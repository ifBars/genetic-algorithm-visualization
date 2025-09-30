import { memo } from 'react';

interface GeneSparklineProps {
  genes: number[];
  stroke?: string;
}

const GeneSparklineComponent = ({ genes, stroke = '#38bdf8' }: GeneSparklineProps) => {
  if (!genes.length) {
    return <span className="text-xs text-slate-500">—</span>;
  }
  const min = Math.min(...genes);
  const max = Math.max(...genes);
  const range = max - min || 1;
  const width = 120;
  const height = 24;
  const points = genes
    .map((value, index) => {
      const x = (index / Math.max(1, genes.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline fill="none" stroke={stroke} strokeWidth="2" points={points} />
    </svg>
  );
};

export const GeneSparkline = memo(GeneSparklineComponent);

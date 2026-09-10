import type { CategoryStat } from '../lib/analytics';

interface ChartTooltipProps {
  /** Recharts injects these when it clones the element passed to `content`. */
  active?: boolean;
  payload?: Array<{ payload: CategoryStat }>;
  format: (stat: CategoryStat) => string;
}

export default function ChartTooltip({ active, payload, format }: ChartTooltipProps) {
  const stat = payload?.[0]?.payload;
  if (active !== true || stat === undefined) return null;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__name">{stat.name}</div>
      <div className="chart-tooltip__value">{format(stat)}</div>
    </div>
  );
}

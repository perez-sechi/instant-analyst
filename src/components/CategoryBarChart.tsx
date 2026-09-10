import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import { formatCompact, formatNumber, type CategoryStat } from '../lib/analytics';
import { AXIS_LABEL_COLOR, BAR_COLOR, GRID_COLOR } from '../lib/palette';

interface CategoryBarChartProps {
  data: CategoryStat[];
  /** What the bar height measures, e.g. `Revenue` or `Records`. */
  metricLabel: string;
}

function truncateTick(value: string): string {
  return value.length > 12 ? `${value.slice(0, 11)}…` : value;
}

export default function CategoryBarChart({ data, metricLabel }: CategoryBarChartProps) {
  if (data.length === 0) {
    return <p className="empty-note">No rows match this filter.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 24, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID_COLOR} />
        <XAxis
          dataKey="name"
          interval={0}
          height={36}
          tickLine={false}
          axisLine={false}
          tickFormatter={truncateTick}
          tick={{ fontSize: 11, fill: AXIS_LABEL_COLOR }}
        />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: 'rgba(79, 70, 229, 0.06)' }}
          content={
            <ChartTooltip
              format={(stat) => `${metricLabel}: ${formatNumber(stat.value)} · ${stat.count} rows`}
            />
          }
        />
        <Bar dataKey="value" fill={BAR_COLOR} radius={[6, 6, 0, 0]} maxBarSize={48}>
          <LabelList
            dataKey="value"
            position="top"
            formatter={(value: unknown) => formatCompact(Number(value))}
            fill={AXIS_LABEL_COLOR}
            fontSize={11}
            fontWeight={600}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

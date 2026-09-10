import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { formatNumber, formatPercent, type CategoryStat } from '../lib/analytics';
import { colorAt } from '../lib/palette';

interface CategoryPieChartProps {
  data: CategoryStat[];
  /** Distinct category count shown in the donut hole. */
  categoryCount: number;
  /** Singular and plural forms of the grouping column, for the hole caption. */
  categoryLabel: string;
  categoryLabelPlural: string;
}

export default function CategoryPieChart({
  data,
  categoryCount,
  categoryLabel,
  categoryLabelPlural,
}: CategoryPieChartProps) {
  if (data.length === 0) {
    return <p className="empty-note">No rows match this filter.</p>;
  }

  return (
    <div className="pie-body">
      <div className="pie-body__chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              startAngle={90}
              endAngle={-270}
              paddingAngle={1}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((stat, index) => (
                <Cell key={stat.name} fill={colorAt(index)} />
              ))}
            </Pie>
            <Tooltip
              content={
                <ChartTooltip
                  format={(stat) =>
                    `${formatNumber(stat.count)} rows · ${formatPercent(stat.share)}`
                  }
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pie-center">
          <span className="pie-center__value">{categoryCount}</span>
          <span className="pie-center__label">
            {categoryCount === 1 ? categoryLabel : categoryLabelPlural}
          </span>
        </div>
      </div>

      <ul className="legend">
        {data.map((stat, index) => (
          <li className="legend__row" key={stat.name}>
            <span className="legend__label">
              <span className="legend__swatch" style={{ background: colorAt(index) }} />
              <span className="legend__name" title={stat.name}>
                {stat.name}
              </span>
            </span>
            <span className="legend__value">{formatPercent(stat.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

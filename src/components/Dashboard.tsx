import { useMemo, useRef } from 'react';
import CategoryBarChart from './CategoryBarChart';
import CategoryPieChart from './CategoryPieChart';
import KpiCard from './KpiCard';
import Panel from './Panel';
import type { Dataset } from '../lib/csv';
import {
  ALL_CATEGORIES,
  aggregateByCategory,
  categoryValues,
  computeKpis,
  filterRows,
  formatNumber,
  formatPercent,
  humanizeColumn,
  pluralize,
  topWithOther,
} from '../lib/analytics';

/** Beyond these counts the charts stop being readable. */
const MAX_BARS = 10;
const MAX_SLICES = 6;

interface DashboardProps {
  dataset: Dataset;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onFile: (file: File) => void;
  error: string | null;
  isParsing: boolean;
}

export default function Dashboard({
  dataset,
  selectedCategory,
  onSelectCategory,
  onFile,
  error,
  isParsing,
}: DashboardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { rows, categoryColumn, metricColumn, fileName } = dataset;

  const options = useMemo(
    () => categoryValues(rows, categoryColumn),
    [rows, categoryColumn],
  );

  const visibleRows = useMemo(
    () => filterRows(rows, categoryColumn, selectedCategory),
    [rows, categoryColumn, selectedCategory],
  );

  const kpis = useMemo(
    () => computeKpis(visibleRows, categoryColumn, metricColumn),
    [visibleRows, categoryColumn, metricColumn],
  );

  const metricStats = useMemo(
    () => aggregateByCategory(visibleRows, categoryColumn, metricColumn),
    [visibleRows, categoryColumn, metricColumn],
  );

  const countStats = useMemo(
    () => aggregateByCategory(visibleRows, categoryColumn, null),
    [visibleRows, categoryColumn],
  );

  const categoryLabel = humanizeColumn(categoryColumn);
  const categoryLabelPlural = pluralize(categoryLabel);
  const metricLabel = metricColumn === null ? 'Records' : humanizeColumn(metricColumn);
  const barData = metricStats.slice(0, MAX_BARS);
  const pieData = topWithOther(countStats, MAX_SLICES);

  const isFiltered = selectedCategory !== ALL_CATEGORIES;
  const shareOfAll = rows.length === 0 ? 0 : visibleRows.length / rows.length;

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <h1 className="header__title">Instant Analyst</h1>
          <p className="header__subtitle">CSV Data Visualization</p>
        </div>
        <div className="header__actions">
          <span className="file-chip">
            <span className="file-chip__dot" aria-hidden="true" />
            {fileName}
          </span>
          <button
            type="button"
            className="button-secondary"
            onClick={() => inputRef.current?.click()}
            disabled={isParsing}
          >
            {isParsing ? 'Reading…' : 'Replace File'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
              event.target.value = '';
            }}
          />
        </div>
      </header>

      {error !== null && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}

      <div className="toolbar">
        <label className="toolbar__label" htmlFor="category-filter">
          Filter by {categoryLabel}
        </label>
        <div className="select-wrapper">
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(event) => onSelectCategory(event.target.value)}
          >
            <option value={ALL_CATEGORIES}>All {categoryLabelPlural}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="kpi-row">
        <KpiCard
          icon="#"
          iconColor="#4f46e5"
          iconBackground="#e0e7ff"
          label="Total Records"
          value={formatNumber(kpis.records)}
          note={isFiltered ? `${formatPercent(shareOfAll)} of all` : undefined}
        />
        {kpis.total !== null && (
          <KpiCard
            icon="Σ"
            iconColor="#10b981"
            iconBackground="#d9f6e8"
            label={`Total ${metricLabel}`}
            value={formatNumber(kpis.total)}
          />
        )}
        {kpis.average !== null && (
          <KpiCard
            icon="÷"
            iconColor="#06b6d4"
            iconBackground="#d0f1f7"
            label={`Avg ${metricLabel}`}
            value={formatNumber(kpis.average)}
          />
        )}
        <KpiCard
          icon="▤"
          iconColor="#f59e0b"
          iconBackground="#feeac7"
          label={categoryLabelPlural}
          value={formatNumber(kpis.categories)}
        />
      </div>

      <div className="charts-row">
        <Panel
          title={`${metricLabel} by ${categoryLabel}`}
          subtitle={
            metricStats.length > MAX_BARS
              ? `Top ${MAX_BARS} of ${metricStats.length} values`
              : `Total ${metricLabel.toLowerCase()} for each ${categoryLabel.toLowerCase()}`
          }
        >
          <div className="panel__body">
            <CategoryBarChart data={barData} metricLabel={metricLabel} />
          </div>
        </Panel>

        <Panel
          title={`${categoryLabel} Share`}
          subtitle={`Share of records by ${categoryLabel.toLowerCase()}`}
        >
          <CategoryPieChart
            data={pieData}
            categoryCount={kpis.categories}
            categoryLabel={categoryLabel}
            categoryLabelPlural={categoryLabelPlural}
          />
        </Panel>
      </div>
    </main>
  );
}

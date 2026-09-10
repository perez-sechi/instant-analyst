import { toNumber, type Row } from './csv';

export const ALL_CATEGORIES = '__all__';

export interface CategoryStat {
  name: string;
  /** Sum of the metric column, or the record count when there is no metric column. */
  value: number;
  count: number;
  share: number;
}

export interface Kpis {
  records: number;
  total: number | null;
  average: number | null;
  categories: number;
}

export function categoryValues(rows: Row[], categoryColumn: string): string[] {
  const values = new Set<string>();
  for (const row of rows) {
    const value = row[categoryColumn];
    if (value !== null && value !== undefined && value !== '') values.add(String(value));
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

export function filterRows(rows: Row[], categoryColumn: string, selected: string): Row[] {
  if (selected === ALL_CATEGORIES) return rows;
  return rows.filter((row) => String(row[categoryColumn]) === selected);
}

export function aggregateByCategory(
  rows: Row[],
  categoryColumn: string,
  metricColumn: string | null,
): CategoryStat[] {
  const totals = new Map<string, { value: number; count: number }>();

  for (const row of rows) {
    const rawCategory = row[categoryColumn];
    if (rawCategory === null || rawCategory === undefined || rawCategory === '') continue;
    const name = String(rawCategory);

    const metric = metricColumn === null ? 1 : (toNumber(row[metricColumn]) ?? 0);
    const entry = totals.get(name) ?? { value: 0, count: 0 };
    entry.value += metric;
    entry.count += 1;
    totals.set(name, entry);
  }

  const grandTotal = [...totals.values()].reduce((sum, entry) => sum + entry.value, 0);

  return [...totals.entries()]
    .map(([name, entry]) => ({
      name,
      value: entry.value,
      count: entry.count,
      share: grandTotal === 0 ? 0 : entry.value / grandTotal,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Keeps slice counts readable: everything past `limit` collapses into one bucket. */
export function topWithOther(stats: CategoryStat[], limit: number): CategoryStat[] {
  if (stats.length <= limit) return stats;

  const rest = stats.slice(limit);
  const other = rest.reduce(
    (sum, stat) => ({
      value: sum.value + stat.value,
      count: sum.count + stat.count,
      share: sum.share + stat.share,
    }),
    { value: 0, count: 0, share: 0 },
  );

  return [...stats.slice(0, limit), { name: `Other (${rest.length})`, ...other }];
}

export function computeKpis(
  rows: Row[],
  categoryColumn: string,
  metricColumn: string | null,
): Kpis {
  const records = rows.length;
  const categories = categoryValues(rows, categoryColumn).length;

  if (metricColumn === null) {
    return { records, total: null, average: null, categories };
  }

  let total = 0;
  let measured = 0;
  for (const row of rows) {
    const value = toNumber(row[metricColumn]);
    if (value === null) continue;
    total += value;
    measured += 1;
  }

  return {
    records,
    total,
    average: measured === 0 ? null : total / measured,
    categories,
  };
}

const decimalFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const wholeFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  return decimalFormatter.format(value);
}

/**
 * Chart labels have to stay narrow and scan evenly, so large values collapse to 1.2K / 3.4M and
 * decimals are dropped once they stop carrying information. Small metrics keep their precision.
 */
export function formatCompact(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude >= 10_000) return compactFormatter.format(value);
  if (magnitude >= 100) return wholeFormatter.format(value);
  return decimalFormatter.format(value);
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/** Turns a raw header such as `unit_price` into `Unit price` for use in labels. */
export function humanizeColumn(name: string): string {
  const spaced = name.replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Labels read as "All Categories" / "4 Regions", so column names need a plural form. */
export function pluralize(word: string): string {
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  return `${word}s`;
}

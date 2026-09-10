import Papa from 'papaparse';

export type CellValue = string | number | boolean | null;
export type Row = Record<string, CellValue>;

export interface Dataset {
  fileName: string;
  rows: Row[];
  columns: string[];
  /** Column the charts group by. Always present — parsing fails without one. */
  categoryColumn: string;
  /** Column the totals and bar heights are measured from, or null for record counts. */
  metricColumn: string | null;
}

export class CsvError extends Error {}

/** A column is treated as numeric when nearly every filled cell parses as a number. */
const NUMERIC_RATIO = 0.8;
/** Above this many distinct values a column is an identifier, not something to group by. */
const MAX_CATEGORY_VALUES = 50;
/** Groupings larger than this get truncated in the charts, so they are a worse default. */
const READABLE_CATEGORY_VALUES = 12;

/**
 * Names that usually mark the column worth measuring, most meaningful first. A file with both
 * `units` and `revenue` should total the revenue.
 */
const METRIC_KEYWORDS = [
  'revenue',
  'sales',
  'amount',
  'total',
  'profit',
  'price',
  'cost',
  'spend',
  'value',
  'quantity',
  'qty',
  'units',
  'count',
  'score',
];

function isBlank(value: CellValue): boolean {
  return value === null || value === undefined || value === '';
}

export function toNumber(value: CellValue): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    // Tolerate thousands separators and currency symbols that dynamicTyping leaves as strings.
    const cleaned = value.replace(/[$€£¥,\s]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

interface ColumnProfile {
  name: string;
  filled: number;
  numeric: number;
  distinct: number;
}

function profileColumn(rows: Row[], name: string): ColumnProfile {
  const seen = new Set<string>();
  let filled = 0;
  let numeric = 0;

  for (const row of rows) {
    const value = row[name];
    if (isBlank(value)) continue;
    filled += 1;
    if (toNumber(value) !== null) numeric += 1;
    if (seen.size <= MAX_CATEGORY_VALUES) seen.add(String(value));
  }

  return { name, filled, numeric, distinct: seen.size };
}

function isNumericColumn(profile: ColumnProfile): boolean {
  return profile.filled > 0 && profile.numeric / profile.filled >= NUMERIC_RATIO;
}

/**
 * Groupable columns are non-numeric with repeating values. A column where every row
 * is distinct is a name or an id — charting it would produce one bar per record.
 */
function isCategoryColumn(profile: ColumnProfile, rowCount: number): boolean {
  return (
    !isNumericColumn(profile) &&
    profile.filled > 0 &&
    profile.distinct > 1 &&
    profile.distinct <= MAX_CATEGORY_VALUES &&
    profile.distinct < rowCount
  );
}

/** Ids are numeric but meaningless to sum, so they are the last resort for a metric. */
function looksLikeId(name: string): boolean {
  return /(^|[\s_-])(id|code|zip|postcode|year)([\s_-]|$)/i.test(name.trim());
}

function metricRank(name: string): number {
  const lower = name.toLowerCase();
  const match = METRIC_KEYWORDS.findIndex((keyword) => lower.includes(keyword));
  return match === -1 ? METRIC_KEYWORDS.length : match;
}

export function parseCsvFile(file: File): Promise<Dataset> {
  return new Promise((resolve, reject) => {
    Papa.parse<Row>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          resolve(buildDataset(file.name, results));
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(new CsvError(`Could not read that file: ${error.message}`)),
    });
  });
}

function buildDataset(fileName: string, results: Papa.ParseResult<Row>): Dataset {
  const columns = (results.meta.fields ?? []).filter((field) => field.trim() !== '');
  if (columns.length === 0) {
    throw new CsvError('That file has no column headers. The first row must name the columns.');
  }

  const rows = results.data.filter((row) => columns.some((column) => !isBlank(row[column])));
  if (rows.length === 0) {
    throw new CsvError('That file has headers but no data rows.');
  }

  const profiles = columns.map((column) => profileColumn(rows, column));

  const categoryCandidates = profiles.filter((profile) => isCategoryColumn(profile, rows.length));
  if (categoryCandidates.length === 0) {
    throw new CsvError(
      'No column to group by. Add a text column with repeating values, such as a category or region.',
    );
  }
  // Among groupings that fit in a chart, the richest one says the most; if every candidate is
  // oversized, fall back to the smallest so the charts stay legible.
  const readable = categoryCandidates.filter(
    (profile) => profile.distinct <= READABLE_CATEGORY_VALUES,
  );
  const categoryColumn =
    readable.length > 0
      ? readable.reduce((best, profile) => (profile.distinct > best.distinct ? profile : best)).name
      : categoryCandidates.reduce((best, profile) =>
          profile.distinct < best.distinct ? profile : best,
        ).name;

  const numericCandidates = profiles.filter(isNumericColumn);
  const measurable = numericCandidates.filter((profile) => !looksLikeId(profile.name));
  const metricPool = measurable.length > 0 ? measurable : numericCandidates;
  const metricColumn =
    metricPool.length === 0
      ? null
      : metricPool.reduce((best, profile) =>
          metricRank(profile.name) < metricRank(best.name) ? profile : best,
        ).name;

  return { fileName, rows, columns, categoryColumn, metricColumn };
}

/** Categorical series colors, matching the Figma prototype's legend order. */
export const CATEGORY_COLORS = [
  '#4f46e5',
  '#06b6d4',
  '#f59e0b',
  '#ef4444',
  '#10b981',
  '#8b5cf6',
  '#94a3b8',
];

export const BAR_COLOR = '#4f46e5';
export const AXIS_LABEL_COLOR = '#6b7280';
export const GRID_COLOR = '#eef0f3';

export function colorAt(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

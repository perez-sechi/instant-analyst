# Instant Analyst

Upload a CSV and see it visualized instantly — KPI cards, a bar chart, a donut chart, and a
category filter, all computed in the browser. No backend, no upload to a server.

Implements [KAN-5](https://perez-sechi.atlassian.net/browse/KAN-5) from the
[Figma prototype](https://www.figma.com/design/vkTIu8b6O4cuN2gZagczvz).

## How it works

The app profiles the uploaded CSV to decide what to chart:

- **Category column** — the non-numeric column with the fewest repeating values. Charts group by
  this column and the dropdown filters on it.
- **Metric column** — the first numeric column that isn't an identifier (`id`, `code`, `zip`,
  `year`). Bar heights and the total/average KPIs measure it. When a file has no numeric column,
  the app falls back to record counts.

Everything is parsed and aggregated client-side with [PapaParse](https://www.papaparse.com/), and
charted with [Recharts](https://recharts.org/).

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into dist/
npm run preview  # serve the production build
```

`sample-data.csv` in the repo root is a small file for trying the app out.

## Deploying to Render

The repo ships a [Blueprint](https://render.com/docs/blueprint-spec) (`render.yaml`) that defines a
single static site: `npm ci && npm run build`, published from `dist/`.

1. In the Render dashboard choose **New → Blueprint**.
2. Point it at this repository and apply the blueprint.

Render builds on every push to the default branch. Node is pinned to 22 via `.node-version`.

## Project layout

```
src/
├── App.tsx                  upload ↔ dashboard state
├── components/              UI matching the Figma screens
└── lib/
    ├── csv.ts               parsing + column profiling
    ├── analytics.ts         aggregation + formatting
    └── palette.ts           chart colors
```

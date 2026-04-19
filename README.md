# Hong Kong School Songs and Mottos

A static responsive website for searching Hong Kong school song and motto data.

Current public dataset:

- `data/schools.json`
- `data/schools.js`
- Scope: primary schools only for now

## Pages

- `index.html`: Home/search page.
- `detail.html`: School detail page.
- `about.html`: Data sources and disclaimer.

## Data Import

The website dataset is generated from a private local workbook source. The source workbook is intentionally not tracked in Git.

```bash
python3 scripts/import_primary_workbook.py
```

Generated files:

- `data/schools.json`
- `data/schools.js`

## Run locally

Open `index.html` in a browser, or run a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

# Hong Kong School Songs and Mottos

A static responsive project website for Hong Kong primary and secondary school songs, mottos, school profiles, and related project outputs.

Current public school dataset:

- `data/schools.json`
- `data/schools.js`
- Scope: primary and secondary schools

## Pages

- `index.html`: Bilingual project homepage.
- `schools.html`: Searchable school database.
- `detail.html`: School detail page.
- `project-report.html`: Project report links and notes.
- `publications.html`: Publication links and notes.
- `seminar-videos.html`: Seminar report video embeds and links.
- `about.html`: Data sources and disclaimer.

## Project Resources

Project reports, publications, and videos are represented as metadata in `data/resources.js`.

Large files should stay external. Use public Google Drive, Dropbox, YouTube, Vimeo, or institutional repository links instead of committing `.mov`, `.mp4`, or large archives to GitHub.

For Google Drive videos, prefer preview links:

```text
https://drive.google.com/file/d/FILE_ID/preview
```

## Data Import

The school dataset is generated from private local workbook sources. Source workbooks are intentionally not tracked in Git.

```bash
python3 scripts/import_primary_workbook.py
```

By default, the importer reads all non-temporary `.xlsx` files in `data/`.

Generated files:

- `data/schools.json`
- `data/schools.js`

## Run Locally

Run a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

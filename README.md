# Conference Tracker

A mobile-first, installable web app for prepping to work a career-fair floor (NBMBAA, ROMBA, PPS Pricing, etc.) the night before, then using it live on the show floor.

Import the conference's exhibitor list and your own target-company list, cross-reference them automatically, tier and rank companies by priority, and track three things per company — applied, news read, talked at booth — with booth numbers and application links at a glance.

## Features

- **Import & reconcile** — upload your target list and the official exhibitor list as `.xlsx` or `.csv`. Company names are matched (punctuation/suffix-insensitive, fuzzy-tolerant), so "Acme Consulting" matches "Acme Consulting Inc." Unmatched targets are flagged **no confirmed booth**; exhibitors not on your target list land in **Suggested Adds** for a quick scan.
- **Tier and rank** — a "Priority" (deep focus) tier and a "Quick apply" tier, pre-sorted by a heuristic (sector fit note > priority flag > confirmed posting > jobs-on-board count) and fully reorderable afterward by drag-and-drop, with a touch-friendly drag handle for use on a phone.
- **Track per company** — three independent checkboxes (applied/joined pipeline, news read, talked at booth), a direct link to the application/talent-pipeline page, and a link to whatever news article you read as a conversation opener.
- **Edit anytime** — add, edit, remove, re-tier, and re-rank companies without re-importing anything.
- **Export / share** — copy a read-only text summary, or download a `.json` backup or `.txt` summary.
- **Installable PWA** — add to your iPhone home screen for an app-like, full-screen experience. Works offline once loaded; all data is stored locally on-device (no account, no backend).

## Data model

Each company tracks: name, booth number, tier, rank, industry/sector-fit note, a news link, an application link, secondary links, the three status flags, a "no confirmed booth" flag, and free-text notes — matching the spec this tool was built from.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check and build for production
npm run preview   # preview the production build
npm run gen-icons # regenerate PWA icons (public/icons, favicon.svg, apple-touch-icon.png)
```

## Stack

Vite + React + TypeScript, Tailwind CSS v4, `@dnd-kit` for touch-friendly drag-and-drop, `read-excel-file`/`papaparse` for import, `idb-keyval` (IndexedDB) for on-device persistence, and `vite-plugin-pwa` for installability.

## Out of scope (v1)

No automated news/talent-link fetching (bring pre-researched links, or add them manually) and no multi-user sharing/sync — this is a personal prep tool, data lives on the device it's used on.

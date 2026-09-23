# Conference Tracker

A mobile-first, installable web app for prepping to work a career-fair floor (NBMBAA, ROMBA, PPS Pricing, etc.) the night before, then using it live on the show floor.

Import the conference's exhibitor list and your own target-company list, cross-reference them automatically, tier and rank companies by priority, and track three things per company — applied, news read, talked at booth — with booth numbers and application links at a glance.

## Features

- **Import & reconcile** — upload your target list and the official exhibitor list as `.xlsx` or `.csv`. Company names are matched (punctuation/suffix-insensitive, fuzzy-tolerant), so "Acme Consulting" matches "Acme Consulting Inc." Unmatched targets are flagged **no confirmed booth**; exhibitors not on your target list land in **Suggested Adds** for a quick scan. A live preview of each mapped column catches a mis-mapped "Company name" column before import, and companies marked not-interested are skipped automatically.
- **Restore from backup** — re-import a previously exported `.json` backup to move to a new device, undo a bad import, or recover after clearing browser data.
- **Tier and rank** — a "Priority" (deep focus) tier and a "Quick apply" tier, pre-sorted by a heuristic (sector fit note present > priority flag > confirmed posting > jobs-on-board count — presence-based, not a judgment of fit) and fully reorderable afterward by drag-and-drop (touch, mouse, or keyboard).
- **Track per company** — applied/joined pipeline, news read, and talked-at-booth checkboxes; separate **pre-booth talking points** (read right before walking up) and **post-booth debrief notes** (what happened, next steps), with an at-a-glance indicator for which companies still need a debrief; a direct application/talent-pipeline link and a news link.
- **Edit anytime** — tap any company card to pop up its full details; add, edit, remove (with a confirm step), re-tier, and re-rank without re-importing anything.
- **Search** — filter the current tier by name or industry when you need to jump straight to one company.
- **Multiple conferences** — switch between, create, rename, and delete separate conferences from the header. Each also has a confirm-gated "Reset company data" action (type RESET) for wiping and re-importing a fresh exhibitor list without losing the conference itself.
- **Drag between tiers** — a card can be dragged straight from Quick Apply into Priority (or back), not just reordered within its own tier.
- **Cross-device sync (optional)** — link a conference to a private GitHub Gist (using your own personal access token, stored only in that browser) to sync between your laptop and phone; auto-syncs periodically while open, with a manual "Sync now," last-write-wins on conflicts.
- **Export / share** — copy a read-only text summary, or download a `.json` backup or `.txt` summary (includes talking points and debrief notes).
- **Installable PWA** — add to your iPhone home screen for an app-like, full-screen experience. Works offline once loaded; checks for app updates periodically while open so a home-screen install doesn't run stale code. Data is stored locally by default (see Sync above to share across devices).

## Data model

Each company tracks: name, booth number, tier, rank, industry/sector-fit note, a news link, an application link, secondary links, the three status flags, a "no confirmed booth" flag, pre- and post-booth notes, and a priority flag — matching the spec this tool was built from.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check and build for production
npm run preview   # preview the production build
npm run gen-icons # regenerate PWA icons (public/icons, favicon.svg, apple-touch-icon.png)
```

## Stack

Vite + React + TypeScript, Tailwind CSS v4, `@dnd-kit` for touch-friendly (and keyboard-accessible) drag-and-drop, `read-excel-file`/`papaparse` for import, `idb-keyval` (IndexedDB) for on-device persistence, `vite-plugin-pwa` for installability, and the GitHub Gists REST API for optional cross-device sync.

## Out of scope (v1)

No automated news/talent-link fetching (bring pre-researched links, or add them manually), and sync is opt-in via a personal GitHub Gist rather than a hosted multi-user backend — this is a personal prep tool.

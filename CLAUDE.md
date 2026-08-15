# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Escapade** is a family vacation planner built with vanilla HTML, CSS, and JavaScript — no build step, no framework, no backend, no npm dependencies. It runs entirely in the browser, persists to `localStorage`, and is designed to be hosted as a static site on GitHub Pages. The UI language is French.

## Commands

There is no build, lint, or test tooling. Development is direct file editing.

- **Run locally (full features incl. PWA/service worker):**
  ```bash
  python -m http.server 8080
  ```
  then open `http://localhost:8080`. The service worker only registers over `http(s)`, so opening `index.html` via `file://` works for everything except the PWA/offline layer.
- **Deploy:** pushing to `main` triggers `.github/workflows/pages.yml`, which publishes the repository root to GitHub Pages. The whole repo *is* the deployable artifact — there is no output directory.

## Architecture

The entire application lives in three files at the repo root: `index.html` (static shell), `styles.css`, and `app.js` (~730 lines, all logic).

### Single-state, re-render-everything model
- One global `state` object (see `sampleState()` in `app.js`) holds everything: `trips[]`, `activeTripId`, `theme`, and `preferences`. Each trip nests its own `days`, `expenses`, `reservations`, `checklist`, and `resources`.
- `state` is loaded from `localStorage` under `STORAGE_KEY` on boot (`loadState()`), falling back to `sampleState()`. **Every mutation must call `saveState(msg?)`** to persist — there is no reactive layer; forgetting this loses the change on reload.
- Rendering is full-innerHTML replacement. Each page has a `render*()` function that rebuilds `#main-content` from `state`. There is no diffing and no component state — after mutating `state` you call `saveState()` then `renderPage()` (or `renderTripSelect()` when the trip list changes).

### Routing & events
- Hash-based routing: `currentPage` derives from `location.hash`; `renderPage()` dispatches to the matching `render*` function via the `renderers` map.
- **Event handling is fully delegated** in `bindGlobalEvents()` — a single document-level click listener reads `data-action`, `data-page`, `data-set-theme`, `data-remove-pref`, and `data-map-day` attributes. To add an interactive control, emit a `data-action="…"` attribute in the HTML string and add a matching `case` to the `switch` in `handleAction()`. Do **not** attach per-element listeners in render functions (they'd be wiped on the next re-render); the drag-and-drop rebind in `bindDragAndDrop()` is the deliberate exception, re-run after each itinerary render.

### Creation assistant (brief → stops → AI proposals pipeline)
- Each trip carries a **`brief`** (`{ mode, adults, children:[{age}], budgetMin, budgetMax, spirit:[] }`) and an ordered **`stops[]`** (`{ id, place, lat, lng, nights, lodgingType, comfort, lunchOut, dinnerOut, wantedActivities:[] }`). Both are defaulted by `normalizeBrief()` / `normalizeStop()` inside `normalizeState()`, so older saves and imports never crash.
- The **`#create` page** (`renderCreate()`) is a 4-step wizard driven by the module-level `currentStep`. Each step re-renders `#main-content`; steps 1/3/4 render an inline `<form id="step-form">` whose values are read back into `state` by `applyCreateStep(step)` **before** any step change (prev/next/jump) — mirror this "read-before-navigate" rule when adding steps, since re-rendering wipes unsaved inputs. Step 2 (stops) is list-based and mutates immediately via modals (`openStopForm()`), so it has no form to read.
- **Export for AI**: `buildBrief(trip)` serialises the `brief_v1` schema; `buildBriefPrompt()` wraps it in a ready-to-paste prompt that embeds the expected `propositions_v1` response schema (the manual JSON round-trip — no API key). `exportBrief()` downloads the JSON and copies the prompt. `generateSkeleton()` fills `days` locations/titles from stops **non-destructively** (existing day activities are preserved).
- Selection/import of AI `propositions_v1` and auto-checklist rules are planned later phases; keep additions additive so manual editing (Inspirations, day activities) always stays possible.

### Modals & forms
- All create/edit dialogs go through `openModal({ title, body, onSubmit })`. `body` is an HTML string usually assembled from the `inputField()` / `selectField()` / `textareaField()` helpers. On submit, `formDataObject(form)` turns the form into a plain object; the `onSubmit` handler is responsible for type coercion (e.g. `asNumber()`, `Number()`, checkbox `=== 'yes'`), mutating `state`, calling `saveState()`, `closeModal()`, and `renderPage()`.

### Key invariants
- **HTML is built by string concatenation**, so every user-supplied value interpolated into markup must pass through `esc()` to prevent injection. Follow this consistently when editing render functions.
- Days stay in sync with trip dates via `syncTripDays()` / `enumerateDates()`; editing a trip's `startDate`/`endDate` reconciles the `days` array by date key, preserving existing day content.
- IDs are generated with `uid(prefix)`; collections are edited in place and removed with `deleteById()`.

### External services (no API keys)
- **Leaflet + OpenStreetMap tiles** for the map (`initMap()`), loaded from the unpkg CDN in `index.html`.
- **Photon geocoding** (`https://photon.komoot.io`) for place search in `openGeocodeSearch()`.
- The service worker (`sw.js`) precaches only local core files; CDN assets and tiles are cached at runtime on first online fetch, so first-load-while-offline will lack the map.

## Data portability
Import/export is JSON of the whole `state` (`exportData()` / `importData()`). `importData()` replaces `state` wholesale after a shape check — treat imported files as the full source of truth, not a merge.

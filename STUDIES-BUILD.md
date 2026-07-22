# W3 — Scroll Studies build report

Date: 2026-07-22

## Result

Built the public Scroll Studies home and the five requested study pages. All shipped pages are standalone HTML files in `public/studies/`; their CSS, JavaScript, fonts where applicable, motion engine, WebGL renderer, and Worker source are inline. No build step or cross-file runtime import is required.

## Delivered

- `public/studies/index.html`
  - Byline-derived warm-paper chrome and five inline font faces.
  - Six-entry numbered ledger with titles, mechanic deks, palette swatches, and links.
  - Study 05 is marked `in production` and points at the clean route that the other worker will fill.
- `public/studies/study-01.html` — Type as progress.
- `public/studies/study-02.html` — Budgeted canvas.
- `public/studies/study-03.html` — One axis borrows another.
- `public/studies/study-04.html` — The scalar tells the truth.
- `public/studies/study-06.html` — Images, on time.
  - WebGL renderer and virtual scroll are inline.
  - Image Worker source is inline and launched from a Blob URL.
  - HUD, `N`/toggle naive mode, and `?stress=1` are preserved.
- Annotation mode on every study:
  - `A` and the 44 px `?` control both toggle it.
  - Every overlay has four short lines at most.
  - Values mirror the live progress, velocity, counters, density, frame time, upload, residency, and mode readouts already present in each study.
- Exact footer credit on every study: “Built with mander-motion — 373 lines, no dependencies.”

## Site wiring

- `next.config.js`
  - `/studies` → `/studies/index.html`
  - `/studies/:n(\d{2})` → `/studies/study-:n.html`
- `src/middleware.ts`
  - Clean and direct `/studies` paths are included in `inlineStaticPages`, including the pending Study 05 route.
- `public/byline.html`
  - Added one quiet `STUDIES` nav link immediately after `FIELD NOTES`.

## Verification

The repo dev server was started on `127.0.0.1:3017`. The host hit its file-watch descriptor ceiling with native watching, so verification used `WATCHPACK_POLLING=true`; the server then stayed ready.

Served responses:

| Route | Status | CSP |
| --- | ---: | --- |
| `/studies` | 200 | intentionally omitted |
| `/studies/01` | 200 | intentionally omitted |
| `/studies/02` | 200 | intentionally omitted |
| `/studies/03` | 200 | intentionally omitted |
| `/studies/04` | 200 | intentionally omitted |
| `/studies/06` | 200 | intentionally omitted |
| `/studies/index.html` | 200 | intentionally omitted |
| `/studies/study-01.html` | 200 | intentionally omitted |
| `/studies/study-06.html` | 200 | intentionally omitted |

Study 05 is intentionally not part of this worker's deliverables; `/studies/05` remains pending until its page lands from the other worker.

Runtime/contract checks:

- `npm run typecheck` — passed.
- Every inline script parsed successfully.
- The served pages were executed in a DOM runtime harness with Canvas, WebGL, Worker, media-query, and animation-frame surfaces stubbed. All five initialized with zero script errors and emitted:
  - `[mander-motion] booting Study 01 · typographic-pin`
  - `[mander-motion] booting Study 02 · canvas-interlude`
  - `[mander-motion] booting Study 03 · horizontal-gallery`
  - `[mander-motion] booting Study 04 · counter-finale`
  - `[mander-motion] booting Study 06 · texture-stream`
- `?` click and `A` key toggles passed on every study.
- Studies 01–04 were advanced to their end state and each reported progress `1.000`.
- Study 06 reported `stress=true` at `?stress=1`; its mode toggle switched to `naive`.
- Reduced-motion media state propagated to the full engine in Studies 01–04. Study 06 retains the source reduced-motion behavior for instant scroll/current alignment, zero velocity skew, and immediate texture swap.
- Each Study 01–04 file contains the complete transformed 373-line engine source, including touch handling.
- Each generated page reported zero external `src` or `href` requests.
- `git diff --check` — passed.

## Performance and visual limits

The ports retain the source performance constraints: one animation loop, frame-rate-independent interpolation, DPR capped at 2, transform/clip-based scene work, canvas lifecycle ownership, and Study 06's 2 ms upload submission budget with off-thread image work and bounded GPU residency.

The in-app browser backend was unavailable in this environment, so pixel output, real touch hardware, GPU upload timings, and a real browser-console capture were not claimed. The DOM harness confirms initialization and interaction wiring but does not replace orchestrator art direction or an on-device 60 fps/GPU check.

No analytics behavior was changed. Nothing was deployed or committed.

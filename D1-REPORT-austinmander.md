# D1 Report: Austinmander Share Metadata

Status: Complete

## Changes

- Updated `public/field-notes.html`.
  - Canonical: `https://austinmander.com/field-notes`
  - Open Graph image: `https://austinmander.com/og/field-notes.png`
  - Added Open Graph title, description, type, URL, image dimensions, and image alt text.
  - Added Twitter large image card, title, description, image, and image alt text.
- Updated `public/studies/index.html`.
  - Canonical: `https://austinmander.com/studies`
  - Open Graph image: `https://austinmander.com/og/studies.png`
  - Added Open Graph title, description, type, URL, image dimensions, and image alt text.
  - Added Twitter large image card, title, description, image, and image alt text.
  - Replaced the em dash in the document title and description with site-consistent punctuation.

The descriptions stay close to the existing page copy. No sales language or call to action was added.

## Head-Only and CSP Confirmation

- All page changes are inside `<head>` and are limited to metadata plus the studies document title.
- No inline scripts or styles were added or changed.
- `src/middleware.ts` was not changed.
- CSP-relevant existing state: each target page contains one pre-existing inline `<style>` tag and no `<script>` tag.
- The middleware already includes `/field-notes`, `/field-notes.html`, `/studies`, and `/studies/index.html` in `inlineStaticPages`, so its existing CSP exception remains untouched.

## Static Verification

- `git diff --check`: PASS
- Required canonical, Open Graph, and Twitter tags appear exactly once in each page head: PASS
- Canonical and `og:url` values match: PASS
- Open Graph and Twitter image URLs match the requested assets: PASS
- Open Graph dimensions are `1200` by `630`: PASS
- Twitter card type is `summary_large_image`: PASS
- Image alt metadata is present: PASS
- No em dash appears in either target page head: PASS
- Diff contains no added `<script>` or `<style>` tag: PASS
- Middleware diff is empty: PASS

## UNVERIFIED

- `public/og/field-notes.png` and `public/og/studies.png` do not exist yet. They were intentionally not created because the orchestrator renders them.
- Social card artwork, live deployment behavior, crawler cache behavior, and external social preview rendering are unverified.
- No browser, GUI app, or live social card validator was launched.

No commit was created.

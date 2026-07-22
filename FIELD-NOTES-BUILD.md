# Field Notes build

Built the new craft ledger at `/field-notes` as a self-contained static HTML page.

## Added

- A newest-first, four-entry editorial ledger covering the no-drone 3D ladder, viewer-side 3D bugs, the zero.university architecture port, and the one-shot cinematic probe.
- The exact Byline design tokens and five inlined font faces, with no CDN or runtime dependency.
- Four locally served lab receipts in `public/field-notes/`, each below 400KB, with intrinsic dimensions, useful alternative text, captions, and lazy loading.
- Responsive single-column behavior for small screens and a reduced-motion override.
- A `beforeFiles` rewrite from `/field-notes` to `/field-notes.html`.
- One `FIELD NOTES` link in the homepage masthead.

## Files touched

- `public/field-notes.html` (new)
- `public/field-notes/altitude-0250m.jpeg` (new)
- `public/field-notes/counter-finale.jpeg` (new)
- `public/field-notes/garden-ground.jpeg` (new)
- `public/field-notes/lego-quality-hero.jpeg` (new)
- `public/byline.html`
- `next.config.js`
- `FIELD-NOTES-BUILD.md` (new)

## Source and claim status

All factual copy and all displayed measurements trace to:

- `/Users/austin/Desktop/resort-3d-lab/LAB-NOTES.md`
- `/Users/austin/Desktop/capture-engine/content/field-notes-2026-07-21-labs-burn.md`

The Mip-NeRF 360 research-use wording and the Google imagery credit follow the supplied image-caption requirements. No unsupported public claims were added, so the page contains no unresolved `CLAIM CHECK` markers.

## Unverified items

- A final screenshot review at desktop and mobile widths remains for Austin. The in-app browser was unavailable and the local headless Chromium process was blocked by the macOS sandbox before launch.

## Verification completed

- `NEXT_TELEMETRY_DISABLED=1 npm run build` passed on Next.js 15.5.9.
- The built server returned HTTP 200 for `/field-notes` through the new rewrite and for the copied altitude image.
- Static assertions confirmed five font-face declarations identical to the Byline, four newest-first entries, four lazy-loaded images with intrinsic dimensions, all image files below 400KB, and the mobile/reduced-motion CSS safeguards.
- `git diff --check` passed.

No deployment or commit was performed.

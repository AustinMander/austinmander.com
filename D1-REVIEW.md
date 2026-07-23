# D1 Review: Austinmander Share Metadata

## VERDICT

**SHIP**

No in-scope defect was found in the metadata-only changes to the two HTML pages.

## FINDINGS

| Severity | File:line | What | Evidence | Fix |
| --- | --- | --- | --- | --- |
| None | — | No findings. | The checks below did not refute the builder's claims. | — |

## CHECKED

- Repository scope: before this review, the only modified tracked files were `public/field-notes.html` and `public/studies/index.html`; `D1-REPORT-austinmander.md` was untracked. `src/middleware.ts` had no diff.
- Head-only scope: for each target, removing the bytes between the existing opening and closing `head` tags from both `HEAD` and the working copy produced byte-identical documents. This verifies that the doctype, outer markup, body content, embedded assets, and all content outside `head` are untouched.
- Script and style scope: both the `HEAD` and working-copy versions of each page contain exactly one existing `style` tag and zero `script` tags. The diff adds or changes no `style` or `script` tag. The studies page's existing body-level inline style is byte-untouched.
- CSP interaction: `src/middleware.ts:168-190` includes `/field-notes`, `/field-notes.html`, `/studies`, and `/studies/index.html` in `inlineStaticPages` and omits the `Content-Security-Policy` header for those paths. Both the public and rewritten path forms are covered. The new canonical, Open Graph, Twitter, description, and title elements are inert metadata and introduce no CSP-controlled script or style execution.
- Canonicals: `https://austinmander.com/field-notes` and `https://austinmander.com/studies` use the configured production origin. `next.config.js` rewrites those extensionless paths to the corresponding static files, and trailing-slash mode is not enabled. Each canonical exactly matches its page's `og:url`.
- Image-path consistency: each page uses its required absolute HTTPS path consistently for both `og:image` and `twitter:image`: `/og/field-notes.png` for Field Notes and `/og/studies.png` for Scroll Studies. Both declare Open Graph dimensions of 1200 by 630 and supply image alt metadata.
- Field Notes description: the body identifies the page as “The Craft Ledger,” dates every entry, and covers design work, three-dimensional reconstruction and viewing experiments, and creative code. The metadata is a restrained summary of that content and makes no unsupported or promotional claim.
- Scroll Studies description: the wording closely paraphrases the existing series deck, “Small motion systems, isolated and instrumented. Each study begins with one mechanical claim,” and the seven listed studies support that framing. It contains no sales language or invented outcome.
- Voice and punctuation: the descriptions use direct, personal-craft language, name Austin Mander, contain no call to action, and contain no em dash. No em dash occurs anywhere in either changed head. Existing em dashes outside the heads are byte-untouched.
- Twitter completeness: both pages include one each of `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, and `twitter:image:alt`; the card type is `summary_large_image`.
- Open Graph completeness: both pages include one each of `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `og:image:width`, `og:image:height`, and `og:image:alt`; the type is `website`.
- Static hygiene: `git diff --check` passed.
- No browser or GUI application was launched.

## UNVERIFIABLE

- `public/og/field-notes.png` and `public/og/studies.png` are not present in the working tree. The builder report assigns their rendering to the orchestrator, so this review cannot verify the future files' actual dimensions, artwork, MIME type, accessibility-alt fidelity, or deployed URL responses.
- Live deployment routing, HTTP response metadata, crawler caches, and rendered previews on external social platforms were not tested.


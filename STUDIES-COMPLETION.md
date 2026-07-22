# F5 — Studies section completion

Status: complete. No deployment or commit was performed.

## Delivered

- Ported `motion-lab/studies/study-05/index.html` to `public/studies/study-05.html`.
- Ported `motion-lab/studies/study-07/index.html` to `public/studies/study-07.html`.
- Preserved Study 05's two procedural worlds, velocity-matched handoff, guided mode, continuity meter, and annotation mode.
- Preserved Study 07's authored autopilot, input handoff, recorder/takes shelf, take playback/export/rename controls, instruments, and annotation model.
- Added the Study 01 `mander—motion` masthead link pattern to both new pages, linking back to `/studies`. The new links inherit each study palette and expose a visible keyboard-focus outline.
- Published Study 05 on the index without its pending state and added Study 07 with the requested copy and navy/amber swatch. The series range now reads `01—07`.
- Added explicit Study 05 and 07 short rewrites. The generic two-digit rewrite continues to cover 01–07, with each destination resolving to its corresponding static HTML file.
- Added `/studies/07` and `/studies/study-07.html` to `inlineStaticPages`. All seven studies now have short and file-form CSP exemptions pairwise.

## Static mobile audit — 390px logical width

| Study | Viewport meta | Touch engine | Width check | Type check at 390px |
| --- | --- | --- | --- | --- |
| 01 | Pass | Pass | No fixed width over viewport | Fluid display type; micro furniture reaches 7.2px |
| 02 | Pass | Pass | No fixed width over viewport | Fluid display type; micro furniture reaches 7.2px |
| 03 | Pass | Pass | No fixed width over viewport | Fluid display type; micro furniture reaches 7.2px |
| 04 | Pass | Pass | No fixed width over viewport | Fluid display type; micro furniture reaches 7.2px |
| 05 | Pass | Pass | No fixed width over viewport | Altitude is about 70px; smallest instrument text is about 8.8px |
| 06 | Pass | Pass | No fixed width over viewport | Headline floor is 68px; credit/control furniture reaches 7–8px |
| 07 | Pass | Pass | No fixed width over viewport | Statement is about 51px; take/chart furniture reaches 7.8–8.8px |

Trivial fixes made:

- Study 07's long masthead help string now wraps within `9.5rem` below 800px so it does not compete with the shared back link.
- Study 05 and 07 back links inherit the local color palette and have visible focus styles.

Items requiring art direction rather than a trivial static fix:

- Instrument and credit furniture across the series intentionally uses 7–9px text at 390px. Raising those values consistently would change the established density and may require reflowing controls, so the existing sizes were retained for orchestrator review.
- On short-height mobile screens, Study 07's instrument and takes shelf can occupy a large portion of the viewport. A larger intervention would need a product decision such as a collapsible recorder or alternate mobile arrangement; it was left intact to preserve the take recorder.

## Wiring audit

Every study has all three required pieces:

| Study | Static file | Short route | CSP short + file pair |
| --- | --- | --- | --- |
| 01 | `study-01.html` | `/studies/01` | Pass |
| 02 | `study-02.html` | `/studies/02` | Pass |
| 03 | `study-03.html` | `/studies/03` | Pass |
| 04 | `study-04.html` | `/studies/04` | Pass |
| 05 | `study-05.html` | `/studies/05` | Pass |
| 06 | `study-06.html` | `/studies/06` | Pass |
| 07 | `study-07.html` | `/studies/07` | Pass |

All seven inline scripts also pass a JavaScript syntax parse.

## Verification

- `npm run build`: pass, exit 0.
- Next emitted non-blocking existing environment/toolchain warnings for the ESLint circular-config serializer and missing Redis URL; compilation, type checking, static generation, and trace collection completed.
- Development server: pass using Watchpack polling. Native file watching hit the host's `EMFILE` limit and restarted repeatedly, so the server was relaunched with `WATCHPACK_POLLING=true` for stable route verification.
- HTTP checks: all 16 routes returned 200.

```text
/studies                        200
/studies/index.html             200
/studies/01                     200
/studies/02                     200
/studies/03                     200
/studies/04                     200
/studies/05                     200
/studies/06                     200
/studies/07                     200
/studies/study-01.html          200
/studies/study-02.html          200
/studies/study-03.html          200
/studies/study-04.html          200
/studies/study-05.html          200
/studies/study-06.html          200
/studies/study-07.html          200
```

- `git diff --check`: pass.
- Visual/pixel review: intentionally not performed; orchestrator art-directs.

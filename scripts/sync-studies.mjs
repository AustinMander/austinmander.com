#!/usr/bin/env node
// Sync the motion-lab craft pieces into this site as self-contained static ports.
//
// Each piece in motion-lab is one directory holding index.html (fully inline, no
// CDN) plus NOTES.md (intent, decisions, verification). This script copies the
// passing ones into public/studies/<slug>/, writes the gallery at
// public/studies/index.html, and records a manifest at src/data/studies.json.
//
// It is also the publication GATE. A piece is held back, never silently altered,
// when it leaks an internal brief ID onto a visible surface, lacks NOTES.md, or
// references a file that cannot be resolved. Held pieces are reported with the
// reason so the fix is a deliberate edit in motion-lab, not a patch here.
//
//   node scripts/sync-studies.mjs            # sync from ../motion-lab
//   MOTION_LAB=/path/to/motion-lab node scripts/sync-studies.mjs
//   node scripts/sync-studies.mjs --check    # report only, write nothing

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  copyFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MOTION_LAB = resolve(
  process.env.MOTION_LAB ?? join(SITE_ROOT, "..", "motion-lab")
);
const OUT_DIR = join(SITE_ROOT, "public", "studies");
const MANIFEST = join(SITE_ROOT, "src", "data", "studies.json");
const CHECK_ONLY = process.argv.includes("--check");

// Brief IDs are derived from motion-lab/briefs/ filenames rather than guessed, so
// the gate tracks the real brief series instead of a hand-maintained pattern.
function briefIds() {
  const dir = join(MOTION_LAB, "briefs");
  if (!existsSync(dir)) return [];
  const ids = new Set();
  for (const name of readdirSync(dir)) {
    const m = /^([a-z]{1,3}\d{1,2})-/.exec(name);
    if (m) ids.add(m[1].toUpperCase());
  }
  return [...ids];
}

// Visible text only: drop every tag first so attribute values (SVG path data such
// as d="M2 11 C92..." ) cannot masquerade as a brief ID.
function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

// A piece can declare itself the featured entry, with a reason, using the same
// visible-marker pattern as GATE-ALLOW. Exactly one may claim it; a second is an
// error rather than a silent last-one-wins.
//   <!-- FEATURED: essay reason: long form, read this first -->
function featureMarker(html) {
  const m = /<!--\s*FEATURED:\s*(\w+)\s+reason:\s*([^>]*?)\s*-->/i.exec(html);
  if (!m) return null;
  const reason = m[2].trim();
  return reason ? { kind: m[1].toLowerCase(), reason } : { kind: m[1].toLowerCase(), reason: "" };
}

function documentTitle(html) {
  const m = /<title>([\s\S]*?)<\/title>/i.exec(html);
  return m ? m[1].trim() : "";
}

// Assets the piece needs alongside it. Only src, because an href is a link to
// somewhere else on the site, not a file that has to travel with the piece.
// Conflating the two held a piece for linking to its own sibling study.
function assetRefs(html) {
  const refs = new Set();
  for (const m of html.matchAll(/\bsrc="([^"]+)"/gi)) {
    const v = m[1].trim();
    if (!v || /^(https?:|data:|mailto:|tel:|#|\/\/)/i.test(v)) continue;
    refs.add(v);
  }
  return [...refs];
}

// Site-internal links, so the gate can enforce the house rule that every route
// referenced actually exists. A link to a held piece is a 404 on a public page.
function internalLinks(html) {
  const links = new Set();
  for (const m of html.matchAll(/\bhref="(\/[^"]*)"/gi)) {
    const v = m[1].trim().split(/[?#]/)[0];
    if (v) links.add(v);
  }
  return [...links];
}

// Title and intent come from NOTES.md, which every piece carries and which reads
// better than the HTML <title>.
function readNotes(dir) {
  const path = join(dir, "NOTES.md");
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  const heading = /^#\s+(.+)$/m.exec(raw);
  const title = heading ? heading[1].trim() : "";

  let intent = "";
  const intentSection = /^##\s+Intent\s*$/im.exec(raw);
  const body = intentSection
    ? raw.slice(intentSection.index + intentSection[0].length)
    : raw.replace(/^#\s+.+$/m, "");
  for (const block of body.split(/\n{2,}/)) {
    const t = block.trim();
    if (
      !t ||
      t.startsWith("#") ||
      t.startsWith("-") ||
      t.startsWith("|") ||
      t.startsWith("```")
    )
      continue;
    intent = t.replace(/\s+/g, " ");
    break;
  }
  return { title, intent };
}

// House rule: no em dashes in shipped copy. The notes are markdown, so inline
// code ticks and emphasis markers have to come off too, or they render as
// literal punctuation on the gallery card.
function houseCopy(s) {
  return s
    .replace(/\s*—\s*/g, " / ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
}

function displayTitle(kind, slug, notesTitle, htmlTitle) {
  const source = notesTitle || htmlTitle || slug;
  // Studies are a numbered public series. Normalise them, because study-10's
  // notes heading omits the number the other four carry.
  if (kind === "study") {
    const n = /study-(\d+)/.exec(slug)?.[1];
    const name = source.includes("/") ? source.split("/").pop().trim() : source;
    return houseCopy(n ? `Study ${n} / ${name}` : name);
  }
  return houseCopy(source);
}

function discover() {
  const groups = [
    {
      kind: "study",
      dir: join(MOTION_LAB, "studies"),
      match: (n) => /^study-\d+$/.test(n),
    },
    { kind: "artefact", dir: join(MOTION_LAB, "artefacts"), match: () => true },
  ];
  const pieces = [];
  for (const g of groups) {
    if (!existsSync(g.dir)) continue;
    for (const name of readdirSync(g.dir).sort()) {
      const dir = join(g.dir, name);
      if (!statSync(dir).isDirectory() || !g.match(name)) continue;
      if (!existsSync(join(dir, "index.html"))) continue;
      pieces.push({ kind: g.kind, slug: name, dir });
    }
  }
  return pieces;
}

function gate(piece, ids) {
  const html = readFileSync(join(piece.dir, "index.html"), "utf8");
  const reasons = [];

  const notes = readNotes(piece.dir);
  if (!notes)
    reasons.push(
      "no NOTES.md (every published piece must carry its reasoning)"
    );

  // A piece may declare an exception, but never a silent one. The marker is
  // honoured only with a stated reason, and every allowance is recorded in the
  // manifest, so a waived rule stays visible instead of looking like a pass.
  //   <!-- GATE-ALLOW: M2 reason: the subject of the study, not a leak -->
  const allowances = [];
  for (const m of html.matchAll(
    /<!--\s*GATE-ALLOW:\s*([A-Za-z0-9]+)\s+reason:\s*([^>]*?)\s*-->/gi
  )) {
    const id = m[1].toUpperCase();
    const reason = m[2].trim();
    if (!reason) {
      reasons.push(`GATE-ALLOW for ${id} has no stated reason`);
      continue;
    }
    allowances.push({ id, reason });
  }
  const allowed = new Set(allowances.map((a) => a.id));

  // Brief-ID leak: check the document title and the visible text, plus the notes
  // title and intent. Those two are rendered into the gallery card, so scanning
  // only index.html would let an ID reach a public surface unchecked.
  const haystack = [
    documentTitle(html),
    visibleText(html),
    notes?.title ?? "",
    notes?.intent ?? "",
  ].join(" \n ");
  const leaked = ids.filter(
    (id) => !allowed.has(id) && new RegExp(`\\b${id}\\b`).test(haystack)
  );
  if (leaked.length) {
    reasons.push(`internal brief ID visible on the page: ${leaked.join(", ")}`);
  }

  // An allowance that no longer matches anything is stale. Say so, so waivers
  // cannot quietly outlive the thing they were granted for.
  for (const a of allowances) {
    if (!new RegExp(`\\b${a.id}\\b`).test(haystack)) {
      reasons.push(
        `GATE-ALLOW for ${a.id} is stale (that ID is not on the page)`
      );
    }
  }

  // Asset references must resolve to a sibling file we can copy alongside.
  const assets = [];
  for (const ref of assetRefs(html)) {
    const clean = ref.split(/[?#]/)[0];
    const local = join(piece.dir, clean.replace(/^\.?\//, ""));
    if (clean.startsWith("/") || !existsSync(local)) {
      reasons.push(
        `unresolved asset reference "${ref}" (needs a build step, not a copy)`
      );
    } else {
      assets.push(clean.replace(/^\.?\//, ""));
    }
  }

  const links = internalLinks(html);

  const feature = featureMarker(html);
  if (feature && !feature.reason) {
    reasons.push("FEATURED marker has no stated reason");
  }

  return { html, notes, assets, links, reasons, allowances, feature };
}

// Pieces are served at an extensionless URL, /studies/<slug>, so a relative
// src="engine.js" resolves to /studies/engine.js and 404s. Copying the sibling
// was not enough: the file was reachable, the page was not able to reach it.
// Inlining at publish time makes the published piece genuinely self-contained,
// which is the house rule anyway, while the source keeps its separate modules so
// they stay testable outside a browser.
function inlineAssets(html, dir) {
  let out = html;
  out = out.replace(
    /<script\b([^>]*)\bsrc="([^"]+)"([^>]*)>\s*<\/script>/gi,
    (whole, before, ref, after) => {
      if (/^(https?:|data:|\/\/|\/)/i.test(ref)) return whole;
      const file = join(dir, ref.split(/[?#]/)[0].replace(/^\.?\//, ""));
      if (!existsSync(file)) return whole;
      // Carry type through. Dropping type="module" would silently change the
      // script's semantics, which is a worse failure than not inlining at all.
      const type = /\btype="([^"]+)"/i.exec(before + after);
      const attr = type ? ` type="${type[1]}"` : "";
      const js = readFileSync(file, "utf8").replace(/<\/script>/gi, "<\\/script>");
      return `<script${attr}>\n/* inlined from ${ref} at publish time */\n${js}\n</script>`;
    },
  );
  out = out.replace(
    /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/gi,
    (whole, ref) => {
      if (/^(https?:|data:|\/\/|\/)/i.test(ref)) return whole;
      const file = join(dir, ref.split(/[?#]/)[0].replace(/^\.?\//, ""));
      if (!existsSync(file)) return whole;
      return `<style>\n/* inlined from ${ref} at publish time */\n${readFileSync(file, "utf8")}\n</style>`;
    },
  );
  return out;
}

function renderGallery(published) {
  const hero = published.find((p) => p.feature) || null;
  const rest = published.filter((p) => p !== hero);

  const featured = hero
    ? `    <a class="lede-piece reveal" href="${hero.href}">
      ${hero.thumb ? `<img class="lede-piece__shot" src="${hero.thumb}" alt="" width="1200" height="675" loading="eager">` : ""}
      <div class="lede-piece__body">
        <span class="lede-piece__kind">${escapeHtml(hero.feature.kind)}</span>
        <h2 class="lede-piece__title">${escapeHtml(hero.title)}</h2>
        <p class="lede-piece__intent">${escapeHtml(hero.intent)}</p>
        <span class="lede-piece__go">Read it</span>
      </div>
    </a>`
    : "";

  const cards = rest
    .map(
      (p) => `      <li class="piece reveal">
        <a class="piece__link" href="/studies/${p.slug}">
          <span class="piece__kind">${p.kind === "study" ? "Study" : "Artefact"}</span>
          <h2 class="piece__title">${escapeHtml(p.title)}</h2>
          <p class="piece__intent">${escapeHtml(p.intent)}</p>
        </a>
      </li>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Studies / Austin Mander</title>
<meta name="description" content="Scroll studies and craft artefacts. Each piece ships with the reasoning behind it and the checks it passed.">
<style>
:root{
  --ground:#f7f4ed; --panel:#efeadf; --line:#c9c2b2; --line-soft:#ddd6c7;
  --text:#191714; --muted:#4a4640; --faint:#6b6659; --accent:#c14f1d;
  --display:"Fraunces",georgia,serif; --body:"Source Serif 4",georgia,serif;
  --mono:"IBM Plex Mono","SF Mono",monospace; --pad:clamp(20px,4.5vw,64px);
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--text);font-family:var(--body);
  font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
.wrap{max-width:1040px;margin:0 auto;padding:var(--pad)}
.brand{display:inline-block;margin-bottom:28px;font-family:var(--display);font-size:19px;
  font-weight:600;color:var(--text);text-decoration:none}
.brand:hover{color:var(--accent)}
.brand:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.brand .dot{color:var(--accent)}
header{border-bottom:1px solid var(--line);padding-bottom:28px;margin-bottom:40px}
.eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--accent);margin:0 0 12px}
h1{font-family:var(--display);font-size:clamp(34px,6vw,56px);line-height:1.05;
  margin:0 0 14px;font-weight:600}
.lede{margin:0;max-width:62ch;color:var(--muted)}
/* The featured entry. Different format, so it gets a different shape rather than
   being the first of thirteen equal cards. */
.lede-piece{display:grid;grid-template-columns:1fr;gap:0;margin:0 0 44px;
  border:1px solid var(--line-soft);background:var(--panel);text-decoration:none;color:inherit;
  transition:border-color .18s ease}
@media (min-width:820px){.lede-piece{grid-template-columns:1.1fr 1fr;align-items:stretch}}
.lede-piece:hover,.lede-piece:focus-visible{border-color:var(--accent)}
.lede-piece:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.lede-piece__shot{display:block;width:100%;height:100%;max-height:340px;object-fit:cover;
  object-position:left top;border-bottom:1px solid var(--line-soft)}
@media (min-width:820px){.lede-piece__shot{border-bottom:0;border-right:1px solid var(--line-soft)}}
.lede-piece__body{padding:clamp(22px,3vw,34px);display:flex;flex-direction:column;justify-content:center}
.lede-piece__kind{font-family:var(--mono);font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--accent)}
.lede-piece__title{font-family:var(--display);font-size:clamp(26px,3.4vw,40px);line-height:1.08;
  margin:12px 0 14px;font-weight:600}
.lede-piece__intent{margin:0;color:var(--muted);font-size:16px;
  display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.lede-piece__go{margin-top:18px;font-family:var(--mono);font-size:12px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--accent)}

.pieces{list-style:none;margin:0;padding:0;display:grid;gap:20px;
  grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.piece__link{display:block;height:100%;padding:24px;background:var(--panel);
  border:1px solid var(--line-soft);text-decoration:none;color:inherit;
  transition:border-color .18s ease,transform .18s ease}
.piece__link:hover,.piece__link:focus-visible{border-color:var(--accent);transform:translateY(-2px)}
.piece__link:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.piece__kind{font-family:var(--mono);font-size:11px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--faint)}
.piece__title{font-family:var(--display);font-size:22px;line-height:1.2;
  margin:10px 0 10px;font-weight:600}
.piece__intent{margin:0;font-size:15px;color:var(--muted);
  display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
footer{margin-top:56px;padding-top:24px;border-top:1px solid var(--line);
  font-family:var(--mono);font-size:12px;color:var(--faint)}
a.home{color:var(--accent)}

/* Reveal on enter. The durations are deliberately mismatched: a 900ms fade
   against a 700ms travel, so the element arrives in place before it has
   finished fading and settles rather than drifts. Matching them is what makes
   most implementations of this read floaty. Values measured from a captured
   production page rather than invented. */
:root{--rise:30px;--fade:.9s;--travel:.7s;--stagger:150ms;
  --ease:cubic-bezier(.2,.6,.2,1)}
/* Only hide anything once the script has confirmed it can show it again. With
   JS off or broken, nothing is invisible. */
.js .reveal{opacity:0;transform:translateY(var(--rise));
  transition:opacity var(--fade) var(--ease),transform var(--travel) var(--ease);
  transition-delay:calc(var(--i,0) * var(--stagger))}
.js .reveal.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){
  .piece__link{transition:none}
  .js .reveal{opacity:1;transform:none;transition:none}
}
</style>
</head>
<body>
<div class="wrap">
  <a class="brand" href="/">Austin Mander<span class="dot">.</span></a>
  <header>
    <p class="eyebrow reveal">Craft ledger</p>
    <h1>Studies</h1>
    <p class="lede">Scroll studies and craft artefacts, each one a single self-contained page with no
      dependencies and no external requests. Every piece carries the reasoning behind it and the
      checks it passed before it shipped.</p>
  </header>
  <main>
${featured}
    <ul class="pieces">
${cards}
    </ul>
  </main>
  <footer>
    <p>${published.length} pieces published. <a class="home" href="/">Return home</a></p>
  </footer>
</div>
<script>
(function () {
  "use strict";
  var doc = document.documentElement;
  // Claim the hidden state only now that we can definitely undo it.
  doc.classList.add("js");

  var items = [].slice.call(document.querySelectorAll(".reveal"));
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showAll() { items.forEach(function (el) { el.classList.add("in"); }); items = []; }
  if (reduced) return showAll();

  // Stagger per row rather than in document order, so a wide row lights up
  // together instead of sweeping left to right like a wave.
  var rows = {};
  items.forEach(function (el) {
    var top = Math.round(el.getBoundingClientRect().top + window.scrollY);
    (rows[top] = rows[top] || []).push(el);
  });
  Object.keys(rows).forEach(function (top) {
    rows[top].forEach(function (el, i) { el.style.setProperty("--i", i); });
  });

  // Reveal anything that has reached the bottom of the viewport, INCLUDING
  // anything already scrolled past. An IntersectionObserver alone leaves those
  // hidden forever: jump to the bottom of the page, or flick hard on a phone,
  // and every element you skipped never intersects and never appears.
  function show(el) {
    el.style.willChange = "opacity, transform";
    el.classList.add("in");
    // Release the compositor hint afterwards rather than leaving every element
    // promoted for the life of the page.
    setTimeout(function () { el.style.willChange = "auto"; }, 1200);
  }

  var ticking = false;
  function check() {
    ticking = false;
    var fold = window.innerHeight * 0.92;
    var remaining = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].getBoundingClientRect().top < fold) show(items[i]);
      else remaining.push(items[i]);
    }
    items = remaining;
    if (!items.length) {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    }
  }
  function queue() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(check);
  }

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  check();
})();
</script>
</body>
</html>
`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function main() {
  if (!existsSync(MOTION_LAB)) {
    console.error(`motion-lab not found at ${MOTION_LAB}`);
    console.error(
      "Set MOTION_LAB to its path. The committed ports still build without it."
    );
    process.exit(1);
  }

  const ids = briefIds();
  const pieces = discover();
  const published = [];
  const held = [];

  for (const piece of pieces) {
    const { html, notes, assets, links, reasons, allowances, feature } = gate(piece, ids);
    // A featured piece keeps its own title. The "Study NN /" normalisation is for
    // the numbered craft series and would bury an essay inside it.
    const title = feature
      ? houseCopy(notes?.title || documentTitle(html) || piece.slug)
      : displayTitle(piece.kind, piece.slug, notes?.title, documentTitle(html));

    if (reasons.length) {
      held.push({ slug: piece.slug, kind: piece.kind, title, reasons });
      continue;
    }

    published.push({
      slug: piece.slug,
      kind: piece.kind,
      title,
      intent: houseCopy(notes.intent),
      // No trailing slash: Next 308-redirects /studies/<slug>/ to this form, and
      // linking straight to it avoids a redirect on every click from the gallery.
      href: `/studies/${piece.slug}`,
      bytes: Buffer.byteLength(html),
      assets,
      links,
      allowances,
      feature,
      // Referenced from the gallery with an absolute path, because the gallery
      // and the piece sit at different URL depths and a relative one would break.
      thumb: existsSync(join(piece.dir, "thumb.png"))
        ? `/studies/${piece.slug}/thumb.png`
        : null,
    });

    if (!CHECK_ONLY) {
      const dest = join(OUT_DIR, piece.slug);
      rmSync(dest, { recursive: true, force: true });
      mkdirSync(dest, { recursive: true });
      writeFileSync(join(dest, "index.html"), inlineAssets(html, piece.dir));
      // The thumbnail is not referenced by the piece itself, so the asset walk
      // below never sees it. Copy it explicitly or the gallery card 404s.
      if (existsSync(join(piece.dir, "thumb.png"))) {
        copyFileSync(join(piece.dir, "thumb.png"), join(dest, "thumb.png"));
      }
      for (const asset of assets) {
        const to = join(dest, asset);
        mkdirSync(dirname(to), { recursive: true });
        copyFileSync(join(piece.dir, asset), to);
      }
    }
  }

  // House rule: every route a published page links to must actually exist. This
  // runs after the loop because a piece can only be checked against the final
  // published set, and a link to a HELD piece is a 404 on a public page. Done as
  // one pass, not a cascade: if removing a piece breaks another piece's link,
  // that surfaces on the next run rather than silently unravelling this one.
  const publishedSlugs = new Set(published.map((p) => p.slug));
  const brokenLinks = [];
  for (const p of published) {
    for (const link of p.links || []) {
      const m = /^\/studies\/([^/]+)\/?$/.exec(link);
      if (!m || m[1] === "index.html") continue;
      if (!publishedSlugs.has(m[1])) {
        brokenLinks.push({ slug: p.slug, link });
      }
    }
  }
  for (const b of brokenLinks) {
    const i = published.findIndex((p) => p.slug === b.slug);
    if (i === -1) continue;
    const [pulled] = published.splice(i, 1);
    publishedSlugs.delete(pulled.slug);
    held.push({
      slug: pulled.slug,
      kind: pulled.kind,
      title: pulled.title,
      reasons: [`links to "${b.link}", which is not published, so it would 404`],
    });
  }

  if (!CHECK_ONLY) {
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(join(OUT_DIR, "index.html"), renderGallery(published));
    mkdirSync(dirname(MANIFEST), { recursive: true });
    writeFileSync(
      MANIFEST,
      JSON.stringify(
        { source: basename(MOTION_LAB), published, held },
        null,
        2
      ) + "\n"
    );
  }

  console.log(`\nPublished ${published.length}:`);
  for (const p of published) {
    console.log(`  ${p.slug.padEnd(22)} ${p.title}`);
    for (const a of p.allowances) {
      console.log(`      waived ${a.id}: ${a.reason}`);
    }
  }
  if (held.length) {
    console.log(`\nHeld ${held.length} (fix in motion-lab, then re-run):`);
    for (const h of held) {
      console.log(`  ${h.slug}`);
      for (const r of h.reasons) console.log(`      ${r}`);
    }
  }
  console.log(
    CHECK_ONLY
      ? "\nCheck only. Nothing written."
      : `\nWrote ${OUT_DIR} and ${MANIFEST}`
  );

  if (published.length === 0) {
    console.error(
      "\nNothing passed the gate. Refusing to publish an empty gallery."
    );
    process.exit(1);
  }
}

main();

/* Quote Assurance: the deterministic core.
 *
 * Implements the seven checks and the fixed verdict policy from
 * prd-quote-assurance-demo.md sections 5.3 to 6.1. Kept apart from the
 * interface on purpose: the checks are the product, the interface only shows
 * them, and a check that can only be exercised by clicking is a check nobody
 * can test.
 *
 * SYNTHETIC DEMONSTRATION DATA. Not a real client quote, supplier price or
 * completed job. The rates are plausible, not market truth.
 */

const POLICY = {
  policyVersion: "QA-POL-001-V1",
  maxAgeDays: 90,
  targetGrossMarginBps: 2200, // 22%
  evaluationDate: "2026-07-25",
  // Standard items the contractor puts on every job, per the versioned policy.
  standards: [
    { id: "STD-MOB", label: "Mobilisation allowance" },
    { id: "STD-TEST", label: "Testing and certification" },
    { id: "STD-OM", label: "O&M manuals" },
    { id: "STD-ASBUILT", label: "As-built drawings" },
  ],
};

/* Price book. ageDays is measured from sourceEffectiveAt to the fixed
 * evaluation date, so the fixture is stable rather than drifting with today. */
const PRICE_BOOK = {
  "PB-LGT-001-V2": { desc: "LED panel 600x600 recessed, supply and fix", unit: "nr", cost: 6540, ageDays: 12 },
  "PB-LGT-002-V2": { desc: "Emergency luminaire, 3hr maintained, supply and fix", unit: "nr", cost: 8360, ageDays: 12 },
  "PB-PWR-001-V3": { desc: "Twin switched socket outlet, flush, supply and fix", unit: "nr", cost: 5170, ageDays: 31 },
  "PB-DAT-001-V2": { desc: "Cat6 data outlet, supply, install and test", unit: "nr", cost: 4410, ageDays: 31 },
  // Current records, used by the clean baseline.
  "PB-DIS-001-V2": { desc: "Distribution board, 12 way TP&N, supply and install", unit: "nr", cost: 96800, ageDays: 18 },
  "PB-CAB-003-V2": { desc: "SWA cable 4mm 3 core, clipped direct", unit: "m", cost: 924, ageDays: 24 },
  // Superseded records. These exist so a quote can be caught still using them,
  // and they are deliberately NOT in the baseline: if every quote carried a
  // stale rate the clean controls could never pass, and a checker that flags
  // everything scores 100% on catches while being worthless.
  "PB-DIS-001-V1": { desc: "Distribution board, 12 way TP&N, supply and install", unit: "nr", cost: 94200, ageDays: 80 },
  "PB-CAB-003-V1": { desc: "SWA cable 4mm 3 core, clipped direct", unit: "m", cost: 851, ageDays: 212 },
  "PB-CAB-007-V2": { desc: "LSF singles in containment, second fix", unit: "m", cost: 365, ageDays: 24 },
  "PB-CON-001-V2": { desc: "Cable basket 300mm, supply and install", unit: "m", cost: 1862, ageDays: 24 },
  "PB-FIR-001-V2": { desc: "Fire alarm detector point, addressable", unit: "nr", cost: 7300, ageDays: 40 },
  "PB-TST-001-V2": { desc: "Testing, certification and commissioning", unit: "item", cost: 110200, ageDays: 18 },
  "PB-MOB-001-V2": { desc: "Mobilisation, welfare and site setup", unit: "item", cost: 64600, ageDays: 18 },
  "PB-OM-001-V2": { desc: "O&M manuals and as-built drawings", unit: "item", cost: 48400, ageDays: 18 },
};

/* Job schedule. The canonical required scope for this job. */
const SCHEDULE = {
  scheduleVersion: "SCH-E-2026-014-V1",
  floorAreaM2: 1240,
  poweredPoints: 94,
  conditionTag: "OCCUPIED_OUT_OF_HOURS",
  jobClass: "OFFICE_FITOUT",
  rows: [
    { id: "SCH-E-001", scope: "LIGHTING", requirement: "86 nr LED panels to open plan and cellular offices" },
    { id: "SCH-E-002", scope: "EMERGENCY_LIGHTING", requirement: "14 nr emergency luminaires to escape routes, BS 5266" },
    { id: "SCH-E-003", scope: "SMALL_POWER", requirement: "62 nr twin sockets to desk positions and welfare" },
    { id: "SCH-E-004", scope: "DATA", requirement: "94 nr Cat6 outlets, tested and certified" },
    { id: "SCH-E-005", scope: "DISTRIBUTION", requirement: "2 nr 12 way TP&N boards, second floor risers" },
    { id: "SCH-E-006", scope: "CONTAINMENT", requirement: "225 m cable basket at high level throughout" },
    { id: "SCH-E-007", scope: "FIRE_ALARM", requirement: "22 nr addressable detector points, BS 5839 L2" },
    { id: "SCH-E-008", scope: "TEST_CERT", requirement: "Full test, certification and commissioning, BS 7671" },
  ],
};

/* Completed comparable jobs, used only for the quantity cohort. */
const PAST_JOBS = [
  { id: "JOB-2025-081", jobClass: "OFFICE_FITOUT", conditionTag: "OCCUPIED_OUT_OF_HOURS", floorAreaM2: 1180, poweredPoints: 88, cableM: 812 },
  { id: "JOB-2025-104", jobClass: "OFFICE_FITOUT", conditionTag: "OCCUPIED_OUT_OF_HOURS", floorAreaM2: 1310, poweredPoints: 101, cableM: 967 },
  { id: "JOB-2026-006", jobClass: "OFFICE_FITOUT", conditionTag: "OCCUPIED_OUT_OF_HOURS", floorAreaM2: 1225, poweredPoints: 92, cableM: 881 },
  { id: "JOB-2026-011", jobClass: "OFFICE_FITOUT", conditionTag: "OCCUPIED_OUT_OF_HOURS", floorAreaM2: 1402, poweredPoints: 110, cableM: 1043 },
  // Deliberately outside the +/-25% floor area band, so it must be excluded.
  { id: "JOB-2025-039", jobClass: "OFFICE_FITOUT", conditionTag: "VACANT_POSSESSION", floorAreaM2: 420, poweredPoints: 31, cableM: 240 },
];

/* ---- the base draft ----------------------------------------------------- */

const BASE_LINES = [
  { id: "L01", scope: "LIGHTING", desc: "LED panel 600x600 recessed", qty: 86, unit: "nr", rateId: "PB-LGT-001-V2" },
  { id: "L02", scope: "EMERGENCY_LIGHTING", desc: "Emergency luminaire, 3hr maintained", qty: 14, unit: "nr", rateId: "PB-LGT-002-V2" },
  { id: "L03", scope: "SMALL_POWER", desc: "Twin switched socket outlet, flush", qty: 62, unit: "nr", rateId: "PB-PWR-001-V3" },
  { id: "L04", scope: "DATA", desc: "Cat6 data outlet, supply, install and test", qty: 94, unit: "nr", rateId: "PB-DAT-001-V2" },
  { id: "L05", scope: "DISTRIBUTION", desc: "Distribution board, 12 way TP&N", qty: 2, unit: "nr", rateId: "PB-DIS-001-V2" },
  { id: "L06", scope: "CONTAINMENT", desc: "Cable basket 300mm at high level", qty: 225, unit: "m", rateId: "PB-CON-001-V2" },
  { id: "L07", scope: "CABLING", desc: "LSF singles in containment, second fix", qty: 890, unit: "m", rateId: "PB-CAB-007-V2" },
  { id: "L08", scope: "CABLING", desc: "SWA 4mm 3 core sub main", qty: 50, unit: "m", rateId: "PB-CAB-003-V2" },
  { id: "L09", scope: "FIRE_ALARM", desc: "Fire alarm detector point, addressable", qty: 22, unit: "nr", rateId: "PB-FIR-001-V2" },
  { id: "L10", scope: "TEST_CERT", desc: "Test, certification and commissioning", qty: 1, unit: "item", rateId: "PB-TST-001-V2", standard: "STD-TEST" },
  { id: "L11", scope: "PRELIMS", desc: "Mobilisation, welfare and site setup", qty: 1, unit: "item", rateId: "PB-MOB-001-V2", standard: "STD-MOB" },
  { id: "L12", scope: "HANDOVER", desc: "O&M manuals and as-built drawings", qty: 1, unit: "item", rateId: "PB-OM-001-V2", standard: "STD-OM,STD-ASBUILT" },
];

function clone(x) { return JSON.parse(JSON.stringify(x)); }
function withoutScope(scope) { return BASE_LINES.filter((l) => l.scope !== scope).map(clone); }
function withoutLine(id) { return BASE_LINES.filter((l) => l.id !== id).map(clone); }
function patched(id, patch) {
  return BASE_LINES.map((l) => (l.id === id ? Object.assign(clone(l), patch) : clone(l)));
}

/* Ten quotes. Each declares its own condition so the scoreboard can score the
 * checker against what was seeded, rather than against what it found. */
const QUOTES = [
  { id: "QA-Q-001", title: "Clean control", condition: "Clean control, one line per scope item",
    expected: "SEND", scheduleVersion: SCHEDULE.scheduleVersion, marginBps: 2400,
    lines: BASE_LINES.map(clone), exclusions: ["Builders work in connection", "Fire stopping by others"] },

  { id: "QA-Q-002", title: "Missing containment", condition: "Required containment scope absent",
    expected: "HOLD", scheduleVersion: SCHEDULE.scheduleVersion, marginBps: 2400,
    lines: withoutScope("CONTAINMENT"), exclusions: ["Builders work in connection"] },

  { id: "QA-Q-003", title: "Stale rate", condition: "SWA priced from a 212 day old price book record",
    expected: "HOLD", scheduleVersion: SCHEDULE.scheduleVersion, marginBps: 2400,
    lines: patched("L08", { rateId: "PB-CAB-003-V1" }), exclusions: ["Builders work in connection"] },

  { id: "QA-Q-004", title: "Quantity outlier", condition: "1,800 m cable against 94 points and the cohort median",
    expected: "HOLD", scheduleVersion: SCHEDULE.scheduleVersion, marginBps: 2400,
    lines: patched("L07", { qty: 1800 }), exclusions: ["Builders work in connection"] },

  { id: "QA-Q-005", title: "Margin below target", condition: "Direct cost 28,000, sell 32,000, 12.5% against a 22% target",
    expected: "HOLD", scheduleVersion: SCHEDULE.scheduleVersion, sellOverridePence: 3200000, costOverridePence: 2800000,
    lines: BASE_LINES.map(clone), exclusions: ["Builders work in connection"] },

  { id: "QA-Q-006", title: "Internal contradiction", condition: "Testing included in scope and excluded in exclusions",
    expected: "HOLD", scheduleVersion: SCHEDULE.scheduleVersion, marginBps: 2400,
    lines: BASE_LINES.map(clone),
    exclusions: ["Builders work in connection", "Testing and certification by others"] },

  { id: "QA-Q-007", title: "Missing standard item", condition: "No mobilisation allowance although the policy requires one",
    expected: "HOLD", scheduleVersion: SCHEDULE.scheduleVersion, marginBps: 2400,
    lines: withoutLine("L11"), exclusions: ["Builders work in connection"] },

  { id: "QA-Q-008", title: "Nothing to check against", condition: "No schedule reference and one custom item with no rate source",
    expected: "HOLD", scheduleVersion: null, marginBps: 2400,
    lines: BASE_LINES.map(clone).concat([
      { id: "L13", scope: "CUSTOM", desc: "Custom control interface, bespoke", qty: 1, unit: "item", rateId: null, sellPence: 750000 },
    ]),
    exclusions: ["Builders work in connection"] },

  { id: "QA-Q-009", title: "Clean control, reordered", condition: "Same complete scope, grouped differently, 23% margin",
    expected: "SEND", scheduleVersion: SCHEDULE.scheduleVersion, marginBps: 2300,
    lines: BASE_LINES.map(clone).reverse(), exclusions: ["Fire stopping by others"] },

  { id: "QA-Q-010", title: "Near stale", condition: "Distribution board rate 80 days old against a 90 day maximum",
    expected: "REVIEW", scheduleVersion: SCHEDULE.scheduleVersion, marginBps: 2400,
    lines: patched("L05", { rateId: "PB-DIS-001-V1" }), exclusions: ["Builders work in connection"] },
];

/* ---- money -------------------------------------------------------------- */

function lineCostPence(line) {
  if (line.rateId === null) return null;             // unpriceable, on purpose
  const rate = PRICE_BOOK[line.rateId];
  if (!rate) return null;
  return Math.round(rate.cost * line.qty);
}

function quoteTotals(quote) {
  let cost = 0;
  let incomplete = false;
  const unpriceable = [];
  for (const l of quote.lines) {
    const c = lineCostPence(l);
    if (c === null) { incomplete = true; unpriceable.push(l.id); continue; }
    cost += c;
  }
  if (quote.costOverridePence !== undefined) cost = quote.costOverridePence;
  const sell = quote.sellOverridePence !== undefined
    ? quote.sellOverridePence
    : Math.round(cost / (1 - quote.marginBps / 10000));
  return { costPence: cost, sellPence: sell, incomplete, unpriceable };
}

const gbp = (pence) =>
  "£" + (pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---- the seven checks --------------------------------------------------- */

function result(check, status, severity, reasonCode, summary, extra) {
  return Object.assign(
    { check, status, severity, reasonCode, summary, evidence: [], affectedLineIds: [], remediation: "" },
    extra || {}
  );
}

function checkScopeCoverage(quote) {
  if (!quote.scheduleVersion) {
    return result("SCOPE_COVERAGE", "CANNOT_VERIFY", "CRITICAL", "SCHEDULE_MISSING",
      "Scope not checked: the draft names no authorised schedule version.", {
        evidence: ["Quote header: no scheduleVersion"],
        remediation: "Attach the authorised schedule version this quote was priced against.",
      });
  }
  const covered = new Set(quote.lines.map((l) => l.scope));
  const missing = SCHEDULE.rows.filter((r) => !covered.has(r.scope));
  if (missing.length === 0) {
    return result("SCOPE_COVERAGE", "PASS", "INFO", "SCOPE_COMPLETE",
      `All ${SCHEDULE.rows.length} required schedule items are covered by a quote line.`, {
        evidence: SCHEDULE.rows.map((r) => `${r.id} ${r.scope}`),
      });
  }
  return result("SCOPE_COVERAGE", "FAIL", "HIGH", "REQUIRED_SCOPE_MISSING",
    `${missing.length} required schedule item${missing.length > 1 ? "s are" : " is"} not covered: ` +
      missing.map((m) => m.scope).join(", ") + ".", {
      evidence: missing.map((m) => `${m.id} requires ${m.requirement}`),
      remediation: "Price the missing scope or record an agreed exclusion.",
    });
}

function checkRateSourceAge(quote) {
  const unknown = quote.lines.filter((l) => l.rateId === null || !PRICE_BOOK[l.rateId]);
  if (unknown.length) {
    return result("RATE_SOURCE_AGE", "CANNOT_VERIFY", "HIGH", "RATE_SOURCE_UNKNOWN",
      `${unknown.length} line has no rate source, so its price cannot be verified against the price book.`, {
        evidence: unknown.map((l) => `${l.id} ${l.desc}: no rateId`),
        affectedLineIds: unknown.map((l) => l.id),
        remediation: "Add a price book record for this item, or price it as a provisional sum.",
      });
  }
  const stale = [], near = [];
  for (const l of quote.lines) {
    const r = PRICE_BOOK[l.rateId];
    if (r.ageDays > POLICY.maxAgeDays) stale.push({ l, r });
    else if (r.ageDays >= 0.8 * POLICY.maxAgeDays) near.push({ l, r });
  }
  if (stale.length) {
    return result("RATE_SOURCE_AGE", "FAIL", "HIGH", "RATE_STALE",
      `${stale.length} rate is older than the ${POLICY.maxAgeDays} day maximum.`, {
        evidence: stale.map((s) => `${s.l.rateId} is ${s.r.ageDays} days old at ${POLICY.evaluationDate}`),
        affectedLineIds: stale.map((s) => s.l.id),
        calculation: { formula: "ageDays > maxAgeDays", output: `${stale[0].r.ageDays} > ${POLICY.maxAgeDays}` },
        remediation: "Re-price from a current price book record before sending.",
      });
  }
  if (near.length) {
    return result("RATE_SOURCE_AGE", "FAIL", "MEDIUM", "RATE_NEAR_STALE",
      `${near.length} rate is approaching the ${POLICY.maxAgeDays} day maximum.`, {
        evidence: near.map((s) => `${s.l.rateId} is ${s.r.ageDays} days old, ${Math.round(0.8 * POLICY.maxAgeDays)} is the warning threshold`),
        affectedLineIds: near.map((s) => s.l.id),
        remediation: "Confirm the rate still holds, or refresh it.",
      });
  }
  return result("RATE_SOURCE_AGE", "PASS", "INFO", "RATES_CURRENT",
    `All ${quote.lines.length} rates resolve to a current price book record.`, {
      evidence: quote.lines.map((l) => `${l.rateId} ${PRICE_BOOK[l.rateId].ageDays}d`),
    });
}

function cohort() {
  return PAST_JOBS.filter(
    (j) =>
      j.jobClass === SCHEDULE.jobClass &&
      j.conditionTag === SCHEDULE.conditionTag &&
      Math.abs(j.floorAreaM2 - SCHEDULE.floorAreaM2) <= 0.25 * SCHEDULE.floorAreaM2
  );
}

function checkQuantityOutlier(quote) {
  const pool = cohort();
  const cableLines = quote.lines.filter((l) => l.scope === "CABLING" && l.unit === "m");
  if (pool.length < 3) {
    return result("QUANTITY_OUTLIER", "CANNOT_VERIFY", "HIGH", "INSUFFICIENT_COMPARABLES",
      `Only ${pool.length} comparable job${pool.length === 1 ? "" : "s"} available; three are required.`, {
        remediation: "Widen the cohort or accept that this quantity is unchecked.",
      });
  }
  if (!cableLines.length) {
    return result("QUANTITY_OUTLIER", "CANNOT_VERIFY", "HIGH", "MISSING_NORMALISATION_DRIVER",
      "No cable quantity present to normalise against the cohort.", {});
  }
  const ratios = pool.map((j) => j.cableM / j.poweredPoints).sort((a, b) => a - b);
  const mid = Math.floor(ratios.length / 2);
  const median = ratios.length % 2 ? ratios[mid] : (ratios[mid - 1] + ratios[mid]) / 2;
  const qty = cableLines.reduce((n, l) => n + l.qty, 0);
  const norm = qty / SCHEDULE.poweredPoints;
  const ratio = norm / median;
  const calc = {
    formula: "ratio = (quote cable m / powered points) / cohort median",
    output: `(${qty} / ${SCHEDULE.poweredPoints}) / ${median.toFixed(2)} = ${ratio.toFixed(2)}`,
  };
  const ev = pool.map((j) => `${j.id}: ${j.cableM} m over ${j.poweredPoints} points = ${(j.cableM / j.poweredPoints).toFixed(2)}`);
  if (ratio < 0.65 || ratio > 1.35) {
    return result("QUANTITY_OUTLIER", "FAIL", "HIGH", "QUANTITY_OUTLIER",
      `Cable quantity is ${ratio.toFixed(2)}x the cohort median, outside the 0.65 to 1.35 band.`, {
        evidence: ev, calculation: calc, affectedLineIds: cableLines.map((l) => l.id),
        remediation: "Re-check the takeoff. A transposed figure is the usual cause.",
      });
  }
  if (ratio < 0.8 || ratio > 1.2) {
    return result("QUANTITY_OUTLIER", "FAIL", "MEDIUM", "QUANTITY_WARNING",
      `Cable quantity is ${ratio.toFixed(2)}x the cohort median.`, { evidence: ev, calculation: calc,
        affectedLineIds: cableLines.map((l) => l.id) });
  }
  return result("QUANTITY_OUTLIER", "PASS", "INFO", "QUANTITY_WITHIN_RANGE",
    `Cable quantity is ${ratio.toFixed(2)}x the median of ${pool.length} comparable jobs.`, {
      evidence: ev, calculation: calc,
    });
}

function checkMargin(quote) {
  const t = quoteTotals(quote);
  if (t.incomplete && quote.costOverridePence === undefined) {
    return result("MARGIN", "CANNOT_VERIFY", "HIGH", "MARGIN_INPUT_INCOMPLETE",
      "Margin not calculated: at least one line has no direct cost, so the cost base is incomplete.", {
        evidence: t.unpriceable.map((id) => `${id} has no priceable direct cost`),
        affectedLineIds: t.unpriceable,
        remediation: "Price the outstanding line, or mark it as a provisional sum with an agreed value.",
      });
  }
  const marginBps = Math.round(((t.sellPence - t.costPence) / t.sellPence) * 10000);
  const calc = {
    formula: "(sell excluding VAT - direct cost) / sell excluding VAT",
    output: `(${gbp(t.sellPence)} - ${gbp(t.costPence)}) / ${gbp(t.sellPence)} = ${(marginBps / 100).toFixed(1)}%`,
  };
  if (marginBps < POLICY.targetGrossMarginBps) {
    return result("MARGIN", "FAIL", "HIGH", "MARGIN_BELOW_TARGET",
      `Gross margin is ${(marginBps / 100).toFixed(1)}%, below the ${(POLICY.targetGrossMarginBps / 100).toFixed(0)}% target.`, {
        calculation: calc, evidence: [`${POLICY.policyVersion} target ${(POLICY.targetGrossMarginBps / 100).toFixed(0)}%`],
        remediation: "Recover cost or re-price before sending.",
      });
  }
  return result("MARGIN", "PASS", "INFO", "MARGIN_AT_OR_ABOVE_TARGET",
    `Gross margin is ${(marginBps / 100).toFixed(1)}%, at or above the ${(POLICY.targetGrossMarginBps / 100).toFixed(0)}% target.`, {
      calculation: calc,
    });
}

function checkStandardItems(quote) {
  const present = new Set();
  for (const l of quote.lines) if (l.standard) l.standard.split(",").forEach((s) => present.add(s));
  const missing = POLICY.standards.filter((s) => !present.has(s.id));
  if (missing.length === 0) {
    return result("STANDARD_ITEMS", "PASS", "INFO", "STANDARD_ITEMS_COMPLETE",
      `All ${POLICY.standards.length} standard items required by ${POLICY.policyVersion} are present.`, {
        evidence: POLICY.standards.map((s) => `${s.id} ${s.label}`),
      });
  }
  return result("STANDARD_ITEMS", "FAIL", "HIGH", "STANDARD_ITEM_MISSING",
    `${missing.length} standard item${missing.length > 1 ? "s are" : " is"} missing: ` +
      missing.map((m) => m.label).join(", ") + ".", {
      evidence: missing.map((m) => `${POLICY.policyVersion} requires ${m.id} ${m.label}`),
      remediation: "Add the standard item or record an authorised policy exception.",
    });
}

const EXCLUSION_SCOPE = {
  "testing and certification": "TEST_CERT",
  containment: "CONTAINMENT",
  "fire alarm": "FIRE_ALARM",
};

function checkContradiction(quote) {
  const included = new Set(quote.lines.map((l) => l.scope));
  const clashes = [];
  for (const ex of quote.exclusions) {
    const key = Object.keys(EXCLUSION_SCOPE).find((k) => ex.toLowerCase().includes(k));
    if (!key) continue;                       // unmapped prose is not forced into a code
    const scope = EXCLUSION_SCOPE[key];
    if (included.has(scope)) {
      const line = quote.lines.find((l) => l.scope === scope);
      clashes.push({ scope, ex, line });
    }
  }
  if (!clashes.length) {
    return result("CONTRADICTION", "PASS", "INFO", "NO_INTERNAL_CONTRADICTIONS",
      "No scope appears as both included and excluded.", {
        evidence: quote.exclusions.map((e) => `Exclusion: ${e}`),
      });
  }
  return result("CONTRADICTION", "FAIL", "CRITICAL", "SCOPE_INCLUDED_AND_EXCLUDED",
    `${clashes[0].scope} is both priced and excluded in the same quote.`, {
      evidence: clashes.flatMap((c) => [`Included: ${c.line.id} ${c.line.desc}`, `Excluded: "${c.ex}"`]),
      affectedLineIds: clashes.map((c) => c.line.id),
      remediation: "Decide which is correct. The client will read the exclusion.",
    });
}

function checkDownsideExposure(quote, others) {
  const parts = [];
  const unquantified = [];

  const scope = others.find((r) => r.check === "SCOPE_COVERAGE");
  if (scope.reasonCode === "REQUIRED_SCOPE_MISSING") {
    const missing = SCHEDULE.rows.filter((r) => !new Set(quote.lines.map((l) => l.scope)).has(r.scope));
    for (const m of missing) {
      const base = BASE_LINES.find((l) => l.scope === m.scope);
      if (base) {
        const c = lineCostPence(base);
        if (c !== null) parts.push({ label: `${m.scope} at ${base.qty} ${base.unit}`, pence: c });
        else unquantified.push(`${m.scope}: no current rate`);
      } else unquantified.push(`${m.scope}: no assembly to price from`);
    }
  }
  if (scope.status === "CANNOT_VERIFY") unquantified.push("Scope gap unknown: no schedule to compare against");

  const rate = others.find((r) => r.check === "RATE_SOURCE_AGE");
  if (rate.reasonCode === "RATE_SOURCE_UNKNOWN") unquantified.push("Unpriced line: no current rate to compare against");

  const margin = others.find((r) => r.check === "MARGIN");
  if (margin.reasonCode === "MARGIN_BELOW_TARGET") {
    const t = quoteTotals(quote);
    const needed = Math.round(t.costPence / (1 - POLICY.targetGrossMarginBps / 10000));
    parts.push({ label: "Margin shortfall to target", pence: needed - t.sellPence });
  }
  if (margin.status === "CANNOT_VERIFY") unquantified.push("Margin shortfall unknown: direct cost incomplete");

  const qty = others.find((r) => r.check === "QUANTITY_OUTLIER");
  if (qty.reasonCode === "QUANTITY_OUTLIER") unquantified.push("Quantity outlier: over-measure is competitive, not contractual, exposure");

  const total = parts.reduce((n, p) => n + p.pence, 0);

  if (!parts.length && unquantified.length) {
    return result("DOWNSIDE_EXPOSURE", "CANNOT_VERIFY", "HIGH", "EXPOSURE_UNQUANTIFIED",
      "Exposure not quantified: a required monetary input is unavailable.", {
        evidence: unquantified,
        remediation: "Supply the missing source. No market average is substituted.",
      });
  }
  if (!parts.length) {
    return result("DOWNSIDE_EXPOSURE", "PASS", "INFO", "EXPOSURE_NONE_IDENTIFIED",
      "No quantifiable downside identified from the checks above.", {});
  }
  return result("DOWNSIDE_EXPOSURE", unquantified.length ? "CANNOT_VERIFY" : "FAIL",
    unquantified.length ? "HIGH" : "MEDIUM",
    unquantified.length ? "EXPOSURE_PARTLY_QUANTIFIED" : "EXPOSURE_QUANTIFIED",
    `${gbp(total)} of downside is quantifiable from the findings above.` +
      (unquantified.length ? " Some exposure could not be quantified." : ""), {
      evidence: parts.map((p) => `${p.label}: ${gbp(p.pence)}`).concat(unquantified),
      calculation: { formula: "sum of non overlapping scenario amounts", output: gbp(total) },
      remediation: "Synthetic fixture scenario, not a forecast.",
    });
}

/* ---- verdict ------------------------------------------------------------ */

function verdictFor(results) {
  const anyCannot = results.some((r) => r.status === "CANNOT_VERIFY");
  const anyHigh = results.some((r) => r.severity === "HIGH" || r.severity === "CRITICAL");
  if (anyCannot || anyHigh) return "HOLD";
  if (results.some((r) => r.severity === "MEDIUM")) return "REVIEW";
  return "SEND";
}

function runAssurance(quote) {
  const first = [
    checkScopeCoverage(quote),
    checkRateSourceAge(quote),
    checkQuantityOutlier(quote),
    checkMargin(quote),
    checkStandardItems(quote),
    checkContradiction(quote),
  ];
  const results = first.concat([checkDownsideExposure(quote, first)]);
  return {
    quoteId: quote.id,
    verdict: verdictFor(results),
    results,
    totals: quoteTotals(quote),
    policyVersion: POLICY.policyVersion,
    scheduleVersion: quote.scheduleVersion,
  };
}

/* One surface, two consumers: node runs the acceptance script against it, the
 * page renders it. The checks are identical in both, which is the point of
 * keeping them out of the interface. */
const API = { POLICY, PRICE_BOOK, SCHEDULE, PAST_JOBS, QUOTES, BASE_LINES,
  runAssurance, quoteTotals, verdictFor, gbp, cohort, lineCostPence };

if (typeof module !== "undefined" && module.exports) module.exports = API;
if (typeof window !== "undefined") window.QA = API;

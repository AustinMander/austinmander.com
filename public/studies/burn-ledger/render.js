const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = 2400;
const HEIGHT = 1200;
const COLUMN_X = { evening: 330, late: 880, overnight: 1320, morning: 1760 };
const GRID_X = [430, 880, 1320, 1760, 2200];

const frame = document.getElementById('frame');
const tooltip = document.getElementById('tooltip');
const exportButton = document.getElementById('export');
const status = document.getElementById('status');
const daySwitcher = document.getElementById('day-switcher');

let currentDay = '';
let ledger = null;

const DAY_ONE_REFERENCE = {
  runs: 25,
  catches: 5,
  bars: 4,
  register: 5,
  lanes: ['resort-3d-lab', 'motion-lab', 'content / sites', 'rig', 'vault']
};

const escapeText = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const escapeAttr = value => escapeText(value)
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function slotX(slot) {
  if (!slot || !(slot.column in COLUMN_X) || !Number.isInteger(slot.index)) {
    throw new Error(`Invalid ordinal slot: ${JSON.stringify(slot)}`);
  }
  return COLUMN_X[slot.column] + slot.index;
}

function validateData(data) {
  const laneIds = new Set(data.lanes.map(lane => lane.id));
  if (laneIds.size !== data.lanes.length) throw new Error('Lane ids must be unique.');

  data.runs.forEach(run => {
    if (!laneIds.has(run.lane)) {
      throw new Error(`Run ${run.id} names unknown lane ${run.lane}.`);
    }
    slotX(run.slot);
    if (!['verified', 'catch'].includes(run.kind)) {
      throw new Error(`Run ${run.id} has invalid kind ${run.kind}.`);
    }
  });

  data.bars.forEach(bar => {
    if (!laneIds.has(bar.lane)) {
      throw new Error(`Bar ${bar.label} names unknown lane ${bar.lane}.`);
    }
    slotX(bar.start_slot);
    slotX(bar.end_slot);
  });
}

function splitLines(value) {
  return String(value).split('\n');
}

function lanePositions(data, trainingBars) {
  if (trainingBars.length && data.lanes.length === 5) return [424, 660, 769, 874, 959];
  const top = 390;
  const bottom = 959;
  const step = (bottom - top) / Math.max(1, data.lanes.length - 1);
  return data.lanes.map((_, index) => Math.round(top + step * index));
}

function labelAbove(laneId, runIndex) {
  const startsBelow = laneId === 'motion-lab';
  return startsBelow ? runIndex % 2 === 1 : runIndex % 2 === 0;
}

function runMarkup(run, x, y, above, firstLane) {
  const labelY = above ? y - 37 : y + (firstLane ? 42 : 44);
  const catchMarkup = run.kind === 'catch'
    ? `<g transform="translate(${x + 17} ${y - 25})"><path d="M9 0L18 9 9 18 0 9Z" class="bug-glyph"/><text x="9" y="14" class="bug-mark">!</text></g>`
    : '';
  const aria = `${run.id}. ${run.result}`;

  return `<g class="run" tabindex="0" role="button" aria-label="${escapeAttr(aria)}" data-id="${escapeAttr(run.id)}" data-result="${escapeAttr(run.result)}">
    <title>${escapeText(`${run.id}: ${run.result}`)}</title>
    <rect class="hit" x="${x - 70}" y="${y - 50}" width="140" height="100"/>
    <circle class="focus-ring" cx="${x}" cy="${y}" r="18"/>
    <rect class="node" x="${x - 9}" y="${y - 9}" width="18" height="18" transform="rotate(45 ${x} ${y})"/>
    <path class="check" d="M${x - 5} ${y}l3 3 7-8"/>
    <text x="${x}" y="${labelY}" text-anchor="middle" class="run-label ink">${escapeText(run.label)}<tspan x="${x}" dy="14" class="run-sub">${escapeText(run.sub)}</tspan></text>
    ${catchMarkup}
  </g>`;
}

function annotationMarkup(run, x, y) {
  if (!run.annotation) return '';
  const [headline, sub = ''] = splitLines(run.annotation.text);
  const textX = x + run.annotation.dx;
  const textY = y + run.annotation.dy;
  const above = run.annotation.dy < 0;
  const startY = y + (above ? -16 : 18);
  const elbowY = textY + (above ? 3 : 2);
  const endX = textX + (run.annotation.dx < 0 ? 10 : -10);
  const anchor = run.annotation.dx < 0 ? 'end' : 'start';

  return `<g class="editorial-callout" data-for="${escapeAttr(run.id)}">
    <path d="M${x} ${startY}V${elbowY}H${endX}" class="rule" fill="none"/>
    <circle cx="${x}" cy="${startY}" r="3" class="ink"/>
    <text x="${textX}" y="${textY}" text-anchor="${anchor}" class="annotation ink">${escapeText(headline)}</text>
    ${sub ? `<text x="${textX}" y="${textY + 16}" text-anchor="${anchor}" class="annotation-sub">${escapeText(sub)}</text>` : ''}
  </g>`;
}

function trainingMarkup(bars, laneY, data) {
  if (!bars.length) return '';
  const source = data.runs.find(run => run.id === 'R2') || data.runs.find(run => run.lane === bars[0].lane);
  const sourceX = slotX(source.slot);
  const headerX = slotX(bars[0].start_slot);
  const barYs = [540, 565, 590];

  return `<g aria-label="Training durations: ${bars.map(bar => bar.label.toLowerCase()).join(', ')}">
    <path d="M${sourceX} ${laneY + 25}V510H${headerX}" class="soft-rule" fill="none"/>
    <text x="${headerX}" y="500" class="legend-head ink">R2 / TRAINING DURATION</text>
    <text x="${headerX}" y="517" class="annotation-sub">COMMON SCALE, 0 TO 55 MIN</text>
    ${bars.map((bar, index) => {
      const start = slotX(bar.start_slot);
      const end = slotX(bar.end_slot);
      const y = barYs[index];
      return `<path d="M${start} ${y}H${end}M${start} ${y - 6}V${y + 6}M${end} ${y - 6}V${y + 6}" class="training-line" fill="none"/><text x="${end + 12}" y="${y + 4}" class="legend ink">${escapeText(bar.label)}</text>`;
    }).join('')}
  </g>`;
}

function progressMarkup(bar, y) {
  const start = slotX(bar.start_slot);
  const end = slotX(bar.end_slot);
  const [label, note = 'IN PROGRESS'] = splitLines(bar.label);
  return `<g class="progress-bar" aria-label="${escapeAttr(`${label} in progress`)}">
    <path d="M${start} ${y}H${end}" stroke="#24221e" stroke-width="2" stroke-dasharray="7 7" fill="none" vector-effect="non-scaling-stroke"/>
    <path d="M${end} ${y}l-13-7v14Z" class="ink"/>
    <circle cx="${start}" cy="${y}" r="6" fill="#f3eddf" stroke="#24221e" stroke-width="1.5"/>
    <text x="${start}" y="${y - 37}" class="run-label ink">${escapeText(label)}</text>
    <text x="${start}" y="${y - 19}" class="run-sub">${escapeText(note)}</text>
  </g>`;
}

function registerMarkup(register) {
  const positions = register.length === 5
    ? [330, 700, 1080, 1440, 1820]
    : register.map((_, index) => 330 + index * (1490 / Math.max(1, register.length - 1)));
  return `<path d="M56 1014H2344" class="rule"/>
    <text x="64" y="1043" class="legend-head gate-fill">GATE REGISTER / ${String(register.length).padStart(2, '0')}</text>
    <g class="bug-register ink">
      ${register.map((item, index) => {
        const lines = splitLines(item.text);
        return `<text x="${positions[index]}" y="1043"><tspan class="gate-fill">${escapeText(item.num)}</tspan>${lines.map((line, lineIndex) => `<tspan x="${positions[index]}" dy="${lineIndex === 0 ? 18 : 14}">${escapeText(line)}</tspan>`).join('')}</text>`;
      }).join('')}
    </g>`;
}

function svgStyles() {
  return `<style>
    .paper { fill: #f3eddf; }
    .ink { fill: #24221e; }
    .soft { fill: #6d685e; }
    .gate-fill { fill: #c43b25; }
    .rule { stroke: #24221e; stroke-width: 1; vector-effect: non-scaling-stroke; }
    .soft-rule { stroke: #817a6e; stroke-width: .8; vector-effect: non-scaling-stroke; }
    .grid { stroke: #a89f8d; stroke-width: .65; stroke-dasharray: 2 7; vector-effect: non-scaling-stroke; }
    .gate-line { stroke: #c43b25; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
    .training-line { stroke: #627159; stroke-width: 4; vector-effect: non-scaling-stroke; }
    .eyebrow, .axis, .run-label, .annotation, .legend, .foot, .bug-register { font-family: ui-monospace, "SFMono-Regular", Consolas, monospace; }
    .eyebrow { font-size: 17px; font-weight: 700; letter-spacing: .15em; }
    .headline { font-family: Georgia, "Times New Roman", serif; font-size: 78px; font-weight: 400; letter-spacing: -.035em; }
    .deck { font-family: Georgia, "Times New Roman", serif; font-size: 22px; font-style: italic; }
    .folio { font-family: Georgia, "Times New Roman", serif; font-size: 17px; }
    .axis { font-size: 12px; letter-spacing: .09em; text-transform: uppercase; }
    .lane-name { font-family: Georgia, "Times New Roman", serif; font-size: 19px; font-weight: 700; }
    .lane-count { font-family: ui-monospace, "SFMono-Regular", Consolas, monospace; font-size: 11px; letter-spacing: .08em; }
    .run-label { font-size: 12px; font-weight: 700; letter-spacing: .03em; }
    .run-sub { font-size: 10px; font-weight: 400; fill: #6d685e; letter-spacing: 0; }
    .annotation { font-size: 12px; font-weight: 700; letter-spacing: .05em; }
    .annotation-sub { font-size: 10px; font-weight: 400; fill: #6d685e; }
    .legend { font-size: 11px; letter-spacing: .07em; }
    .legend-head { font-size: 12px; font-weight: 700; letter-spacing: .14em; }
    .bug-register { font-size: 11px; letter-spacing: .02em; }
    .foot { font-size: 11px; letter-spacing: .08em; }
    .run { cursor: help; outline: none; }
    .run .hit { fill: transparent; }
    .focus-ring { fill: none; stroke: none; }
    .run .node { fill: #f3eddf; stroke: #24221e; stroke-width: 1.2; vector-effect: non-scaling-stroke; transition: fill 120ms ease, stroke-width 120ms ease; }
    .run .check { fill: none; stroke: #24221e; stroke-width: 1.4; stroke-linecap: square; stroke-linejoin: miter; vector-effect: non-scaling-stroke; pointer-events: none; }
    .run:hover .node, .run:focus .node { fill: #24221e; stroke-width: 2; }
    .run:hover .check, .run:focus .check { stroke: #f3eddf; }
    .run:focus-visible .focus-ring { stroke: #c43b25; stroke-width: 2; fill: none; vector-effect: non-scaling-stroke; }
    .bug-glyph { fill: #c43b25; stroke: #c43b25; stroke-width: 1; vector-effect: non-scaling-stroke; }
    .bug-mark { fill: #f3eddf; font-family: Georgia, serif; font-size: 14px; font-weight: 700; text-anchor: middle; }
  </style>`;
}

function buildSvg(data, days) {
  validateData(data);
  const trainingBars = data.bars.filter(bar => !bar.label.includes('IN PROGRESS'));
  const progressBars = data.bars.filter(bar => bar.label.includes('IN PROGRESS'));
  const yValues = lanePositions(data, trainingBars);
  const laneY = Object.fromEntries(data.lanes.map((lane, index) => [lane.id, yValues[index]]));
  const folio = days.indexOf(currentDay) + 1;
  const headline = splitLines(data.headline);
  const dayLabel = splitLines(data.day_label);
  const catchCount = data.runs.filter(run => run.kind === 'catch').length;

  const laneMarkup = data.lanes.map((lane, index) => `<text x="64" y="${yValues[index] - 4}" class="lane-name ink">${escapeText(lane.name)}</text>
    <text x="64" y="${yValues[index] + 17}" class="lane-count soft">${escapeText(lane.runs_note)}</text>
    <path d="M330 ${yValues[index]}H2250" class="soft-rule"/>`).join('');

  const runGroups = [];
  const annotations = [];
  const runIndexByLane = new Map();
  data.runs.forEach(run => {
    const laneIndex = data.lanes.findIndex(lane => lane.id === run.lane);
    const runIndex = runIndexByLane.get(run.lane) || 0;
    const x = slotX(run.slot);
    const y = laneY[run.lane];
    runGroups.push(runMarkup(run, x, y, labelAbove(run.lane, runIndex), laneIndex === 0));
    annotations.push(annotationMarkup(run, x, y));
    runIndexByLane.set(run.lane, runIndex + 1);
  });

  ledger = document.createElementNS(SVG_NS, 'svg');
  ledger.id = 'ledger';
  ledger.setAttribute('xmlns', SVG_NS);
  ledger.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
  ledger.setAttribute('role', 'img');
  ledger.setAttribute('aria-labelledby', 'svg-title svg-desc');
  ledger.innerHTML = `<title id="svg-title">The Burn Ledger</title>
    <desc id="svg-desc">A ${data.lanes.length}-lane ordinal timeline of ${data.runs.length} completed worker runs, with ${catchCount} bugs caught by gates.</desc>
    ${svgStyles()}
    <rect class="paper" width="2400" height="1200"/>
    <path d="M56 44H2344M56 256H2344M56 1138H2344" class="rule" fill="none"/>

    <text x="64" y="78" class="eyebrow ink">THE BURN LEDGER</text>
    <text x="64" y="126" class="folio soft">No. ${String(folio).padStart(2, '0')}</text>
    ${headline.map((line, index) => `<text x="64" y="${181 + index * 61}" class="headline ink">${escapeText(line)}</text>`).join('')}

    <text x="1548" y="84" class="legend-head ink">MAP KEY</text>
    <g transform="translate(1549 110)">
      <rect x="0" y="0" width="18" height="18" transform="rotate(45 9 9)" fill="#f3eddf" stroke="#24221e" stroke-width="1.2"/>
      <path d="M4 9l3 3 7-8" fill="none" stroke="#24221e" stroke-width="1.4"/>
      <text x="34" y="13" class="legend ink">VERIFIED / COMPLETED RUN</text>
    </g>
    <g transform="translate(1549 145)">
      <path d="M9 0L18 9 9 18 0 9Z" class="bug-glyph"/>
      <text x="9" y="14" class="bug-mark">!</text>
      <text x="34" y="13" class="legend ink">BUG CAUGHT BY GATE</text>
    </g>
    <g transform="translate(1549 181)">
      <path d="M0 3V15M0 9H22M22 3V15" class="training-line" fill="none"/>
      <text x="38" y="13" class="legend ink">TRAINING DURATION</text>
    </g>
    ${dayLabel.map((line, index) => `<text x="2025" y="${83 + index * 23}" class="axis soft">${escapeText(line)}</text>`).join('')}
    <text x="2025" y="143" class="deck ink">Clock positions are</text>
    <text x="2025" y="168" class="deck ink">approximate.</text>

    <text x="330" y="292" class="axis soft">WORKSTREAM / RUN</text>
    <text x="2250" y="292" class="axis soft" text-anchor="end">APPROXIMATE CLOCK →</text>
    <path d="M330 306H2250" class="rule"/>
    <path d="${GRID_X.map(x => `M${x} 306V982`).join('')}" class="grid"/>
    <text x="430" y="327" class="axis soft" text-anchor="middle">EVENING</text>
    <text x="880" y="327" class="axis soft" text-anchor="middle">LATE</text>
    <text x="1320" y="327" class="axis soft" text-anchor="middle">OVERNIGHT</text>
    <text x="1760" y="327" class="axis soft" text-anchor="middle">MORNING</text>
    <text x="2200" y="327" class="axis soft" text-anchor="middle">22 JUL</text>

    ${laneMarkup}
    ${runGroups.join('')}
    ${trainingMarkup(trainingBars, yValues[0], data)}
    ${progressBars.map(bar => progressMarkup(bar, laneY[bar.lane])).join('')}
    ${annotations.join('')}
    ${registerMarkup(data.register)}
    <text x="64" y="1170" class="foot ink">${escapeText(data.footer.left)}</text>
    <text x="2340" y="1170" text-anchor="end" class="foot soft">${escapeText(data.footer.right)}</text>`;

  const old = document.getElementById('ledger');
  if (old) old.remove();
  frame.insertBefore(ledger, tooltip);
  bindRunInteractions();
  assertRenderedStructure(data);
}

function assertRenderedStructure(data) {
  const rendered = {
    runs: ledger.querySelectorAll('.run').length,
    catches: ledger.querySelectorAll('.run .bug-glyph').length,
    bars: ledger.querySelectorAll('.training-line').length - 1 + ledger.querySelectorAll('.progress-bar').length,
    register: ledger.querySelectorAll('.bug-register > text').length,
    lanes: [...ledger.querySelectorAll('.lane-name')].map(node => node.textContent)
  };
  const expected = currentDay === '2026-07-21'
    ? DAY_ONE_REFERENCE
    : {
        runs: data.runs.length,
        catches: data.runs.filter(run => run.kind === 'catch').length,
        bars: data.bars.length,
        register: data.register.length,
        lanes: data.lanes.map(lane => lane.name)
      };
  const matches = rendered.runs === expected.runs
    && rendered.catches === expected.catches
    && rendered.bars === expected.bars
    && rendered.register === expected.register
    && rendered.lanes.length === expected.lanes.length
    && rendered.lanes.every((lane, index) => lane === expected.lanes[index]);
  if (!matches) throw new Error(`Rendered structure differs: ${JSON.stringify(rendered)}`);
  ledger.dataset.structure = JSON.stringify(rendered);
}

function placeTooltip(run, pointerEvent) {
  tooltip.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = run.dataset.id;
  tooltip.append(heading, document.createTextNode(run.dataset.result));
  tooltip.dataset.open = 'true';
  const anchor = pointerEvent
    ? { x: pointerEvent.clientX, y: pointerEvent.clientY }
    : (() => {
        const rect = run.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })();
  const margin = 12;
  const boxWidth = Math.min(310, window.innerWidth - margin * 2);
  let left = anchor.x + 16;
  let top = anchor.y + 16;
  if (left + boxWidth > window.innerWidth - margin) left = anchor.x - boxWidth - 16;
  if (top + 112 > window.innerHeight - margin) top = anchor.y - 112;
  tooltip.style.left = `${Math.max(margin, left)}px`;
  tooltip.style.top = `${Math.max(margin, top)}px`;
}

function closeTooltip() {
  tooltip.dataset.open = 'false';
}

function bindRunInteractions() {
  ledger.querySelectorAll('.run').forEach(run => {
    run.addEventListener('pointerenter', event => placeTooltip(run, event));
    run.addEventListener('pointermove', event => placeTooltip(run, event));
    run.addEventListener('pointerleave', closeTooltip);
    run.addEventListener('focus', () => placeTooltip(run));
    run.addEventListener('blur', closeTooltip);
    run.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeTooltip();
        run.blur();
      }
    });
  });
}

function renderSwitcher(days) {
  daySwitcher.innerHTML = days.map(day => {
    const active = day === currentDay ? ' aria-current="date"' : '';
    return `<a href="?day=${encodeURIComponent(day)}"${active}>${escapeText(day.slice(5))}</a>`;
  }).join('');
}

async function exportPng() {
  exportButton.disabled = true;
  exportButton.textContent = 'Rendering…';
  status.textContent = 'Rendering the 2400px PNG locally.';
  const clone = ledger.cloneNode(true);
  clone.setAttribute('width', '2400');
  clone.setAttribute('height', '1200');
  const source = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.getContext('2d').drawImage(image, 0, 0, WIDTH, HEIGHT);
    URL.revokeObjectURL(url);
    canvas.toBlob(png => {
      const pngUrl = URL.createObjectURL(png);
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `the-burn-ledger-${currentDay}-2400.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
      exportButton.disabled = false;
      exportButton.textContent = 'Export 2400px PNG';
      status.textContent = 'PNG exported at 2400 × 1200.';
    }, 'image/png');
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    exportButton.disabled = false;
    exportButton.textContent = 'Export 2400px PNG';
    status.textContent = 'The PNG could not be rendered in this browser.';
  };
  image.src = url;
}

async function init() {
  try {
    const daysResponse = await fetch('data/days.json');
    if (!daysResponse.ok) throw new Error('Could not load the day manifest.');
    const days = await daysResponse.json();
    const requested = new URLSearchParams(window.location.search).get('day');
    currentDay = requested && days.includes(requested) ? requested : days.at(-1);
    const dataResponse = await fetch(`data/${currentDay}.json`);
    if (!dataResponse.ok) throw new Error(`Could not load ${currentDay}.`);
    const data = await dataResponse.json();
    renderSwitcher(days);
    buildSvg(data, days);
    exportButton.disabled = false;
    exportButton.addEventListener('click', exportPng);
    status.textContent = `${currentDay} · ${data.runs.length} completed runs · ${data.runs.filter(run => run.kind === 'catch').length} catches`;
  } catch (error) {
    status.textContent = error.message;
    frame.setAttribute('aria-label', 'The ledger could not be loaded.');
  }
}

init();

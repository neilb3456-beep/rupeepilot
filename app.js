import { assets, snapshotDate } from './data.js';

const select = (id) => document.getElementById(id);
const byId = new Map(assets.map((asset) => [asset.id, asset]));
const chart = select('chart');
const context = chart.getContext('2d');
const compareSelect = select('compare');
const search = select('asset-search');
const filters = Array.from(document.querySelectorAll('[data-filter]'));
const ranges = Array.from(document.querySelectorAll('[data-days]'));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const compactLayout = matchMedia('(max-width: 760px)');
const storeKey = 'rupeepilot.market-studio.watchlist.v1';
const prices = {
  INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
};
const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
});
const dayLabel = new Intl.DateTimeFormat('en-IN', {
  month: 'short', day: 'numeric', timeZone: 'UTC',
});
const endpoint = Date.parse(snapshotDate);
const day = 86400000;
const colors = ['#267651', '#735bbe'];

const state = {
  group: 'Stocks',
  current: assets[0],
  compare: null,
  days: 31,
  point: -1,
  saved: new Set(),
  series: [],
};

try {
  const saved = JSON.parse(localStorage.getItem(storeKey) || '[]');
  if (Array.isArray(saved)) state.saved = new Set(saved.filter((id) => byId.has(id)));
} catch {}

function money(value, currency) {
  return prices[currency].format(value);
}

function signed(value) {
  const rounded = Number(value.toFixed(2));
  return (rounded > 0 ? '+' : '') + rounded.toFixed(2) + '%';
}

function change(from, to) {
  return ((to - from) / from) * 100;
}

function dailyMove(asset) {
  return change(asset.closes.at(-2)[1], asset.closes.at(-1)[1]);
}

function moveClass(value) {
  if (value === 0) return '';
  return value > 0 ? 'gain' : 'loss';
}

function updatePressedControls() {
  for (const button of filters) {
    button.setAttribute('aria-pressed', String(button.dataset.filter === state.group));
  }
  for (const button of ranges) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.days) === state.days));
  }
}

function renderSnapshot() {
  const featured = ['RELIANCE', 'HDFCBANK', 'BTC', 'ETH'].map((id) => byId.get(id));
  select('snapshots').replaceChildren(...featured.map((asset) => {
    const anchor = document.createElement('a');
    const move = dailyMove(asset);
    anchor.className = 'snapshot-item';
    anchor.href = '#markets';
    anchor.innerHTML = `<strong>${asset.name}</strong><span class="snap-price">${money(asset.closes.at(-1)[1], asset.currency)}</span><span class="snap-change ${moveClass(move)}" aria-label="${signed(move)} vs previous close">${signed(move)}</span>`;
    anchor.addEventListener('click', () => {
      state.group = asset.group;
      search.value = '';
      activate(asset);
    });
    return anchor;
  }));
}

function renderList() {
  const term = search.value.trim().toLowerCase();
  const shown = assets.filter((asset) => {
    const matchesGroup = state.group === 'Saved' ? state.saved.has(asset.id) : asset.group === state.group;
    return matchesGroup && (asset.id + ' ' + asset.name).toLowerCase().includes(term);
  });
  select('asset-count').textContent = shown.length + (shown.length === 1 ? ' asset' : ' assets');
  const empty = select('empty-assets');
  empty.hidden = shown.length > 0;
  empty.textContent = state.group === 'Saved' && !state.saved.size
    ? 'Save an asset from its chart to add it here.'
    : 'No matches. Try a different name or symbol.';
  select('asset-list').replaceChildren(...shown.map((asset) => {
    const item = document.createElement('li');
    const move = dailyMove(asset);
    item.innerHTML = `<button class="asset-row" type="button" data-id="${asset.id}" aria-pressed="${asset === state.current}">
      <span class="asset-icon ${asset.tone}" aria-hidden="true">${asset.mark}</span>
      <span class="asset-row-copy"><strong>${asset.name}</strong><small>${asset.id}</small></span>
      <span class="row-change ${moveClass(move)}" aria-label="${signed(move)} vs previous close">${signed(move)}</span>
    </button>`;
    item.firstElementChild.addEventListener('click', (event) => {
      activate(asset, false);
      if (compactLayout.matches && event.detail > 0) {
        document.querySelector('.analysis-panel').scrollIntoView({
          behavior: reduceMotion.matches ? 'instant' : 'smooth',
          block: 'start',
        });
      }
    });
    return item;
  }));
}

function renderSave() {
  const saved = state.saved.has(state.current.id);
  const button = select('save-asset');
  button.setAttribute('aria-pressed', String(saved));
  button.setAttribute('aria-label', (saved ? 'Remove ' : 'Save ') + state.current.name + (saved ? ' from watchlist' : ' to watchlist'));
  button.firstElementChild.textContent = saved ? '★' : '☆';
  button.lastElementChild.textContent = saved ? 'Saved' : 'Save';
}

function activate(asset, refreshList = true) {
  state.current = asset;
  if (state.compare === asset) state.compare = null;
  const icon = select('selected-icon');
  icon.className = 'asset-icon ' + asset.tone;
  icon.textContent = asset.mark;
  select('selected-name').textContent = asset.name;
  select('selected-meta').textContent = [
    asset.id, asset.group === 'Stocks' ? 'NSE' : 'Crypto', asset.currency, asset.sector,
  ].join(' · ');
  select('asset-context').textContent = asset.context;
  compareSelect.replaceChildren(new Option('None', ''), ...assets
    .filter((alternative) => alternative !== asset)
    .map((alternative) => new Option(alternative.id + ' · ' + alternative.currency, alternative.id)));
  compareSelect.value = state.compare?.id ?? '';
  renderSave();
  updatePressedControls();
  if (refreshList) renderList();
  else {
    for (const button of document.querySelectorAll('.asset-row')) {
      button.setAttribute('aria-pressed', String(button.dataset.id === asset.id));
    }
  }
  renderSeries();
}

function windowed(asset) {
  const start = endpoint - state.days * day;
  return asset.closes.filter(([date]) => Date.parse(date) >= start);
}

function makeSeries(asset, points, indexed) {
  const base = points[0][1];
  return { asset, points: points.map(([date, close]) => ({
    date, close, value: indexed ? (close / base) * 100 : close,
  })) };
}

function showSource(id, asset) {
  const anchor = select(id);
  anchor.hidden = !asset;
  if (!asset) return;
  anchor.href = asset.source;
  anchor.textContent = asset.id + ' · ' + asset.publisher;
}

function renderSeries() {
  const currentPoints = windowed(state.current);
  if (state.compare) {
    const comparePoints = new Map(windowed(state.compare));
    const overlap = currentPoints.filter(([date]) => comparePoints.has(date));
    state.series = [
      makeSeries(state.current, overlap, true),
      makeSeries(state.compare, overlap.map(([date]) => [date, comparePoints.get(date)]), true),
    ];
  } else {
    state.series = [makeSeries(state.current, currentPoints, false)];
  }
  const points = state.series[0].points;
  state.point = points.length - 1;
  chart.setAttribute('aria-valuemin', '1');
  chart.setAttribute('aria-valuemax', String(points.length));
  const keys = state.series.map(({ asset }, index) =>
    `<span class="legend-key${index ? ' alt' : ''}">${asset.id}</span>`);
  const label = state.compare ? 'Indexed · first close = 100' : state.current.currency + ' · Daily close';
  select('chart-legend').innerHTML = keys.join('') + `<span>${label}</span>`;
  const baseline = points[0].close;
  const last = points.at(-1).close;
  const closes = points.map((point) => point.close);
  const move = change(baseline, last);
  const stats = [
    ['Last close', money(last, state.current.currency), ''],
    ['Period change', signed(move), moveClass(move)],
    ['Highest close', money(Math.max(...closes), state.current.currency), ''],
    ['Lowest close', money(Math.min(...closes), state.current.currency), ''],
  ];
  select('metrics').innerHTML = stats.map(([name, value, tone]) =>
    `<div class="metric"><small>${name}</small><strong class="${tone}">${value}</strong></div>`).join('');
  showSource('source-primary', state.current);
  showSource('source-secondary', state.compare);
  updateReadout();
  drawChart();
}

function updateReadout() {
  const date = state.series[0].points[state.point].date;
  const label = dayLabel.format(new Date(date));
  const values = state.series.map(({ asset, points }) => {
    const point = points[state.point];
    const close = money(point.close, asset.currency);
    return asset.id + ' ' + close + (state.compare ? ' (' + point.value.toFixed(1) + ')' : '');
  }).join(' · ');
  select('chart-date').dateTime = date;
  select('chart-date').textContent = label;
  select('chart-values').textContent = values;
  chart.setAttribute('aria-valuenow', String(state.point + 1));
  chart.setAttribute('aria-valuetext', label + ', ' + values);
}

function movePin(index) {
  const end = state.series[0].points.length - 1;
  const next = Math.max(0, Math.min(index, end));
  if (next === state.point) return;
  state.point = next;
  updateReadout();
  drawChart();
}

let geometry;

function drawChart() {
  if (!state.series.length || !context) return;
  const { width, height } = chart.getBoundingClientRect();
  if (!width || !height) return;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (chart.width !== pixelWidth || chart.height !== pixelHeight) {
    chart.width = pixelWidth;
    chart.height = pixelHeight;
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  const points = state.series[0].points;
  const values = state.series.flatMap((entry) => entry.points.map((point) => point.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.13, max * 0.001);
  const lower = min - pad;
  const upper = max + pad;
  const left = state.compare ? 42 : 63;
  const right = width - 14;
  const top = 13;
  const bottom = height - 27;
  const first = Date.parse(points[0].date);
  const span = Date.parse(points.at(-1).date) - first || day;
  const x = (point) => left + ((Date.parse(point.date) - first) / span) * (right - left);
  const y = (value) => bottom - ((value - lower) / (upper - lower)) * (bottom - top);
  geometry = points.map(x);

  context.font = '11px Manrope, Arial, sans-serif';
  context.lineWidth = 1;
  context.fillStyle = '#53665b';
  context.strokeStyle = '#e4eadf';
  context.textAlign = 'right';
  context.textBaseline = 'middle';
  for (let index = 0; index < 5; index += 1) {
    const value = lower + ((upper - lower) * index) / 4;
    const line = y(value);
    context.beginPath();
    context.moveTo(left, line);
    context.lineTo(right, line);
    context.stroke();
    const symbol = state.current.currency === 'INR' ? '₹' : '$';
    const short = state.compare ? value.toFixed(0) : symbol + Math.round(value).toLocaleString('en-IN');
    context.fillText(short, left - 8, line);
  }
  const tickCount = width < 460 ? 3 : 5;
  context.textBaseline = 'top';
  for (let index = 0; index < tickCount; index += 1) {
    const at = Math.round((index * (points.length - 1)) / (tickCount - 1));
    context.textAlign = index === 0 ? 'left' : index === tickCount - 1 ? 'right' : 'center';
    context.fillText(dayLabel.format(new Date(points[at].date)), x(points[at]), bottom + 9);
  }
  if (!state.compare) {
    const shade = context.createLinearGradient(0, top, 0, bottom);
    shade.addColorStop(0, '#8bca9b56');
    shade.addColorStop(1, '#8bca9b08');
    context.beginPath();
    context.moveTo(x(points[0]), bottom);
    for (const point of points) context.lineTo(x(point), y(point.value));
    context.lineTo(x(points.at(-1)), bottom);
    context.closePath();
    context.fillStyle = shade;
    context.fill();
  }

  const activeX = x(points[state.point]);
  context.strokeStyle = '#657b6b';
  context.setLineDash([3, 4]);
  context.beginPath();
  context.moveTo(activeX, top);
  context.lineTo(activeX, bottom);
  context.stroke();
  context.setLineDash([]);
  for (const [index, entry] of state.series.entries()) {
    context.strokeStyle = colors[index];
    context.lineWidth = 2.25;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.beginPath();
    entry.points.forEach((point, pointIndex) => {
      if (pointIndex === 0) context.moveTo(x(point), y(point.value));
      else context.lineTo(x(point), y(point.value));
    });
    context.stroke();
    context.beginPath();
    context.arc(activeX, y(entry.points[state.point].value), 4, 0, Math.PI * 2);
    context.fillStyle = '#fffffa';
    context.fill();
    context.stroke();
  }
}

function pointAtPointer(event) {
  if (!geometry) return;
  const offset = event.clientX - chart.getBoundingClientRect().left;
  let nearest = 0;
  for (let index = 1; index < geometry.length; index += 1) {
    if (Math.abs(geometry[index] - offset) < Math.abs(geometry[nearest] - offset)) nearest = index;
  }
  movePin(nearest);
}

chart.addEventListener('pointermove', (event) => {
  if (event.pointerType !== 'touch') pointAtPointer(event);
});
chart.addEventListener('click', (event) => {
  if (event.detail > 0) pointAtPointer(event);
});
chart.addEventListener('keydown', (event) => {
  const movement = { ArrowRight: state.point + 1, ArrowUp: state.point + 1, ArrowLeft: state.point - 1, ArrowDown: state.point - 1, Home: 0, End: state.series[0].points.length - 1 };
  if (!Object.hasOwn(movement, event.key)) return;
  event.preventDefault();
  movePin(movement[event.key]);
});
new ResizeObserver(drawChart).observe(chart);
document.fonts.ready.then(drawChart);

for (const button of filters) {
  button.addEventListener('click', () => {
    state.group = button.dataset.filter;
    search.value = '';
    const candidates = assets.filter((asset) => state.group === 'Saved' ? state.saved.has(asset.id) : state.group === asset.group);
    if (candidates.length && !candidates.includes(state.current)) activate(candidates[0]);
    else {
      updatePressedControls();
      renderList();
    }
  });
}

for (const button of ranges) {
  button.addEventListener('click', () => {
    state.days = Number(button.dataset.days);
    updatePressedControls();
    renderSeries();
  });
}
search.addEventListener('input', renderList);
compareSelect.addEventListener('change', () => {
  state.compare = byId.get(compareSelect.value) ?? null;
  renderSeries();
});

select('save-asset').addEventListener('click', () => {
  const id = state.current.id;
  if (state.saved.has(id)) state.saved.delete(id);
  else state.saved.add(id);
  try {
    localStorage.setItem(storeKey, JSON.stringify([...state.saved]));
  } catch {}
  renderSave();
  if (state.group === 'Saved') renderList();
});

function calculateSip() {
  const contribution = select('monthly').valueAsNumber;
  const years = select('years').valueAsNumber;
  const annual = select('annual').valueAsNumber;
  const months = years * 12;
  const perMonth = Math.expm1(Math.log1p(annual / 100) / 12);
  const invested = contribution * months;
  const total = perMonth === 0 ? invested
    : contribution * Math.expm1(months * Math.log1p(perMonth)) / perMonth;
  const difference = total - invested;
  const maximum = Math.max(total, invested);
  select('monthly-label').value = rupees.format(contribution);
  select('years-label').value = years + (years === 1 ? ' yr' : ' yrs');
  select('annual-label').value = annual + '%';
  select('sip-total').value = rupees.format(total);
  select('sip-invested').textContent = rupees.format(invested);
  select('sip-growth-label').textContent = difference < 0 ? 'Estimated loss' : 'Estimated growth';
  select('sip-growth').textContent = rupees.format(difference);
  select('bar-base').style.width = (Math.min(total, invested) / maximum) * 100 + '%';
  select('bar-difference').style.width = (Math.abs(difference) / maximum) * 100 + '%';
  select('bar-difference').parentElement.classList.toggle('negative', difference < 0);
}
select('sip-form').addEventListener('input', calculateSip);
select('sip-form').addEventListener('submit', (event) => event.preventDefault());

const reveal = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('arrived');
      observer.unobserve(entry.target);
    }
  }
}, { threshold: 0.13 });
for (const section of document.querySelectorAll('.reveal')) reveal.observe(section);

const hero = document.querySelector('.hero');
const canHover = matchMedia('(hover: hover) and (pointer: fine)');
let frame = 0;
let slide = 0;
let drift = 0;
let targetX = 0;
function updateHero() {
  frame = 0;
  const target = reduceMotion.matches ? 0 : Math.min(scrollY, hero.offsetHeight) * 0.23;
  slide += (target - slide) * 0.22;
  drift += ((reduceMotion.matches ? 0 : targetX) - drift) * 0.16;
  hero.style.setProperty('--hero-shift', slide + 'px');
  hero.style.setProperty('--hero-x', drift + 'px');
  hero.style.setProperty('--copy-shift', (slide * 0.43) + 'px');
  if (Math.abs(target - slide) + Math.abs(targetX - drift) > 0.16 && !reduceMotion.matches) scheduleHero();
}
function scheduleHero() {
  if (!frame) frame = requestAnimationFrame(updateHero);
}
addEventListener('scroll', () => {
  if (scrollY < hero.offsetHeight * 1.4 || slide < hero.offsetHeight * 0.22) scheduleHero();
}, { passive: true });
hero.addEventListener('pointermove', (event) => {
  if (!canHover.matches || reduceMotion.matches) return;
  targetX = (event.clientX / hero.clientWidth - 0.5) * 26;
  scheduleHero();
});
hero.addEventListener('pointerleave', () => {
  targetX = 0;
  scheduleHero();
});
reduceMotion.addEventListener('change', scheduleHero);
scheduleHero();
renderSnapshot();
activate(state.current);
calculateSip();

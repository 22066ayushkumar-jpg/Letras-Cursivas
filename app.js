import { buildStyles, buildHybridStyles, buildCholaStyles, buildPequenaStyles } from './fonts.js';
import { hydrateIcons, iconSvg } from './icons.js';

const PAGE = 100;
const $ = (id) => document.getElementById(id);

// The broad "todas" landing pages share a pool. The fuentes-de-letras page
// opts into the full catalogue with data-all-styles; the Free Fire page keeps
// its original 500-style selection.
const COMBINING_NAME = /· (Subrayada|Doble Subrayado|Tachada|Barra|Línea Superior|Ondulada|Puntos|Ola Inferior)$/;

function buildBroadStyles() {
  if (!document.body.hasAttribute('data-all-styles')) return buildStyles(500);
  const all = buildStyles(1248);
  // Combining marks are the least portable styles: some systems draw them as
  // boxes. Keep every style, but put the 208 combining variants at the end so
  // the first screen shows the cleanest previews.
  return all
    .filter((s) => !COMBINING_NAME.test(s.name))
    .concat(all.filter((s) => COMBINING_NAME.test(s.name)))
    .map((s, i) => ({ ...s, id: i + 1 }));
}

const toastEl = $('toast');
let toastTimer;

function showToast(msg) {
  if (!toastEl) return;
  toastEl.querySelector('span').textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    ta.remove();
    return ok;
  }
}

// Bonita page: every family except cursiva and gotica — burbujas, cuadrados,
// doble línea, versalitas, ancho completo and the exotic alphabets — ordered
// plain versions first, decorated next and combining-mark styles last, then
// capped at 288 to keep the site-wide count.
function buildBonitaStyles() {
  const pool = buildStyles(1200).filter((s) => !s.tags.includes('cursiva') && !s.tags.includes('gotica'));
  const plain = pool.filter((s) => !s.name.includes('·'));
  const decorated = pool.filter((s) => s.tags.includes('decorada'));
  const combining = pool.filter((s) => s.name.includes('·') && !s.tags.includes('decorada'));
  return [...plain, ...decorated, ...combining].slice(0, 288).map((s, i) => ({ ...s, id: i + 1 }));
}

// Chidas page: the exotic alphabets (Monedas, Tailandesa, Griega, Fantasía,
// asiáticas) plus the bold/gothic/bubble crowd-pleasers, plain versions first,
// decorated next and combining-mark styles last.
const CHIDA_BASES = ['Monedas', 'Tailandesa', 'Griega', 'Fantasía', 'Gótica Negrita', 'Gótica', 'Cursiva Negrita', 'Burbujas', 'Burbujas Negras', 'Cuadrados', 'Cuadrados Negros', 'Doble Línea', 'Versalitas', 'Al Revés', 'Paréntesis', 'Ancho Completo', 'Negrita Sans', 'Negrita Serif'];
function buildChidaStyles() {
  const pool = buildStyles(1248).filter((s) => CHIDA_BASES.some((b) => s.name === b || s.name.startsWith(b + ' ·')));
  const plain = pool.filter((s) => !s.name.includes('·'));
  const decorated = pool.filter((s) => s.tags.includes('decorada'));
  const combining = pool.filter((s) => s.name.includes('·') && !s.tags.includes('decorada'));
  return [...plain, ...decorated, ...combining].slice(0, 320).map((s, i) => ({ ...s, id: i + 1 }));
}

function initGenerator() {
  // Each page picks its own alphabet family: <body data-fontset="cursiva">, "gotica",
  // "gotica-cursiva", "bonita" or "todas" (the broad pool: 500 by default,
  // 1,248 with data-all-styles). Ids are renumbered because buildStyles() orders
  // cursive first, so any other family starts at id 289 and STYLES[id - 1] would
  // resolve to the wrong style.
  const { fontset, defaultText } = document.body.dataset;
  const DEFAULT_TEXT = defaultText || 'Letras Cursivas';
  const POOL = fontset === 'gotica-cursiva'
    ? buildHybridStyles()
    : fontset === 'chola'
      ? buildCholaStyles()
      : fontset === 'pequena'
        ? buildPequenaStyles()
        : fontset === 'chida'
          ? buildChidaStyles()
    : fontset === 'bonita'
      ? buildBonitaStyles()
      : fontset === 'todas'
        ? buildBroadStyles()
        : buildStyles(500).filter((s) => s.tags.includes(fontset || 'cursiva'));
  const STYLES = POOL.map((s, i) => ({ ...s, id: i + 1 }));
  const pageSize = Math.min(200, Math.max(24, Number(document.body.dataset.page) || PAGE));
  // Favorites are stored by id, and ids only mean something inside one family, so the
  // key is namespaced. 'lc-favs' stays the cursiva key: it already holds saved picks.
  // The fuentes page reorders its 1,248 styles, so it gets its own key instead of
  // sharing 'todas' ids with the Free Fire page.
  const favScope = document.body.hasAttribute('data-all-styles') ? 'fuentes' : fontset;
  const FAV_KEY = 'lc-favs' + (favScope && favScope !== 'cursiva' ? `:${favScope}` : '');
  const input = $('input');
  const list = $('list');
  const search = $('search');
  const countEl = $('count');
  const empty = $('empty');
  const moreBtn = $('more');

  let favs = new Set();
  try { favs = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch {}
  let category = 'todas';
  let filtered = [];
  let limit = pageSize;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const currentText = () => (input.value.trim() ? input.value : DEFAULT_TEXT);

  function rowHTML(s, text) {
    const on = favs.has(s.id);
    return `<div class="row" data-id="${s.id}">
    <div class="row-body">
      <div class="row-label">${s.id}. ${esc(s.name)}</div>
      <div class="row-text">${esc(s.convert(text))}</div>
    </div>
    <div class="row-actions">
      <button class="act fav ${on ? 'on' : ''}" data-action="fav" title="Favorita" aria-label="Favorita">${iconSvg('heart')}</button>
      <button class="act copy" data-action="copy" title="Copiar" aria-label="Copiar">${iconSvg('copy')}<span class="copy-label">Copiar</span></button>
    </div>
  </div>`;
  }

  // Spanish thousands separator: 1248 -> 1.248. Intl output depends on the
  // browser's ICU build, so format the groups explicitly.
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  function updateMore() {
    const left = filtered.length - Math.min(limit, filtered.length);
    moreBtn.classList.toggle('hidden', left <= 0);
    if (left > 0) moreBtn.textContent = `Ver más (${fmt(left)} de ${fmt(filtered.length)})`;
  }

  // Only the cards in view need converting. Hidden rows are refreshed when a
  // filter or "Ver más" brings them into view; copying always uses currentText().
  function updateVisibility() {
    const visible = new Set(filtered.slice(0, limit).map((s) => s.id));
    const text = currentText();
    list.querySelectorAll('.row').forEach((row) => {
      const show = visible.has(+row.dataset.id);
      row.classList.toggle('hidden', !show);
      if (!show) return;
      const s = STYLES[+row.dataset.id - 1];
      if (s) row.querySelector('.row-text').textContent = s.convert(text);
    });
    updateMore();
  }

  function renderMore() {
    if (limit >= filtered.length) return updateMore();
    limit = Math.min(limit + pageSize, filtered.length);
    updateVisibility();
  }

  function applyFilter() {
    const q = search.value.trim().toLowerCase();
    filtered = STYLES.filter((s) => {
      if (category === 'favoritas' && !favs.has(s.id)) return false;
      if (category !== 'todas' && category !== 'favoritas' && !s.tags.includes(category)) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
    countEl.textContent = `${fmt(filtered.length)} ${filtered.length === 1 ? 'estilo' : 'estilos'}`;
    empty.classList.toggle('hidden', filtered.length > 0);
    empty.querySelector('p').textContent = category === 'favoritas' && !q
      ? 'Aún no tienes favoritas. Toca el corazón de un estilo para guardarlo.'
      : 'No hay estilos que coincidan.';
    limit = pageSize;
    updateVisibility();
  }

  function refreshText() {
    const text = currentText();
    list.querySelectorAll('.row:not(.hidden)').forEach((row) => {
      const s = STYLES[+row.dataset.id - 1];
      if (!s) return;
      row.querySelector('.row-text').textContent = s.convert(text);
    });
  }

  // The homepage ships its first styles in the HTML. Keep those nodes, refresh
  // them in place and append the rest once; filters only toggle their visibility.
  function hydrateRows() {
    const rows = Array.from(list.querySelectorAll('.row'));
    const canHydrate = rows.length > 0 && rows.length <= STYLES.length
      && rows.every((row, i) => +row.dataset.id === i + 1);
    if (!canHydrate) {
      list.innerHTML = '';
      list.insertAdjacentHTML('beforeend', STYLES.map((s) => rowHTML(s, currentText())).join(''));
      return;
    }
    rows.forEach((row, i) => {
      const s = STYLES[i];
      const label = row.querySelector('.row-label');
      const text = row.querySelector('.row-text');
      const favBtn = row.querySelector('[data-action="fav"]');
      if (label) label.textContent = `${s.id}. ${s.name}`;
      if (text) text.textContent = s.convert(currentText());
      if (favBtn) favBtn.classList.toggle('on', favs.has(s.id));
    });
    if (rows.length < STYLES.length) {
      list.insertAdjacentHTML('beforeend', STYLES.slice(rows.length).map((s) => rowHTML(s, currentText())).join(''));
    }
  }

  list.addEventListener('click', async (e) => {
    const row = e.target.closest('.row');
    if (!row) return;
    const id = +row.dataset.id;
    const s = STYLES[id - 1];
    if (!s) return;
    const favBtn = e.target.closest('[data-action="fav"]');
    if (favBtn) {
      if (favs.has(id)) favs.delete(id); else favs.add(id);
      try { localStorage.setItem(FAV_KEY, JSON.stringify([...favs])); } catch {}
      favBtn.classList.toggle('on', favs.has(id));
      showToast(favs.has(id) ? 'Añadida a favoritas' : 'Quitada de favoritas');
      if (category === 'favoritas' && !favs.has(id)) applyFilter();
      return;
    }
    const out = s.convert(currentText());
    const ok = await copyText(out);
    showToast(ok ? '¡Copiado!' : 'No se pudo copiar');
    if (ok) {
      const label = row.querySelector('.copy-label');
      row.classList.add('copied');
      if (label) label.textContent = '¡Copiado!';
      clearTimeout(row._t);
      row._t = setTimeout(() => {
        row.classList.remove('copied');
        if (label) label.textContent = 'Copiar';
      }, 1200);
    }
  });

  input.addEventListener('input', refreshText);
  $('clearBtn').addEventListener('click', () => { input.value = ''; input.focus(); refreshText(); });
  search.addEventListener('input', applyFilter);

  $('chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === chip));
    category = chip.dataset.cat;
    applyFilter();
  });

  function setView(view) {
    list.classList.toggle('grid', view === 'grid');
    document.querySelectorAll('.vt').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    try { localStorage.setItem('lc-view', view); } catch {}
  }
  document.querySelector('.view-toggle').addEventListener('click', (e) => {
    const b = e.target.closest('.vt');
    if (b) setView(b.dataset.view);
  });
  let savedView = 'grid';
  try { savedView = localStorage.getItem('lc-view') || 'grid'; } catch {}
  setView(savedView);

  moreBtn.addEventListener('click', renderMore);

  hydrateRows();
  applyFilter();
}

function initContactForm() {
  const form = $('contactForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.namedItem('name').value.trim();
    const email = form.elements.namedItem('email').value.trim();
    const message = form.elements.namedItem('message').value.trim();
    const subject = encodeURIComponent(`Contacto desde letrascursivas.es — ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
    window.location.href = `mailto:hola@letrascursivas.es?subject=${subject}&body=${body}`;
    showToast('Abriendo tu correo…');
  });
}

function initAbecedario() {
  document.querySelectorAll('.abc').forEach((abc) => {
    abc.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn || !abc.contains(btn)) return;
      const letter = btn.querySelector('b').textContent;
      const family = abc.dataset.copyLabel || 'gótica';
      const ok = await copyText(btn.querySelector('span').textContent);
      const message = /^\d$/.test(letter) ? `Copiado el ${letter}` : `Copiada la ${letter} ${family}`;
      showToast(ok ? message : 'No se pudo copiar');
      if (!ok) return;
      btn.classList.add('copied');
      clearTimeout(btn._t);
      btn._t = setTimeout(() => btn.classList.remove('copied'), 1200);
    });
  });
}

// Copyable examples and tables added to the homepage guide.
function initCopyables() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const ok = await copyText(btn.dataset.copy);
    showToast(ok ? '¡Copiado!' : 'No se pudo copiar');
    if (!ok) return;
    btn.classList.add('copied');
    clearTimeout(btn._t);
    btn._t = setTimeout(() => btn.classList.remove('copied'), 1200);
  });
}

const year = $('year');
if (year) year.textContent = new Date().getFullYear();

hydrateIcons();
initContactForm();
initAbecedario();
initCopyables();

if ($('input') && $('list') && $('search') && $('count') && $('empty') && $('more') && $('clearBtn') && $('chips') && document.querySelector('.view-toggle')) {
  initGenerator();
}

/* ── Constants ─────────────────────────────────────────────────────────────── */
const MAX_BADGES = 2;
const PAGE_SIZE  = 35;

const PLACEHOLDERS = [
  'Restaurante, sushi, parrilla…',
  'Hotel, hospedaje, cabaña…',
  'Abogado, contador, escribano…',
  'Ferretería, cerrajero, plomero…',
  'Cervecería, bar, cafetería…',
  'Tour, excursión, trekking…',
  'Farmacia, óptica, kinesiología…',
  'Ropa, calzado, regalos…',
  'Supermercado, almacén, dietética…',
  'Dentista, psicólogo, veterinario…',
  'Mecánico, gomería, electricista…',
  'Peluquería, estética, spa…',
];

const ICON = {
  pin:       `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  phone:     `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.46 12 19.79 19.79 0 0 1 1.39 3.41 2 2 0 0 1 3.36 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.36a16 16 0 0 0 5.73 5.73l1.72-1.72a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 14.92z"/></svg>`,
  globe:     `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  whatsapp:  `<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
  nav:       `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
  eye:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
  facebook:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
};

/* ── Embedded business (for /negocio/:slug pages) ───────────────────────────── */
const EMBEDDED_BIZ = (() => {
  const el = document.getElementById('__biz__');
  if (!el) return null;
  try { return JSON.parse(el.textContent); } catch { return null; }
})();

/* ── Embedded ad (for /anuncio/:slug pages) ─────────────────────────────────── */
const EMBEDDED_AD = (() => {
  const el = document.getElementById('__ad__');
  if (!el) return null;
  try { return JSON.parse(el.textContent); } catch { return null; }
})();

/* ── State ─────────────────────────────────────────────────────────────────── */
let allBusinesses   = [];
let activeCategory  = '';
let searchQuery     = '';
let displayedCount  = PAGE_SIZE;
let currentDetailBiz = null;

/* ── Utils ─────────────────────────────────────────────────────────────────── */
function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Fuzzy search (Levenshtein) ─────────────────────────────────────────────── */
function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let row = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const next = a[i-1] === b[j-1] ? row[j-1] : 1 + Math.min(row[j-1], row[j], prev);
      row[j-1] = prev;
      prev = next;
    }
    row[n] = prev;
  }
  return row[n];
}

function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function fuzzyWordMatch(fieldNorm, queryWord) {
  if (queryWord.length < 4) return false;
  const threshold = queryWord.length >= 7 ? 2 : 1;
  const tokens = fieldNorm.split(/\W+/).filter(Boolean);
  return tokens.some(t => {
    if (Math.abs(t.length - queryWord.length) > threshold + 1) return false;
    return levenshtein(queryWord, t) <= threshold;
  });
}

function bizMatchesFuzzy(b, qNorm) {
  const qWords = qNorm.split(/\s+/).filter(w => w.length >= 4);
  if (qWords.length === 0) return false;
  const nameN = stripAccents(b.name.toLowerCase());
  const catsN = b.categories.map(c => stripAccents(c.toLowerCase()));
  const addrN = stripAccents((b.address || '').toLowerCase());
  return qWords.every(qw =>
    fuzzyWordMatch(nameN, qw) ||
    catsN.some(c => fuzzyWordMatch(c, qw)) ||
    fuzzyWordMatch(addrN, qw)
  );
}

function stripAddress(addr) {
  return (addr || '')
    .replace(/,?\s*Argentina\s*$/i, '')
    .replace(/,?\s*Tierra del Fuego\s*$/i, '')
    .replace(/,?\s*V?\d{4}\s+Ushuaia\s*$/i, '')
    .replace(/,?\s*Ushuaia\s*$/i, '')
    .trim();
}

function actionCount(b) {
  const waUrl = b.phone ? whatsappUrl(b.phone) : null;
  return [b.phone, waUrl, b.website, b.address].filter(Boolean).length;
}

function sortByRichness(arr) {
  const rich = arr.filter(b => actionCount(b) >= 3);
  const lean = arr.filter(b => actionCount(b) <  3);
  return [...rich, ...lean];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function siteLinkLabel(url) {
  if (/instagram\.com/i.test(url)) return 'Instagram';
  if (/facebook\.com|fb\.com/i.test(url)) return 'Facebook';
  return 'Sitio web';
}

/* ── Business avatar (initials + deterministic color) ───────────────────────── */
const AVATAR_COLORS = [
  '#C4622D', '#2E5B4F', '#1B6B7B', '#7B4F8A',
  '#B8892A', '#2D4B7B', '#A63D4F', '#5B7B2D',
  '#4F6B8A', '#8A3D2D',
];

function nameHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function avatarInitials(name) {
  const words = name.trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function avatarHTML(name, size = '') {
  const color    = AVATAR_COLORS[nameHash(name) % AVATAR_COLORS.length];
  const initials = avatarInitials(name);
  const cls      = size ? `biz-avatar biz-avatar--${size}` : 'biz-avatar';
  return `<div class="${cls}" style="background:${color}" aria-hidden="true">${initials}</div>`;
}

function whatsappUrl(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return null;
  if (digits.startsWith('549')) return `https://wa.me/${digits}`;
  if (digits.startsWith('54'))  return `https://wa.me/549${digits.slice(2)}`;
  if (digits.startsWith('0'))   return `https://wa.me/549${digits.slice(1)}`;
  return `https://wa.me/549${digits}`;
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)                    return 'hace un momento';
  if (diff < 3600)                  return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400)                 return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 2)             return 'ayer';
  if (diff < 86400 * 7)             return `hace ${Math.floor(diff / 86400)} días`;
  if (diff < 86400 * 14)            return 'hace 1 semana';
  if (diff < 86400 * 30)            return `hace ${Math.floor(diff / (86400 * 7))} semanas`;
  if (diff < 86400 * 60)            return 'hace 1 mes';
  return `hace ${Math.floor(diff / (86400 * 30))} meses`;
}

function resolveAdContact(raw) {
  if (!raw) return null;
  const val = raw.trim();

  // URL completa
  if (/^https?:\/\//i.test(val)) {
    if (/instagram\.com/i.test(val))        return { href: val, label: 'Instagram', icon: 'instagram', cls: 'ig' };
    if (/facebook\.com|fb\.com/i.test(val)) return { href: val, label: 'Facebook',  icon: 'facebook',  cls: 'fb' };
    return { href: val, label: siteLinkLabel(val), icon: 'globe', cls: 'web' };
  }

  // Dominio sin protocolo
  if (/^(www\.)?instagram\.com/i.test(val))        return { href: 'https://' + val, label: 'Instagram', icon: 'instagram', cls: 'ig' };
  if (/^(www\.)?facebook\.com|^fb\.com/i.test(val)) return { href: 'https://' + val, label: 'Facebook',  icon: 'facebook',  cls: 'fb' };

  // @handle → Instagram
  if (/^@[\w.]{1,30}$/.test(val))
    return { href: `https://instagram.com/${val.slice(1)}`, label: val, icon: 'instagram', cls: 'ig' };

  // Teléfono → WhatsApp
  if (/^[\d\s+\-()]{6,}$/.test(val)) {
    const url = whatsappUrl(val);
    return url
      ? { href: url, label: `WhatsApp ${val}`, icon: 'whatsapp', cls: 'wa' }
      : { href: `tel:${val.replace(/\s/g, '')}`, label: val, icon: 'phone', cls: 'phone' };
  }

  return null;
}

/* ── Rotating placeholder ──────────────────────────────────────────────────── */
function startPlaceholderRotation() {
  const input = document.getElementById('search');
  const list  = shuffle(PLACEHOLDERS);
  let   idx   = 0;

  input.placeholder = list[0];

  setInterval(() => {
    if (document.activeElement !== input && !searchQuery) {
      idx = (idx + 1) % list.length;
      input.classList.add('placeholder-fade');
      setTimeout(() => {
        input.placeholder = list[idx];
        input.classList.remove('placeholder-fade');
      }, 200);
    }
  }, 3000);
}

/* ── Category rendering ─────────────────────────────────────────────────────── */
function renderCategories(categories) {
  const strip  = document.getElementById('categories');
  const allBtn = strip.querySelector('[data-category=""]');
  allBtn.addEventListener('click', () => setCategory(''));

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-pill';
    btn.dataset.category = cat;
    btn.textContent = cat;
    btn.addEventListener('click', () => setCategory(cat));
    strip.appendChild(btn);
  });
}

function setCategory(cat) {
  activeCategory = cat;
  displayedCount = PAGE_SIZE;

  document.querySelectorAll('.cat-pill').forEach(b => {
    b.classList.toggle('active', b.dataset.category === cat);
  });

  const activePill = document.querySelector('.cat-pill.active');
  if (activePill) activePill.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });

  updateClearFilters();
  render();
}

/* ── Card badges ────────────────────────────────────────────────────────────── */
function renderBadges(cats, activeCat) {
  if (!cats.length) return '';

  let ordered = activeCat && cats.includes(activeCat)
    ? [activeCat, ...cats.filter(c => c !== activeCat)]
    : [...cats];

  const shown  = ordered.slice(0, MAX_BADGES);
  const extra  = ordered.length - MAX_BADGES;
  const badges = shown
    .map(c => `<button class="cat-badge${c === activeCat ? ' is-active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`)
    .join('');
  const more   = extra > 0 ? `<span class="cat-more">+${extra}</span>` : '';
  return `<div class="card-cats">${badges}${more}</div>`;
}

/* ── Card rendering ─────────────────────────────────────────────────────────── */
function cardHTML(b) {
  const addr  = stripAddress(b.address);
  const waUrl = b.phone ? whatsappUrl(b.phone) : null;
  const gmUrl = b.address
    ? `https://maps.google.com/?q=${encodeURIComponent(b.address + ', Ushuaia, Argentina')}`
    : null;

  const actions = [
    b.phone  ? `<a href="tel:${esc(b.phone)}" class="card-action card-action--call">${ICON.phone}Llamar</a>` : '',
    waUrl    ? `<a href="${esc(waUrl)}" target="_blank" rel="noopener noreferrer" class="card-action card-action--wa">${ICON.whatsapp}WhatsApp</a>` : '',
    b.website ? `<a href="${esc(b.website)}" target="_blank" rel="noopener noreferrer" class="card-action card-action--web">${ICON.globe}${siteLinkLabel(b.website)}</a>` : '',
    gmUrl    ? `<a href="${esc(gmUrl)}" target="_blank" rel="noopener noreferrer" class="card-action card-action--maps">${ICON.nav}Cómo llegar</a>` : '',
  ].filter(Boolean).join('');

  return `
    <article class="card" data-id="${b.id}" data-slug="${esc(b.slug || '')}" role="button" tabindex="0" aria-label="Ver detalle de ${esc(b.name)}">
      <div class="card-head">
        ${avatarHTML(b.name)}
        <div class="card-head-info">
          ${renderBadges(b.categories, activeCategory)}
          <div class="card-name">${esc(b.name)}</div>
        </div>
      </div>
      ${b.description ? `<div class="card-description">${esc(b.description)}</div>` : ''}
      <div class="card-meta">
        ${addr    ? `<div class="card-row">${ICON.pin}<span>${esc(addr)}</span></div>` : ''}
        ${b.phone ? `<div class="card-row">${ICON.phone}<span>${esc(b.phone)}</span></div>` : ''}
      </div>
      ${actions ? `<div class="card-actions">${actions}</div>` : ''}
    </article>`;
}

/* ── Main render ────────────────────────────────────────────────────────────── */
function render() {
  const q  = searchQuery.toLowerCase().trim();
  const qN = q ? stripAccents(q) : '';

  const exactMatch = b => {
    const nameN = stripAccents(b.name.toLowerCase());
    const catsN = b.categories.map(c => stripAccents(c.toLowerCase()));
    const addrN = stripAccents((b.address || '').toLowerCase());
    return nameN.includes(qN) || catsN.some(c => c.includes(qN)) || addrN.includes(qN);
  };

  let filtered = allBusinesses.filter(b => {
    if (!(!activeCategory || b.categories.includes(activeCategory))) return false;
    return !q || exactMatch(b);
  });

  let isFuzzy = false;
  if (q && filtered.length === 0) {
    filtered = allBusinesses.filter(b => {
      if (!(!activeCategory || b.categories.includes(activeCategory))) return false;
      return bizMatchesFuzzy(b, qN);
    });
    isFuzzy = filtered.length > 0;
  }

  const info  = document.getElementById('results-info');
  const total = allBusinesses.length;
  if (isFuzzy) {
    info.textContent = `${filtered.length.toLocaleString('es-AR')} resultado${filtered.length !== 1 ? 's' : ''} aproximado${filtered.length !== 1 ? 's' : ''}`;
  } else {
    info.textContent = filtered.length === total
      ? `${total.toLocaleString('es-AR')} negocios`
      : `${filtered.length.toLocaleString('es-AR')} de ${total.toLocaleString('es-AR')} negocios`;
  }

  const grid         = document.getElementById('grid');
  const loadMoreWrap = document.getElementById('load-more-wrap');

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="state-msg">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <strong>Sin resultados</strong>
        <p>Probá con otro término o categoría.</p>
      </div>`;
    loadMoreWrap.hidden = true;
    return;
  }

  const hasMore = filtered.length > displayedCount;
  grid.innerHTML = filtered.slice(0, displayedCount).map(cardHTML).join('');
  loadMoreWrap.hidden = !hasMore;
}

/* ── Load more button ───────────────────────────────────────────────────────── */
document.getElementById('load-more-btn').addEventListener('click', () => {
  displayedCount += PAGE_SIZE;
  render();
});

/* ── Detail modal ───────────────────────────────────────────────────────────── */
function openDetailBiz(b, pushUrl = true) {
  currentDetailBiz = b;
  document.getElementById('detail-avatar').innerHTML = avatarHTML(b.name, 'lg');
  document.getElementById('detail-cats').innerHTML =
    b.categories.map(c => `<span class="dmodal-cat">${esc(c)}</span>`).join('');
  document.getElementById('detail-name').textContent = b.name;

  const rows = [];
  if (b.address) {
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(b.address + ', Ushuaia, Argentina')}`;
    rows.push(`<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="dmodal-row">
      ${ICON.pin}<span>${esc(stripAddress(b.address))}</span></a>`);
  }
  if (b.phone) {
    rows.push(`<a href="tel:${esc(b.phone)}" class="dmodal-row">
      ${ICON.phone}<span>${esc(b.phone)}</span></a>`);
  }
  if (b.website) {
    rows.push(`<a href="${esc(b.website)}" target="_blank" rel="noopener noreferrer" class="dmodal-row">
      ${ICON.globe}<span>${esc(siteLinkLabel(b.website))}</span></a>`);
  }
  document.getElementById('detail-rows').innerHTML = rows.join('');

  const descEl = document.getElementById('detail-desc');
  descEl.textContent = b.description || '';
  descEl.classList.toggle('hidden', !b.description);

  if (pushUrl && b.slug) {
    history.pushState({ bizSlug: b.slug }, '', `/negocio/${b.slug}`);
  }

  document.getElementById('detail-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function openDetail(id) {
  const b = allBusinesses.find(x => x.id === id);
  if (b) openDetailBiz(b, true);
}

function closeDetail(silent = false) {
  document.getElementById('detail-modal').classList.add('hidden');
  document.body.style.overflow = '';
  if (!silent && location.pathname.startsWith('/negocio/')) {
    history.pushState(null, '', '/');
  }
}

document.getElementById('detail-close').addEventListener('click', () => closeDetail(false));
document.getElementById('detail-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeDetail(false);
});

/* ── Popstate: browser back/forward ────────────────────────────────────────── */
window.addEventListener('popstate', () => {
  const slug = location.pathname.match(/^\/negocio\/(.+)/)?.[1];
  if (slug) {
    const b = allBusinesses.find(x => x.slug === slug);
    if (b) openDetailBiz(b, false);
  } else {
    closeDetail(true);
  }
});

/* ── Chooser modal ──────────────────────────────────────────────────────────── */
function openChooser() {
  document.getElementById('chooser-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeChooser() {
  document.getElementById('chooser-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('fab-sumar').addEventListener('click', () => {
  openChooser();
  window.umami?.track('sumar-click');
});
document.getElementById('chooser-close').addEventListener('click', closeChooser);
document.getElementById('chooser-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeChooser();
});
document.getElementById('chooser-go-negocio').addEventListener('click', () => {
  closeChooser();
  openPropose();
  window.umami?.track('sumar-negocio');
});
document.getElementById('chooser-go-anuncio').addEventListener('click', () => {
  closeChooser();
  openProposeAd();
  window.umami?.track('sumar-anuncio');
});

/* ── Propose modal ──────────────────────────────────────────────────────────── */
function openPropose() {
  document.getElementById('propose-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closePropose() {
  document.getElementById('propose-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('propose-close').addEventListener('click', closePropose);
document.getElementById('propose-cancel').addEventListener('click', closePropose);

document.getElementById('propose-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn   = e.target.querySelector('[type="submit"]');
  const errEl = document.getElementById('p-error');
  btn.disabled = true;
  errEl.textContent = '';

  const body = {
    name:         document.getElementById('p-name').value.trim(),
    categories:   document.getElementById('p-categories').value.trim(),
    address:      document.getElementById('p-address').value.trim(),
    phone:        document.getElementById('p-phone').value.trim(),
    website:      document.getElementById('p-website').value.trim(),
    description:  document.getElementById('p-description').value.trim(),
    contact_name: document.getElementById('p-contact').value.trim(),
    contact_info: document.getElementById('p-contact-info').value.trim(),
  };

  try {
    const res  = await fetch('/api/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.ok) {
      document.getElementById('propose-form').hidden = true;
      document.getElementById('propose-success').classList.remove('hidden');
      window.umami?.track('propuesta-negocio-enviada');
    } else {
      errEl.textContent = data.error || 'Error al enviar la propuesta.';
    }
  } catch {
    errEl.textContent = 'Error de conexión. Intentá de nuevo.';
  } finally {
    btn.disabled = false;
  }
});

/* ── Report modal ───────────────────────────────────────────────────────────── */
let reportTargetBiz = null;

function openReport(biz) {
  reportTargetBiz = biz;
  document.getElementById('report-biz-label').textContent = `Negocio: ${biz.name}`;
  document.getElementById('report-form').hidden = false;
  document.getElementById('report-form').reset();
  document.getElementById('report-success').classList.add('hidden');
  document.getElementById('r-error').textContent = '';
  document.getElementById('report-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeReport() {
  document.getElementById('report-modal').classList.add('hidden');
  document.body.style.overflow = '';
  reportTargetBiz = null;
}

document.getElementById('report-close').addEventListener('click', closeReport);
document.getElementById('report-cancel').addEventListener('click', closeReport);
document.getElementById('report-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeReport();
});

document.getElementById('detail-report').addEventListener('click', () => {
  if (currentDetailBiz) openReport(currentDetailBiz);
});

document.getElementById('report-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn   = e.target.querySelector('[type="submit"]');
  const errEl = document.getElementById('r-error');
  btn.disabled = true;
  errEl.textContent = '';

  const body = {
    business_id:   reportTargetBiz?.id ?? null,
    business_name: reportTargetBiz?.name ?? '',
    type:          document.getElementById('r-type').value,
    message:       document.getElementById('r-message').value.trim(),
    contact_info:  document.getElementById('r-contact').value.trim(),
  };

  try {
    const res  = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.ok) {
      document.getElementById('report-form').hidden = true;
      document.getElementById('report-success').classList.remove('hidden');
    } else {
      errEl.textContent = data.error || 'Error al enviar el reporte.';
    }
  } catch {
    errEl.textContent = 'Error de conexión. Intentá de nuevo.';
  } finally {
    btn.disabled = false;
  }
});

/* ── Escape key ─────────────────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!document.getElementById('propose-ad-modal').classList.contains('hidden')) { closeProposeAd(); return; }
  if (!document.getElementById('chooser-modal').classList.contains('hidden'))    { closeChooser(); return; }
  if (!document.getElementById('ad-modal').classList.contains('hidden'))          { closeAd(); return; }
  if (!document.getElementById('report-modal').classList.contains('hidden'))      { closeReport(); return; }
  if (!document.getElementById('detail-modal').classList.contains('hidden'))      closeDetail(false);
  if (!document.getElementById('propose-modal').classList.contains('hidden'))     closePropose();
});

/* ── Grid click: badge filter OR card detail ────────────────────────────────── */
document.getElementById('grid').addEventListener('click', e => {
  const badge = e.target.closest('.cat-badge');
  if (badge) {
    const cat = badge.dataset.cat;
    setCategory(activeCategory === cat ? '' : cat);
    return;
  }
  if (e.target.closest('a')) return;
  const card = e.target.closest('.card');
  if (card) {
    const id = parseInt(card.dataset.id, 10);
    if (id) openDetail(id);
  }
});

document.getElementById('grid').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const card = e.target.closest('.card');
  if (card) {
    const id = parseInt(card.dataset.id, 10);
    if (id) openDetail(id);
  }
});

/* ── Clear filters ──────────────────────────────────────────────────────────── */
function updateClearFilters() {
  document.getElementById('clear-filters').hidden = !activeCategory && !searchQuery;
}

document.getElementById('clear-filters').addEventListener('click', () => {
  searchQuery    = '';
  displayedCount = PAGE_SIZE;
  document.getElementById('search').value = '';
  document.getElementById('clear-search').hidden = true;
  filterCategoryPills('');
  setCategory('');
});

/* ── Category pill filtering ────────────────────────────────────────────────── */
function filterCategoryPills(q) {
  const qN = q ? stripAccents(q.toLowerCase().trim()) : '';
  document.querySelectorAll('.cat-pill').forEach(btn => {
    if (!btn.dataset.category) return; // keep "Todas" always visible
    const catN = stripAccents(btn.dataset.category.toLowerCase());
    btn.hidden = qN.length > 0 && !catN.includes(qN);
  });
}

/* ── Search ─────────────────────────────────────────────────────────────────── */
const searchInput    = document.getElementById('search');
const clearSearchBtn = document.getElementById('clear-search');

searchInput.addEventListener('input', e => {
  searchQuery    = e.target.value;
  displayedCount = PAGE_SIZE;
  clearSearchBtn.hidden = !searchQuery;
  filterCategoryPills(searchQuery);
  updateClearFilters();
  render();
});

clearSearchBtn.addEventListener('click', () => {
  searchQuery    = '';
  displayedCount = PAGE_SIZE;
  searchInput.value     = '';
  clearSearchBtn.hidden = true;
  filterCategoryPills('');
  updateClearFilters();
  render();
  searchInput.focus();
});

/* ── Ads strip ──────────────────────────────────────────────────────────────── */
function renderAds(ads) {
  const section = document.getElementById('ads-section');
  const strip   = document.getElementById('ads-strip');
  section.classList.remove('hidden');
  strip.innerHTML = ads.map(ad => `
    <article class="ad-card" data-id="${ad.id}" role="listitem" tabindex="0" aria-label="${esc(ad.title)}">
      <img src="${esc(ad.image_path)}" alt="${esc(ad.title)}" loading="lazy">
      <div class="ad-card-overlay"><span class="ad-card-title">${esc(ad.title)}</span></div>
      ${ad.views > 0 ? `<span class="ad-views-badge">${ICON.eye}${ad.views}</span>` : ''}
      ${ad.featured    ? `<span class="ad-featured-badge">⭐</span>` : ''}
    </article>`).join('');

  strip.addEventListener('click', e => {
    const card = e.target.closest('.ad-card');
    if (card) openAd(ads.find(a => a.id === parseInt(card.dataset.id, 10)));
  });
  strip.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const card = e.target.closest('.ad-card');
      if (card) openAd(ads.find(a => a.id === parseInt(card.dataset.id, 10)));
    }
  });
}

function openAd(ad) {
  if (!ad) return;

  // Registrar vista y actualizar badge
  fetch(`/api/ads/${ad.id}/view`, { method: 'POST' }).then(() => {
    ad.views = (ad.views || 0) + 1;
    const card = document.querySelector(`.ad-card[data-id="${ad.id}"]`);
    if (card) {
      let badge = card.querySelector('.ad-views-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'ad-views-badge';
        card.appendChild(badge);
      }
      badge.innerHTML = `${ICON.eye}${ad.views}`;
    }
  }).catch(() => {});

  _currentAdId   = ad.id;
  _currentAdSlug = ad.slug || String(ad.id);
  document.getElementById('ad-modal-img').src     = ad.image_path;
  document.getElementById('ad-modal-img').alt     = ad.title;
  document.getElementById('ad-modal-title').textContent = ad.title;
  document.getElementById('ad-modal-featured').classList.toggle('hidden', !ad.featured);
  document.getElementById('ad-modal-date').textContent  = timeAgo(ad.created_at);

  const descEl    = document.getElementById('ad-modal-desc');
  descEl.textContent = ad.description || '';
  descEl.classList.toggle('hidden', !ad.description);

  const contactEl = document.getElementById('ad-modal-contact');
  const resolved  = resolveAdContact(ad.contact_info);
  if (resolved) {
    contactEl.innerHTML = `<a href="${esc(resolved.href)}" target="_blank" rel="noopener noreferrer" class="ad-contact-link ad-contact-link--${resolved.cls}">${ICON[resolved.icon]}${esc(resolved.label)}</a>`;
    contactEl.classList.remove('hidden');
  } else if (ad.contact_info) {
    contactEl.textContent = ad.contact_info;
    contactEl.classList.remove('hidden');
  } else {
    contactEl.innerHTML = '';
    contactEl.classList.add('hidden');
  }

  document.getElementById('ad-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeAd() {
  document.getElementById('ad-modal').classList.add('hidden');
  document.getElementById('ad-modal-img').src = '';
  document.body.style.overflow = '';
}

document.getElementById('ad-modal-close').addEventListener('click', closeAd);
document.getElementById('ad-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeAd();
});

let _currentAdId   = null;
let _currentAdSlug = null;
document.getElementById('ad-modal-share').addEventListener('click', async () => {
  if (!_currentAdSlug) return;
  const url = `${location.origin}/anuncio/${_currentAdSlug}`;
  const btn = document.getElementById('ad-modal-share');
  await navigator.clipboard.writeText(url).catch(() => {});
  const orig = btn.innerHTML;
  btn.textContent = '¡Link copiado!';
  setTimeout(() => { btn.innerHTML = orig; }, 2000);
});

/* ── Propose-ad modal ───────────────────────────────────────────────────────── */
let selectedAdDuration = 24;

const _adTitleEl      = document.getElementById('ad-title');
const _adDescEl       = document.getElementById('ad-description');
const _adTitleCount   = document.getElementById('ad-title-count');
const _adDescCount    = document.getElementById('ad-desc-count');
const _adUrlPreviewEl = document.getElementById('ad-url-preview');

function _toAdSlug(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);
}

function _updateAdCounter(inputEl, counterEl, max) {
  const remaining = max - inputEl.value.length;
  counterEl.textContent = `${Math.max(0, remaining)} restante${remaining !== 1 ? 's' : ''}`;
  counterEl.classList.toggle('char-counter--warn', remaining <= 15 && remaining >= 0);
  counterEl.classList.toggle('char-counter--over',  remaining < 0);
}

function _updateAdUrlPreview() {
  const slug = _toAdSlug(_adTitleEl.value);
  if (!slug) {
    _adUrlPreviewEl.classList.add('hidden');
    return;
  }
  _adUrlPreviewEl.innerHTML = `<span class="url-domain">ushuaialocal.com/anuncio/</span><span class="url-slug">${slug}</span><span class="url-hint">Así quedará tu enlace para compartir.</span>`;
  _adUrlPreviewEl.classList.remove('hidden');
}

_adTitleEl.addEventListener('input', () => {
  _updateAdCounter(_adTitleEl, _adTitleCount, 60);
  _updateAdUrlPreview();
});
_adDescEl.addEventListener('input',  () => _updateAdCounter(_adDescEl,  _adDescCount,  500));

function openProposeAd() {
  document.getElementById('propose-ad-form').hidden = false;
  document.getElementById('propose-ad-form').reset();
  document.getElementById('propose-ad-success').classList.add('hidden');
  document.getElementById('ad-error').textContent = '';
  document.getElementById('ad-preview-wrap')?.classList.add('hidden');

  _adTitleCount.textContent = '60 restantes';
  _adTitleCount.className   = 'char-counter';
  _adDescCount.textContent  = '500 restantes';
  _adDescCount.className    = 'char-counter';
  _adUrlPreviewEl.classList.add('hidden');

  selectedAdDuration = 24;
  document.querySelectorAll('.duration-pill').forEach((b, i) => b.classList.toggle('active', i === 0));

  document.getElementById('propose-ad-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

document.querySelectorAll('.duration-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.duration-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedAdDuration = parseInt(btn.dataset.hours, 10);
  });
});

function closeProposeAd() {
  document.getElementById('propose-ad-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('propose-ad-close').addEventListener('click', closeProposeAd);
document.getElementById('propose-ad-cancel').addEventListener('click', closeProposeAd);

// Vista previa de imagen
document.getElementById('ad-image').addEventListener('change', e => {
  const file = e.target.files[0];
  const wrap = document.getElementById('ad-preview-wrap');
  if (!wrap) return;
  if (!file) { wrap.classList.add('hidden'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('ad-preview').src = ev.target.result;
    wrap.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

document.getElementById('propose-ad-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn   = e.target.querySelector('[type="submit"]');
  const errEl = document.getElementById('ad-error');
  btn.disabled = true;
  errEl.textContent = '';

  const title       = _adTitleEl.value.trim();
  const description = _adDescEl.value.trim();
  const contactInfo = document.getElementById('ad-contact').value.trim();
  const imageFile   = document.getElementById('ad-image').files[0];

  if (!title)                  { errEl.textContent = 'El título es obligatorio.';                         btn.disabled = false; return; }
  if (title.length > 60)       { errEl.textContent = 'El título no puede superar 60 caracteres.';         btn.disabled = false; return; }
  if (description.length > 500){ errEl.textContent = 'La descripción no puede superar 500 caracteres.';  btn.disabled = false; return; }
  if (contactInfo.length > 200){ errEl.textContent = 'El contacto no puede superar 200 caracteres.';     btn.disabled = false; return; }
  if (!imageFile)              { errEl.textContent = 'Seleccioná una imagen.';                           btn.disabled = false; return; }

  const formData = new FormData();
  formData.append('title',        title);
  formData.append('description',  description);
  formData.append('contact_info', contactInfo);
  formData.append('duration',     selectedAdDuration);
  formData.append('image',        imageFile);

  try {
    const res = await fetch('/api/ads', { method: 'POST', body: formData });
    if (res.status === 413) {
      errEl.textContent = 'La imagen es demasiado grande. Intentá con una foto más pequeña.';
      btn.disabled = false;
      return;
    }
    const data = await res.json();
    if (data.ok) {
      document.getElementById('propose-ad-form').hidden = true;
      document.getElementById('propose-ad-success').classList.remove('hidden');
      window.umami?.track('propuesta-anuncio-enviada');
    } else {
      errEl.textContent = data.error || 'Error al enviar. Intentá de nuevo.';
    }
  } catch {
    errEl.textContent = 'Error de conexión. Intentá de nuevo.';
  } finally {
    btn.disabled = false;
  }
});

/* ── Init ───────────────────────────────────────────────────────────────────── */
/* ── Ticker ─────────────────────────────────────────────────────────────────── */
function renderTicker(messages) {
  if (!messages.length) return;
  const wrap  = document.getElementById('ticker-wrap');
  const track = document.getElementById('ticker-track');

  const items = messages.map(m =>
    `<span class="ticker-item">${esc(m.text)}</span><span class="ticker-sep" aria-hidden="true">✦</span>`
  ).join('');

  // Duplicar para loop sin cortes
  track.innerHTML = items + items;

  // Velocidad proporcional al contenido (~60px/s)
  const totalLen = messages.reduce((s, m) => s + m.text.length, 0);
  const duration = Math.max(15, Math.round(totalLen * 0.38));
  track.style.animationDuration = `${duration}s`;

  wrap.hidden = false;
}

async function init() {
  // Si llegamos por /negocio/:slug o /anuncio/:id, abrir directamente
  if (EMBEDDED_BIZ) openDetailBiz(EMBEDDED_BIZ, false);
  if (EMBEDDED_AD)  openAd(EMBEDDED_AD);

  const [businesses, categories, ads, ticker] = await Promise.all([
    fetch('/api/businesses').then(r => r.json()),
    fetch('/api/categories').then(r => r.json()),
    fetch('/api/ads').then(r => r.json()),
    fetch('/api/ticker').then(r => r.json()).catch(() => []),
  ]);

  allBusinesses = sortByRichness(shuffle(businesses));
  renderCategories(shuffle(categories));
  renderAds(ads);
  renderTicker(ticker);

  const skeleton = document.getElementById('skeleton');
  if (skeleton) skeleton.remove();

  startPlaceholderRotation();
  render();
}

init().catch(() => {
  document.getElementById('grid').innerHTML = `
    <div class="state-msg">
      <strong>Error al cargar los negocios</strong>
      <p>Recargá la página para intentar de nuevo.</p>
    </div>`;
});

let businesses     = [];
let proposals      = [];
let ads            = [];
let reports        = [];
let tickerMessages = [];
let adsFilter      = 'pending';
let sortOrder   = 'name';
let searchQuery = '';

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

async function checkAuth() {
  const { admin } = await fetch('/admin/me').then(r => r.json());
  admin ? showDashboard() : showLogin();
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('dashboard-screen').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard-screen').classList.remove('hidden');
  loadBusinesses();
  loadProposalCount();
  loadAdsCount();
  loadReportsCount();
}

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const res  = await fetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.ok) {
    showDashboard();
  } else {
    document.getElementById('login-error').textContent = data.error || 'Credenciales incorrectas';
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/admin/logout', { method: 'POST' });
  document.getElementById('login-form').reset();
  document.getElementById('login-error').textContent = '';
  showLogin();
});

// ─── Section switching ─────────────────────────────────────────────────────────

document.querySelectorAll('.admin-nav-link[data-section]').forEach(btn => {
  btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

function switchSection(section) {
  document.querySelectorAll('.admin-nav-link[data-section]').forEach(b => {
    b.classList.toggle('active', b.dataset.section === section);
  });

  const sections = ['negocios', 'propuestas', 'anuncios', 'reportes', 'ticker', 'estadisticas'];
  sections.forEach(s => {
    document.getElementById(`section-${s}`).classList.toggle('hidden', s !== section);
    document.getElementById(`topbar-${s}`).classList.toggle('hidden', s !== section);
  });

  const titles = { negocios: 'Negocios', propuestas: 'Propuestas', anuncios: 'Anuncios', reportes: 'Reportes', ticker: 'Ticker', estadisticas: 'Estadísticas' };
  document.getElementById('section-title').textContent = titles[section] || section;

  if (section === 'propuestas')   loadProposals();
  if (section === 'anuncios')     loadAds();
  if (section === 'reportes')     loadReports();
  if (section === 'estadisticas') loadStats();
  if (section === 'ticker')       loadTicker();
}

// ─── Load & render businesses ──────────────────────────────────────────────────

async function loadBusinesses() {
  const res = await fetch('/api/admin/businesses');
  if (!res.ok) { showLogin(); return; }
  businesses = await res.json();
  document.getElementById('biz-count').textContent = `${businesses.length} negocios`;
  renderTable(businesses);
}

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No hay negocios.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(b => `
    <tr class="${b.is_active ? '' : 'inactive'}">
      <td class="col-name">${esc(b.name)}</td>
      <td class="col-cats">${b.categories.map(c => `<span class="cat-tag">${esc(c)}</span>`).join('')}</td>
      <td class="col-addr" title="${esc(b.address)}">${esc(b.address || '—')}</td>
      <td class="col-phone">${esc(b.phone || '—')}</td>
      <td><span class="status ${b.is_active ? 'active' : 'inactive'}">${b.is_active ? 'Activo' : 'Inactivo'}</span></td>
      <td class="actions">
        <button class="btn-edit" data-action="edit" data-id="${b.id}">Editar</button>
        <button class="btn-delete" data-action="delete-biz" data-id="${b.id}">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function getDisplayed() {
  const q = searchQuery.toLowerCase();
  let data = businesses.filter(b =>
    !q ||
    b.name.toLowerCase().includes(q) ||
    b.categories.some(c => c.toLowerCase().includes(q)) ||
    (b.address || '').toLowerCase().includes(q) ||
    (b.phone || '').includes(q)
  );

  if (sortOrder === 'recent') {
    data = [...data].sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at) : 0;
      const db = b.created_at ? new Date(b.created_at) : 0;
      return db - da;
    });
  }
  return data;
}

document.getElementById('admin-search').addEventListener('input', e => {
  searchQuery = e.target.value;
  renderTable(getDisplayed());
});

document.getElementById('sort-select').addEventListener('change', e => {
  sortOrder = e.target.value;
  renderTable(getDisplayed());
});

// ─── Proposals ─────────────────────────────────────────────────────────────────

async function loadProposalCount() {
  try {
    const data = await fetch('/api/admin/proposals').then(r => r.json());
    const count = data.length;
    const badge = document.getElementById('proposal-badge');
    badge.textContent = count;
    badge.hidden = count === 0;
  } catch { /* ignore */ }
}

async function loadProposals() {
  const container = document.getElementById('proposals-list');
  container.innerHTML = '<p class="table-empty">Cargando…</p>';

  try {
    proposals = await fetch('/api/admin/proposals').then(r => r.json());
    renderProposals();

    const count = proposals.length;
    const badge = document.getElementById('proposal-badge');
    badge.textContent = count;
    badge.hidden = count === 0;
    document.getElementById('pending-count').textContent =
      count === 0 ? 'Sin propuestas pendientes' : `${count} pendiente${count !== 1 ? 's' : ''}`;
  } catch {
    container.innerHTML = '<p class="table-empty">Error al cargar las propuestas.</p>';
  }
}

function renderProposals() {
  const container = document.getElementById('proposals-list');
  if (proposals.length === 0) {
    container.innerHTML = `
      <div class="admin-empty">
        <p style="font-size:1.5rem;margin-bottom:.5rem">📭</p>
        <p>No hay propuestas pendientes.</p>
      </div>`;
    return;
  }

  container.innerHTML = proposals.map(p => {
    const cats = p.categories
      ? p.categories.split(',').map(c => `<span class="cat-tag">${esc(c.trim())}</span>`).join('')
      : '';
    const date = new Date(p.created_at).toLocaleDateString('es-AR', { day:'numeric', month:'short', year:'numeric' });

    const infoRows = [
      p.address     ? `<span class="proposal-info-item">📍 ${esc(p.address)}</span>` : '',
      p.phone       ? `<span class="proposal-info-item">📞 ${esc(p.phone)}</span>` : '',
      p.website     ? `<span class="proposal-info-item">🔗 <a href="${esc(p.website)}" target="_blank" rel="noopener noreferrer">${esc(p.website)}</a></span>` : '',
    ].filter(Boolean).join('');

    return `
      <div class="proposal-card" data-id="${p.id}">
        <div class="proposal-header">
          <div class="proposal-header-left">
            <div class="proposal-cats">${cats}</div>
            <h3 class="proposal-name">${esc(p.name)}</h3>
          </div>
          <span class="proposal-date">${date}</span>
        </div>
        ${infoRows ? `<div class="proposal-info">${infoRows}</div>` : ''}
        ${p.description ? `<p class="proposal-desc">${esc(p.description)}</p>` : ''}
        ${(p.contact_name || p.contact_info) ? `
          <div class="proposal-contact">
            <strong>Contacto:</strong>
            ${p.contact_name ? esc(p.contact_name) : ''}${p.contact_name && p.contact_info ? ' — ' : ''}${p.contact_info ? esc(p.contact_info) : ''}
          </div>` : ''}
        <div class="proposal-actions">
          <button class="btn btn-success btn-small" data-action="approve-proposal" data-id="${p.id}">✓ Aprobar</button>
          <button class="btn btn-danger btn-small" data-action="reject-proposal" data-id="${p.id}">✗ Rechazar</button>
        </div>
      </div>`;
  }).join('');
}

async function approveProposal(id) {
  if (!confirm('¿Aprobar esta propuesta? Se creará el negocio y quedará visible en el directorio.')) return;
  const res  = await fetch(`/api/admin/proposals/${id}/approve`, { method: 'POST' });
  const data = await res.json();
  if (data.ok) {
    proposals = proposals.filter(p => p.id !== id);
    renderProposals();
    updateBadgeFromProposals();
    loadBusinesses();
  }
}

async function rejectProposal(id) {
  if (!confirm('¿Rechazar esta propuesta? No se podrá recuperar.')) return;
  const res  = await fetch(`/api/admin/proposals/${id}/reject`, { method: 'POST' });
  const data = await res.json();
  if (data.ok) {
    proposals = proposals.filter(p => p.id !== id);
    renderProposals();
    updateBadgeFromProposals();
  }
}

function updateBadgeFromProposals() {
  const count = proposals.length;
  const badge = document.getElementById('proposal-badge');
  badge.textContent = count;
  badge.hidden = count === 0;
  document.getElementById('pending-count').textContent =
    count === 0 ? 'Sin propuestas pendientes' : `${count} pendiente${count !== 1 ? 's' : ''}`;
}

// ─── Modal: agregar / editar negocio ──────────────────────────────────────────

function openAdd() {
  document.getElementById('modal-title').textContent = 'Agregar negocio';
  document.getElementById('biz-form').reset();
  document.getElementById('biz-id').value = '';
  document.getElementById('biz-active').checked = true;
  document.getElementById('form-error').textContent = '';
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('biz-name').focus();
}

function openEdit(id) {
  const b = businesses.find(b => b.id === id);
  if (!b) return;
  document.getElementById('modal-title').textContent = 'Editar negocio';
  document.getElementById('biz-id').value           = b.id;
  document.getElementById('biz-name').value         = b.name;
  document.getElementById('biz-categories').value   = b.categories.join(', ');
  document.getElementById('biz-address').value      = b.address || '';
  document.getElementById('biz-phone').value        = b.phone || '';
  document.getElementById('biz-website').value      = b.website || '';
  document.getElementById('biz-description').value  = b.description || '';
  document.getElementById('biz-active').checked     = !!b.is_active;
  document.getElementById('form-error').textContent = '';
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('biz-name').focus();
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

document.getElementById('add-btn').addEventListener('click', openAdd);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('cancel-btn').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

document.getElementById('biz-form').addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('biz-id').value;
  const categories = document.getElementById('biz-categories').value
    .split(',').map(s => s.trim()).filter(Boolean);

  const body = {
    name:        document.getElementById('biz-name').value.trim(),
    address:     document.getElementById('biz-address').value.trim(),
    phone:       document.getElementById('biz-phone').value.trim(),
    website:     document.getElementById('biz-website').value.trim(),
    description: document.getElementById('biz-description').value.trim(),
    is_active:   document.getElementById('biz-active').checked,
    categories
  };

  const url    = id ? `/api/admin/businesses/${id}` : '/api/admin/businesses';
  const method = id ? 'PUT' : 'POST';

  const res  = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();

  if (data.ok) {
    closeModal();
    loadBusinesses();
  } else {
    document.getElementById('form-error').textContent = data.error || 'Error al guardar';
  }
});

// ─── Delete ────────────────────────────────────────────────────────────────────

async function deleteBiz(id) {
  const b = businesses.find(b => b.id === id);
  if (!confirm(`¿Eliminar "${b?.name}"?\n\nEsta acción no se puede deshacer.`)) return;
  const res  = await fetch(`/api/admin/businesses/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.ok) loadBusinesses();
}

// ─── Reports ───────────────────────────────────────────────────────────────────

async function loadReportsCount() {
  try {
    const data  = await fetch('/api/admin/reports').then(r => r.json());
    const count = data.filter(r => r.status === 'pending').length;
    const badge = document.getElementById('reports-badge');
    badge.textContent = count;
    badge.hidden = count === 0;
  } catch { /* ignore */ }
}

async function loadReports() {
  const container = document.getElementById('reports-list');
  container.innerHTML = '<p class="table-empty">Cargando reportes…</p>';
  try {
    reports = await fetch('/api/admin/reports').then(r => r.json());
    updateReportsBadge();
    renderReports();
  } catch {
    container.innerHTML = '<p class="table-empty">Error al cargar los reportes.</p>';
  }
}

function updateReportsBadge() {
  const pending = reports.filter(r => r.status === 'pending').length;
  const badge   = document.getElementById('reports-badge');
  badge.textContent = pending;
  badge.hidden = pending === 0;
  document.getElementById('reports-count').textContent =
    `${reports.length} reporte${reports.length !== 1 ? 's' : ''} · ${pending} pendiente${pending !== 1 ? 's' : ''}`;
}

function renderReports() {
  const container = document.getElementById('reports-list');
  if (reports.length === 0) {
    container.innerHTML = `<div class="admin-empty"><p>No hay reportes.</p></div>`;
    return;
  }

  container.innerHTML = reports.map(r => {
    const date     = new Date(r.created_at).toLocaleDateString('es-AR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const resolved = r.status === 'resolved';
    return `
      <div class="proposal-card${resolved ? ' resolved-report' : ''}" data-id="${r.id}">
        <div class="proposal-header">
          <div class="proposal-header-left">
            <div class="proposal-cats">
              <span class="cat-tag">${esc(r.type)}</span>
              ${resolved ? '<span class="cat-tag cat-tag--resolved">Resuelto</span>' : ''}
            </div>
            <h3 class="proposal-name">${esc(r.business_name)}</h3>
          </div>
          <span class="proposal-date">${date}</span>
        </div>
        <p class="proposal-desc">${esc(r.message)}</p>
        ${r.contact_info ? `<div class="proposal-contact"><strong>Contacto:</strong> ${esc(r.contact_info)}</div>` : ''}
        <div class="proposal-actions">
          ${!resolved ? `<button class="btn btn-success btn-small" data-action="resolve-report" data-id="${r.id}">✓ Marcar resuelto</button>` : ''}
          <button class="btn btn-danger btn-small" data-action="delete-report" data-id="${r.id}">Eliminar</button>
        </div>
      </div>`;
  }).join('');
}

async function resolveReport(id) {
  const res  = await fetch(`/api/admin/reports/${id}/resolve`, { method: 'POST' });
  const data = await res.json();
  if (data.ok) {
    reports = reports.map(r => r.id === id ? { ...r, status: 'resolved' } : r);
    updateReportsBadge();
    renderReports();
  }
}

async function deleteReport(id) {
  if (!confirm('¿Eliminar este reporte?')) return;
  const res  = await fetch(`/api/admin/reports/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.ok) {
    reports = reports.filter(r => r.id !== id);
    updateReportsBadge();
    renderReports();
  }
}

// ─── Ads ───────────────────────────────────────────────────────────────────────

async function loadAdsCount() {
  try {
    const data  = await fetch('/api/admin/ads').then(r => r.json());
    const count = data.filter(a => a.status === 'pending').length;
    const badge = document.getElementById('ads-badge');
    badge.textContent = count;
    badge.hidden = count === 0;
  } catch { /* ignore */ }
}

async function loadAds() {
  const container = document.getElementById('ads-list');
  container.innerHTML = '<p class="table-empty">Cargando anuncios…</p>';
  try {
    ads = await fetch('/api/admin/ads').then(r => r.json());
    updateAdsCount();
    renderAds();
  } catch {
    container.innerHTML = '<p class="table-empty">Error al cargar los anuncios.</p>';
  }
}

function updateAdsCount() {
  const pending = ads.filter(a => a.status === 'pending').length;
  const badge   = document.getElementById('ads-badge');
  badge.textContent = pending;
  badge.hidden = pending === 0;
  document.getElementById('ads-count').textContent =
    `${ads.length} anuncio${ads.length !== 1 ? 's' : ''} · ${pending} pendiente${pending !== 1 ? 's' : ''}`;
}

function adDisplayStatus(ad) {
  if (ad.status === 'rejected') return 'rejected';
  if (ad.status === 'active' && ad.expires_at <= new Date().toISOString().split('T')[0]) return 'expired';
  return ad.status;
}

function renderAds() {
  const container = document.getElementById('ads-list');
  const filtered  = adsFilter === 'all'
    ? ads
    : ads.filter(a => adDisplayStatus(a) === adsFilter);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="admin-empty"><p>No hay anuncios en esta categoría.</p></div>`;
    return;
  }

  const statusLabel = { pending: 'Pendiente', active: 'Activo', rejected: 'Rechazado', expired: 'Vencido' };
  const statusCls   = { pending: 'status-pending', active: 'active', rejected: 'inactive', expired: 'inactive' };

  container.innerHTML = filtered.map(ad => {
    const ds   = adDisplayStatus(ad);
    const date = new Date(ad.created_at).toLocaleDateString('es-AR', { day:'numeric', month:'short', year:'numeric' });
    const exp  = new Date(ad.expires_at + 'T00:00:00').toLocaleDateString('es-AR', { day:'numeric', month:'short', year:'numeric' });
    return `
      <div class="proposal-card ad-admin-card" data-id="${ad.id}">
        <div class="ad-admin-row">
          <img class="ad-admin-thumb" src="${esc(ad.image_path)}" alt="${esc(ad.title)}" loading="lazy">
          <div class="ad-admin-info">
            <div class="ad-admin-header">
              <strong class="ad-admin-title">${esc(ad.title)}</strong>
              <span class="status ${statusCls[ds]}">${statusLabel[ds]}</span>
            </div>
            ${ad.description ? `<p class="proposal-desc">${esc(ad.description)}</p>` : ''}
            ${ad.contact_info ? `<p class="proposal-desc">📞 ${esc(ad.contact_info)}</p>` : ''}
            <p class="proposal-desc" style="color:var(--text-muted)">Enviado: ${date} · Vence: ${exp}${ad.slug && ad.status === 'active' ? ` · <a href="/anuncio/${esc(ad.slug)}" target="_blank" rel="noopener" style="color:var(--primary)">/anuncio/${esc(ad.slug)}</a>` : ''}</p>
            <div class="proposal-actions" style="margin-top:0.5rem">
              ${ad.status === 'pending' ? `
                <button class="btn btn-success btn-small" data-action="approve-ad" data-id="${ad.id}">✓ Aprobar</button>
                <button class="btn btn-danger btn-small"  data-action="reject-ad"  data-id="${ad.id}">✗ Rechazar</button>` : ''}
              ${ad.status === 'active' ? `
                <button class="btn btn-ghost btn-small"   data-action="reject-ad"  data-id="${ad.id}">Desactivar</button>` : ''}
              <button class="btn btn-danger btn-small"    data-action="delete-ad"  data-id="${ad.id}">Eliminar</button>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

document.querySelectorAll('[data-ads-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    adsFilter = btn.dataset.adsFilter;
    document.querySelectorAll('[data-ads-filter]').forEach(b => b.classList.toggle('active', b === btn));
    renderAds();
  });
});

async function approveAd(id) {
  const res  = await fetch(`/api/admin/ads/${id}/approve`, { method: 'POST' });
  const data = await res.json();
  if (data.ok) { ads = ads.map(a => a.id === id ? { ...a, status: 'active' } : a); updateAdsCount(); renderAds(); }
}

async function rejectAd(id) {
  if (!confirm('¿Rechazar/desactivar este anuncio? Se eliminará su imagen.')) return;
  const res  = await fetch(`/api/admin/ads/${id}/reject`, { method: 'POST' });
  const data = await res.json();
  if (data.ok) { ads = ads.map(a => a.id === id ? { ...a, status: 'rejected' } : a); updateAdsCount(); renderAds(); }
}

async function deleteAd(id) {
  if (!confirm('¿Eliminar este anuncio permanentemente?')) return;
  const res  = await fetch(`/api/admin/ads/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.ok) { ads = ads.filter(a => a.id !== id); updateAdsCount(); renderAds(); }
}

// ─── Statistics ────────────────────────────────────────────────────────────────

async function loadStats() {
  const container = document.getElementById('stats-container');
  container.innerHTML = '<p class="table-empty">Cargando estadísticas…</p>';
  try {
    const data = await fetch('/api/admin/stats').then(r => r.json());
    renderStats(data);
  } catch {
    container.innerHTML = '<p class="table-empty">Error al cargar las estadísticas.</p>';
  }
}

function pct(num, total) {
  return total ? Math.round((num / total) * 100) : 0;
}

function renderStats(d) {
  const biz        = d.businesses;
  const totalActive = biz.active || 0;
  const total       = biz.total  || 0;

  const phoneP   = pct(biz.with_phone,   total);
  const websiteP = pct(biz.with_website, total);
  const addressP = pct(biz.with_address, total);

  const maxCat = d.top_categories.length ? d.top_categories[0].count : 1;

  const ads = d.ads;
  const proposals = d.proposals;
  const reports   = d.reports;

  document.getElementById('stats-container').innerHTML = `
    <div class="stats-kpi-row">
      <div class="stat-kpi">
        <div class="stat-kpi-value">${totalActive.toLocaleString('es-AR')}</div>
        <div class="stat-kpi-label">Negocios activos</div>
        <div class="stat-kpi-sub">de ${total.toLocaleString('es-AR')} en total</div>
      </div>
      <div class="stat-kpi stat-kpi--green">
        <div class="stat-kpi-value">${(biz.categories || 0).toLocaleString('es-AR')}</div>
        <div class="stat-kpi-label">Categorías únicas</div>
      </div>
      <div class="stat-kpi ${proposals.pending ? 'stat-kpi--warn' : ''}">
        <div class="stat-kpi-value">${(proposals.pending || 0)}</div>
        <div class="stat-kpi-label">Propuestas pendientes</div>
        <div class="stat-kpi-sub">${proposals.total || 0} enviadas en total</div>
      </div>
      <div class="stat-kpi ${ads.active ? 'stat-kpi--green' : ''}">
        <div class="stat-kpi-value">${ads.active || 0}</div>
        <div class="stat-kpi-label">Anuncios activos</div>
        <div class="stat-kpi-sub">${ads.pending || 0} pendiente${ads.pending !== 1 ? 's' : ''} de revisión</div>
      </div>
    </div>

    <div class="stats-cards-row">
      <div class="stat-card">
        <div class="stat-card-title">Cobertura de información</div>
        <div class="stat-progress-list">
          <div class="stat-progress-item">
            <div class="stat-progress-head">
              <span class="stat-progress-name">📞 Teléfono</span>
              <span class="stat-progress-pct">${phoneP}% · ${(biz.with_phone||0).toLocaleString('es-AR')}</span>
            </div>
            <div class="stat-progress-track">
              <div class="stat-progress-fill" style="width:${phoneP}%"></div>
            </div>
          </div>
          <div class="stat-progress-item">
            <div class="stat-progress-head">
              <span class="stat-progress-name">🌐 Sitio web</span>
              <span class="stat-progress-pct">${websiteP}% · ${(biz.with_website||0).toLocaleString('es-AR')}</span>
            </div>
            <div class="stat-progress-track">
              <div class="stat-progress-fill stat-progress-fill--blue" style="width:${websiteP}%"></div>
            </div>
          </div>
          <div class="stat-progress-item">
            <div class="stat-progress-head">
              <span class="stat-progress-name">📍 Dirección</span>
              <span class="stat-progress-pct">${addressP}% · ${(biz.with_address||0).toLocaleString('es-AR')}</span>
            </div>
            <div class="stat-progress-track">
              <div class="stat-progress-fill stat-progress-fill--green" style="width:${addressP}%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-title">Top 10 categorías</div>
        <div class="stat-cat-list">
          ${d.top_categories.map(c => `
            <div class="stat-cat-item">
              <span class="stat-cat-name" title="${esc(c.category)}">${esc(c.category)}</span>
              <div class="stat-cat-bar-wrap">
                <div class="stat-cat-track">
                  <div class="stat-cat-fill" style="width:${pct(c.count, maxCat)}%"></div>
                </div>
                <span class="stat-cat-count">${c.count}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="stats-cards-row">
      <div class="stat-card">
        <div class="stat-card-title">Reportes</div>
        <div class="stat-breakdown">
          <div class="stat-breakdown-item">
            <span class="stat-breakdown-label"><span class="stat-breakdown-dot dot--pending"></span>Pendientes</span>
            <span class="stat-breakdown-val">${reports.pending || 0}</span>
          </div>
          <div class="stat-breakdown-item">
            <span class="stat-breakdown-label"><span class="stat-breakdown-dot dot--ok"></span>Resueltos</span>
            <span class="stat-breakdown-val">${reports.resolved || 0}</span>
          </div>
        </div>
        ${reports.by_type && reports.by_type.length ? `
          <div class="stat-section-sep"></div>
          <div class="stat-breakdown">
            ${reports.by_type.map(t => `
              <div class="stat-breakdown-item">
                <span class="stat-breakdown-label">${esc(t.type)}</span>
                <span class="stat-breakdown-val">${t.count}</span>
              </div>`).join('')}
          </div>` : ''}
      </div>

      <div class="stat-card">
        <div class="stat-card-title">Propuestas y Anuncios</div>
        <div class="stat-breakdown">
          <div class="stat-breakdown-item">
            <span class="stat-breakdown-label"><span class="stat-breakdown-dot dot--pending"></span>Propuestas pendientes</span>
            <span class="stat-breakdown-val">${proposals.pending || 0}</span>
          </div>
          <div class="stat-breakdown-item">
            <span class="stat-breakdown-label"><span class="stat-breakdown-dot dot--ok"></span>Propuestas aprobadas</span>
            <span class="stat-breakdown-val">${proposals.approved || 0}</span>
          </div>
          <div class="stat-breakdown-item">
            <span class="stat-breakdown-label"><span class="stat-breakdown-dot dot--danger"></span>Propuestas rechazadas</span>
            <span class="stat-breakdown-val">${proposals.rejected || 0}</span>
          </div>
        </div>
        <div class="stat-section-sep"></div>
        <div class="stat-breakdown">
          <div class="stat-breakdown-item">
            <span class="stat-breakdown-label"><span class="stat-breakdown-dot dot--pending"></span>Anuncios pendientes</span>
            <span class="stat-breakdown-val">${ads.pending || 0}</span>
          </div>
          <div class="stat-breakdown-item">
            <span class="stat-breakdown-label"><span class="stat-breakdown-dot dot--ok"></span>Anuncios activos</span>
            <span class="stat-breakdown-val">${ads.active || 0}</span>
          </div>
          <div class="stat-breakdown-item">
            <span class="stat-breakdown-label"><span class="stat-breakdown-dot dot--muted"></span>Vencidos</span>
            <span class="stat-breakdown-val">${ads.expired || 0}</span>
          </div>
          <div class="stat-breakdown-item">
            <span class="stat-breakdown-label"><span class="stat-breakdown-dot dot--danger"></span>Rechazados</span>
            <span class="stat-breakdown-val">${ads.rejected || 0}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

document.getElementById('stats-refresh-btn').addEventListener('click', loadStats);

// ─── Event delegation (CSP-safe — no inline onclick) ──────────────────────────

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.dataset.id !== undefined ? +btn.dataset.id : null;
  switch (btn.dataset.action) {
    case 'edit':             openEdit(id);           break;
    case 'delete-biz':       deleteBiz(id);          break;
    case 'approve-proposal': approveProposal(id);    break;
    case 'reject-proposal':  rejectProposal(id);     break;
    case 'resolve-report':   resolveReport(id);      break;
    case 'delete-report':    deleteReport(id);       break;
    case 'approve-ad':       approveAd(id);          break;
    case 'reject-ad':        rejectAd(id);           break;
    case 'delete-ad':        deleteAd(id);           break;
  }
});

// ─── Ticker ────────────────────────────────────────────────────────────────────

async function loadTicker() {
  tickerMessages = await fetch('/admin/ticker').then(r => r.json());
  renderTickerList();
  document.getElementById('ticker-count').textContent =
    `${tickerMessages.filter(m => m.is_active).length} activos · ${tickerMessages.length} total`;
}

function renderTickerList() {
  const container = document.getElementById('ticker-list');
  if (!tickerMessages.length) {
    container.innerHTML = '<p class="table-empty">No hay mensajes. Agregá el primero.</p>';
    return;
  }
  container.innerHTML = tickerMessages.map(m => `
    <div class="ticker-row ${m.is_active ? '' : 'ticker-row--off'}">
      <span class="ticker-row-text">${esc(m.text)}</span>
      <div class="ticker-row-actions">
        <button class="btn btn-ghost btn-small" onclick="toggleTicker(${m.id})">
          ${m.is_active ? 'Desactivar' : 'Activar'}
        </button>
        <button class="btn btn-danger btn-small" onclick="deleteTicker(${m.id})">Eliminar</button>
      </div>
    </div>`).join('');
}

async function toggleTicker(id) {
  await fetch(`/admin/ticker/${id}/toggle`, { method: 'PATCH' });
  loadTicker();
}

async function deleteTicker(id) {
  if (!confirm('¿Eliminar este mensaje del ticker?')) return;
  await fetch(`/admin/ticker/${id}`, { method: 'DELETE' });
  loadTicker();
}

document.getElementById('ticker-form').addEventListener('submit', async e => {
  e.preventDefault();
  const text  = document.getElementById('ticker-text').value.trim();
  const errEl = document.getElementById('ticker-error');
  errEl.textContent = '';
  const res  = await fetch('/admin/ticker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (data.error) { errEl.textContent = data.error; return; }
  document.getElementById('ticker-text').value = '';
  loadTicker();
});

// ─── Init ──────────────────────────────────────────────────────────────────────

checkAuth();

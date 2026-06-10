const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { getDb } = require('../db');

const INDEX_PATH = path.join(__dirname, '../public/index.html');

// Cache del template en memoria — se carga una sola vez al arrancar
let _template = null;
function getTemplate() {
  if (!_template) _template = fs.readFileSync(INDEX_PATH, 'utf8');
  return _template;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// GET /negocio/:slug
router.get('/:slug', (req, res) => {
  const row = getDb().prepare(`
    SELECT
      b.id, b.name, b.address, b.phone, b.website, b.description, b.slug,
      GROUP_CONCAT(bc.category, '|') AS categories
    FROM businesses b
    LEFT JOIN business_categories bc ON bc.business_id = b.id
    WHERE b.slug = ? AND b.is_active = 1
    GROUP BY b.id
  `).get(req.params.slug);

  if (!row) return res.redirect('/');

  const biz = { ...row, categories: row.categories ? row.categories.split('|') : [] };

  // ── Meta content ──────────────────────────────────────────────────────────
  const catStr  = biz.categories.slice(0, 2).join(', ');
  const addr    = (biz.address || '').replace(/,?\s*Argentina\s*$/i, '').trim();
  const base    = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const ogUrl   = `${base}/negocio/${biz.slug}`;

  const pageTitle = `${biz.name}${catStr ? ' — ' + catStr : ''} en Ushuaia | Ushuaia Local`;

  const metaDesc  = [
    catStr ? `${catStr} en Ushuaia.` : 'Negocio en Ushuaia.',
    addr   ? `${addr}.`             : '',
    biz.description                 || '',
  ].filter(Boolean).join(' ').slice(0, 160);

  // ── JSON-LD (LocalBusiness schema) ───────────────────────────────────────
  const schema = {
    '@context': 'https://schema.org',
    '@type':    'LocalBusiness',
    name:       biz.name,
    url:        ogUrl,
    ...(addr ? {
      address: {
        '@type':         'PostalAddress',
        streetAddress:   addr,
        addressLocality: 'Ushuaia',
        addressRegion:   'Tierra del Fuego',
        addressCountry:  'AR',
      }
    } : {}),
    ...(biz.phone       ? { telephone:   biz.phone       } : {}),
    ...(biz.website     ? { sameAs:      biz.website     } : {}),
    ...(biz.description ? { description: biz.description } : {}),
    ...(catStr          ? { description: `${catStr} en Ushuaia. ${biz.description || ''}`.trim() } : {}),
  };

  // ── Inject into index.html ────────────────────────────────────────────────
  const bizJson = JSON.stringify(biz).replace(/</g, '\\u003c');

  const ogImage = `${base}/ulocal.png`;

  const headInject = `
  <meta property="og:title"       content="${esc(pageTitle)}">
  <meta property="og:description" content="${esc(metaDesc)}">
  <meta property="og:type"        content="place">
  <meta property="og:url"         content="${esc(ogUrl)}">
  <meta property="og:image"       content="${esc(ogImage)}">
  <meta property="twitter:card"        content="summary">
  <meta property="twitter:title"       content="${esc(pageTitle)}">
  <meta property="twitter:description" content="${esc(metaDesc)}">
  <meta property="twitter:image"       content="${esc(ogImage)}">
  <link rel="canonical"           href="${esc(ogUrl)}">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>`;

  const bodyInject = `
  <script id="__biz__" type="application/json">${bizJson}</script>
  <noscript>
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:2rem auto;padding:1.5rem;line-height:1.6">
      <h1 style="margin-bottom:.5rem">${esc(biz.name)}</h1>
      ${catStr ? `<p style="color:#6B5B47">${esc(catStr)}</p>` : ''}
      ${addr   ? `<p>📍 ${esc(addr)}, Ushuaia</p>`            : ''}
      ${biz.phone   ? `<p>📞 <a href="tel:${esc(biz.phone)}">${esc(biz.phone)}</a></p>` : ''}
      ${biz.website ? `<p>🔗 <a href="${esc(biz.website)}">${esc(biz.website)}</a></p>` : ''}
      ${biz.description ? `<p>${esc(biz.description)}</p>`    : ''}
      <p style="margin-top:1.5rem"><a href="/">← Volver al directorio</a></p>
    </div>
  </noscript>`;

  let html;
  try {
    html = getTemplate();
  } catch {
    return res.redirect('/');
  }

  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(pageTitle)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/,`$1${esc(metaDesc)}$2`)
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/g, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/g, '')
    .replace('</head>', `${headInject}\n</head>`)
    .replace('</body>', `${bodyInject}\n</body>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

module.exports = router;

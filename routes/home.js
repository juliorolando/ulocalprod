const express  = require('express');
const router   = express.Router();
const fs       = require('fs');
const path     = require('path');
const { getDb } = require('../db');

const INDEX_PATH = path.join(__dirname, '../public/index.html');
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

router.get('/', (req, res, next) => {
  try {
    const db = getDb();

    const businesses = db.prepare(`
      SELECT b.id, b.name, b.address, b.phone, b.website, b.description, b.slug,
             GROUP_CONCAT(bc.category, '|') AS categories
      FROM businesses b
      LEFT JOIN business_categories bc ON bc.business_id = b.id
      WHERE b.is_active = 1
      GROUP BY b.id
      ORDER BY b.name COLLATE NOCASE ASC
    `).all().map(b => ({ ...b, categories: b.categories ? b.categories.split('|') : [] }));

    const categories = db.prepare(`
      SELECT DISTINCT bc.category
      FROM business_categories bc
      JOIN businesses b ON b.id = bc.business_id
      WHERE b.is_active = 1
      ORDER BY bc.category COLLATE NOCASE ASC
    `).all().map(r => r.category);

    const base = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

    // ── JSON-LD (ItemList schema) ──────────────────────────────────────────────
    const schema = {
      '@context': 'https://schema.org',
      '@type':    'ItemList',
      name:       'Directorio de negocios de Ushuaia',
      description:`${businesses.length} comercios, restaurantes, hoteles y servicios en Ushuaia, Tierra del Fuego, Argentina.`,
      numberOfItems: businesses.length,
      itemListElement: businesses.slice(0, 200).map((b, i) => ({
        '@type':    'ListItem',
        position:   i + 1,
        item: {
          '@type':  'LocalBusiness',
          name:     b.name,
          url:      `${base}/negocio/${b.slug}`,
          ...(b.address ? {
            address: {
              '@type':         'PostalAddress',
              streetAddress:   b.address,
              addressLocality: 'Ushuaia',
              addressRegion:   'Tierra del Fuego',
              addressCountry:  'AR',
            }
          } : {}),
          ...(b.phone   ? { telephone:   b.phone   } : {}),
          ...(b.website ? { sameAs:      b.website } : {}),
        },
      })),
    };

    // ── Data island (app.js lo consume para evitar el fetch a /api/businesses) ─
    const initJson = JSON.stringify({ businesses, categories }).replace(/</g, '\\u003c');

    // ── Noscript: lista HTML con links a cada negocio ─────────────────────────
    const noscriptItems = businesses.map(b => {
      const cats = b.categories.slice(0, 2).join(', ');
      return `<li><a href="/negocio/${esc(b.slug)}">${esc(b.name)}${cats ? ' — ' + esc(cats) : ''}</a></li>`;
    }).join('');

    const headInject = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
    const bodyInject =
      `<script id="__init__" type="application/json">${initJson}</script>\n` +
      `<noscript><div style="font-family:system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:1.5rem">` +
      `<h1>Directorio de negocios — Ushuaia Local</h1>` +
      `<p>${businesses.length} comercios y servicios en Ushuaia, Argentina.</p>` +
      `<ul style="columns:2;gap:2rem;list-style:none;padding:0;line-height:2">${noscriptItems}</ul>` +
      `</div></noscript>`;

    let html;
    try { html = getTemplate(); } catch { return next(); }

    html = html
      .replace('</head>', `${headInject}\n</head>`)
      .replace('</body>', `${bodyInject}\n</body>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(html);
  } catch (e) {
    next(e);
  }
});

module.exports = router;

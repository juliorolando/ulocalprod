const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
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

// GET /anuncio/:slug
router.get('/:slug', (req, res) => {
  const slug = req.params.slug;
  if (!slug) return res.redirect('/');

  const ad = getDb().prepare(`
    SELECT id, slug, title, description, image_path, contact_info, expires_at, created_at, views, featured
    FROM ads
    WHERE slug = ? AND status = 'active' AND expires_at >= date('now')
  `).get(slug);

  if (!ad) {
    console.log(`[anuncio] not found — slug="${slug}" date="${new Date().toISOString()}"`);
    return res.redirect('/');
  }

  const base      = `${req.protocol}://${req.get('host')}`;
  const ogUrl     = `${base}/anuncio/${ad.slug}`;
  const ogImage   = `${base}${ad.image_path}`;
  const pageTitle = `${ad.title} — Ushuaia Local`;
  const metaDesc  = (ad.description || 'Anuncio en Ushuaia Local — el directorio más austral.').slice(0, 160);

  const headInject = `
  <meta property="og:title"        content="${esc(pageTitle)}">
  <meta property="og:description"  content="${esc(metaDesc)}">
  <meta property="og:type"         content="article">
  <meta property="og:url"          content="${esc(ogUrl)}">
  <meta property="og:image"        content="${esc(ogImage)}">
  <meta property="og:image:width"  content="1080">
  <meta property="og:image:height" content="1080">
  <meta property="twitter:card"        content="summary_large_image">
  <meta property="twitter:title"       content="${esc(pageTitle)}">
  <meta property="twitter:description" content="${esc(metaDesc)}">
  <meta property="twitter:image"       content="${esc(ogImage)}">
  <link rel="canonical" href="${esc(ogUrl)}">`;

  const adJson     = JSON.stringify(ad).replace(/</g, '\\u003c');
  const bodyInject = `<script id="__ad__" type="application/json">${adJson}</script>`;

  let html;
  try { html = getTemplate(); } catch { return res.redirect('/'); }

  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(pageTitle)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/,`$1${esc(metaDesc)}$2`)
    .replace('</head>', `${headInject}\n</head>`)
    .replace('</body>', `${bodyInject}\n</body>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

module.exports = router;

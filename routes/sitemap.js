const express  = require('express');
const router   = express.Router();
const { getDb } = require('../db');

router.get('/', (req, res) => {
  const base = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const db   = getDb();

  const businesses = db.prepare(
    `SELECT slug FROM businesses WHERE is_active = 1 ORDER BY name COLLATE NOCASE ASC`
  ).all();

  const ads = db.prepare(
    `SELECT slug FROM ads WHERE status = 'active' AND expires_at >= date('now')`
  ).all();

  const loc = url => `  <url><loc>${base}${url}</loc></url>`;

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${base}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...businesses.map(b => loc(`/negocio/${b.slug}`)),
    ...ads.map(a => loc(`/anuncio/${a.slug}`)),
    '</urlset>',
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

module.exports = router;

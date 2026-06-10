const express    = require('express');
const router     = express.Router();
const path       = require('path');
const fs         = require('fs');
const crypto     = require('crypto');
const multer     = require('multer');
const sharp      = require('sharp');
const rateLimit  = require('express-rate-limit');
const { getDb, ensureUniqueSlug, ensureUniqueAdSlug } = require('../db');

const adLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Límite de anuncios por hora alcanzado.' },
});

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Límite de reportes por hora alcanzado.' },
});

/* ── Multer: subida de imágenes de anuncios ─────────────────────────────────── */
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'ads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function safeUnlinkAd(imagePath) {
  const resolved = path.resolve(path.join(__dirname, '..', 'public', imagePath));
  const allowed  = path.resolve(UPLOADS_DIR);
  if (resolved.startsWith(allowed + path.sep)) fs.unlink(resolved, () => {});
}

const uploadAd = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    /^image\/(jpeg|png|webp)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Solo se permiten imágenes JPEG, PNG o WEBP.'));
  },
});

function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.status(401).json({ error: 'No autorizado' });
}

// GET /api/businesses
router.get('/businesses', (req, res) => {
  const rows = getDb().prepare(`
    SELECT
      b.id, b.name, b.address, b.phone, b.website, b.description, b.slug,
      GROUP_CONCAT(bc.category, '|') as categories
    FROM businesses b
    LEFT JOIN business_categories bc ON bc.business_id = b.id
    WHERE b.is_active = 1
    GROUP BY b.id
    ORDER BY b.name COLLATE NOCASE ASC
  `).all();

  res.json(rows.map(b => ({ ...b, categories: b.categories ? b.categories.split('|') : [] })));
});

// GET /api/categories
router.get('/categories', (req, res) => {
  const rows = getDb().prepare(`
    SELECT DISTINCT bc.category
    FROM business_categories bc
    JOIN businesses b ON b.id = bc.business_id
    WHERE b.is_active = 1
    ORDER BY bc.category COLLATE NOCASE ASC
  `).all();
  res.json(rows.map(r => r.category));
});

// GET /api/admin/businesses
router.get('/admin/businesses', requireAuth, (req, res) => {
  const rows = getDb().prepare(`
    SELECT
      b.id, b.name, b.address, b.phone, b.website, b.description, b.is_active, b.created_at,
      GROUP_CONCAT(bc.category, '|') as categories
    FROM businesses b
    LEFT JOIN business_categories bc ON bc.business_id = b.id
    GROUP BY b.id
    ORDER BY b.name COLLATE NOCASE ASC
  `).all();

  res.json(rows.map(b => ({ ...b, categories: b.categories ? b.categories.split('|') : [] })));
});

// POST /api/admin/businesses
router.post('/admin/businesses', requireAuth, (req, res) => {
  const { name, address, phone, website, description, is_active, categories } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

  const db   = getDb();
  const slug = ensureUniqueSlug(db, name.trim());
  const { lastInsertRowid: id } = db.prepare(`
    INSERT INTO businesses (name, address, phone, website, description, is_active, slug)
    VALUES (@name, @address, @phone, @website, @description, @is_active, @slug)
  `).run({
    name: name.trim(),
    address: (address || '').trim(),
    phone: (phone || '').trim(),
    website: (website || '').trim(),
    description: (description || '').trim(),
    is_active: is_active ? 1 : 0,
    slug,
  });

  if (Array.isArray(categories)) {
    const insertCat = db.prepare(`INSERT OR IGNORE INTO business_categories (business_id, category) VALUES (?, ?)`);
    for (const cat of categories) {
      if (cat.trim()) insertCat.run(id, cat.trim());
    }
  }

  res.json({ ok: true, id });
});

// PUT /api/admin/businesses/:id
router.put('/admin/businesses/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { name, address, phone, website, description, is_active, categories } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

  const db = getDb();
  db.prepare(`
    UPDATE businesses SET
      name = @name, address = @address, phone = @phone, website = @website,
      description = @description, is_active = @is_active,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({
    id,
    name: name.trim(),
    address: (address || '').trim(),
    phone: (phone || '').trim(),
    website: (website || '').trim(),
    description: (description || '').trim(),
    is_active: is_active ? 1 : 0
  });

  if (Array.isArray(categories)) {
    db.prepare(`DELETE FROM business_categories WHERE business_id = ?`).run(id);
    const insertCat = db.prepare(`INSERT OR IGNORE INTO business_categories (business_id, category) VALUES (?, ?)`);
    for (const cat of categories) {
      if (cat.trim()) insertCat.run(id, cat.trim());
    }
  }

  res.json({ ok: true });
});

// DELETE /api/admin/businesses/:id
router.delete('/admin/businesses/:id', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare(`DELETE FROM business_categories WHERE business_id = ?`).run(req.params.id);
  db.prepare(`DELETE FROM businesses WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// POST /api/propose  (public — no auth)
router.post('/propose', (req, res) => {
  const { name, categories, address, phone, website, description, contact_name, contact_info } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre del negocio es obligatorio' });
  if (!contact_info || !contact_info.trim()) return res.status(400).json({ error: 'El contacto es obligatorio' });

  const maxLengths = { name: 200, categories: 200, address: 300, phone: 50, website: 500, description: 1000, contact_name: 200, contact_info: 200 };
  for (const [field, max] of Object.entries(maxLengths)) {
    if (req.body[field] && String(req.body[field]).length > max) {
      return res.status(400).json({ error: `El campo "${field}" excede el máximo permitido.` });
    }
  }

  getDb().prepare(`
    INSERT INTO proposals (name, categories, address, phone, website, description, contact_name, contact_info)
    VALUES (@name, @categories, @address, @phone, @website, @description, @contact_name, @contact_info)
  `).run({
    name:         name.trim(),
    categories:   (categories   || '').trim(),
    address:      (address      || '').trim(),
    phone:        (phone        || '').trim(),
    website:      (website      || '').trim(),
    description:  (description  || '').trim(),
    contact_name: (contact_name || '').trim(),
    contact_info: (contact_info || '').trim(),
  });

  res.json({ ok: true });
});

const VALID_REPORT_TYPES = ['Información incorrecta', 'Falta información', 'Negocio cerrado', 'Otro'];

// POST /api/report  (public — no auth)
router.post('/report', reportLimiter, (req, res) => {
  const { business_id, business_name, type, message, contact_info } = req.body;

  if (!business_name || !business_name.trim()) return res.status(400).json({ error: 'Falta el negocio.' });
  if (business_name.length > 200)              return res.status(400).json({ error: 'Nombre de negocio demasiado largo.' });
  if (!type || !VALID_REPORT_TYPES.includes(type.trim())) return res.status(400).json({ error: 'Tipo de reporte inválido.' });
  if (!message || !message.trim())             return res.status(400).json({ error: 'Escribí un mensaje.' });
  if (message.length > 1000)                   return res.status(400).json({ error: 'El mensaje es demasiado largo.' });
  if (contact_info && contact_info.length > 200) return res.status(400).json({ error: 'Contacto demasiado largo.' });

  const bizId = business_id ? parseInt(business_id, 10) : null;
  if (business_id && (!Number.isInteger(bizId) || bizId <= 0)) return res.status(400).json({ error: 'ID de negocio inválido.' });

  getDb().prepare(`
    INSERT INTO reports (business_id, business_name, type, message, contact_info)
    VALUES (@business_id, @business_name, @type, @message, @contact_info)
  `).run({
    business_id:   bizId,
    business_name: business_name.trim(),
    type:          type.trim(),
    message:       message.trim(),
    contact_info:  (contact_info || '').trim(),
  });

  res.json({ ok: true });
});

// GET /api/ticker  (public — mensajes activos ordenados)
router.get('/ticker', (req, res) => {
  const rows = getDb().prepare(`
    SELECT id, text FROM ticker_messages
    WHERE is_active = 1
    ORDER BY sort_order ASC, id ASC
  `).all();
  res.json(rows);
});

// GET /api/ads  (public — activos y no vencidos)
router.get('/ads', (req, res) => {
  const rows = getDb().prepare(`
    SELECT id, slug, title, description, image_path, contact_info, expires_at, created_at, views
    FROM ads
    WHERE status = 'active' AND expires_at > date('now')
    ORDER BY created_at DESC
  `).all();
  res.json(rows);
});

// POST /api/ads/:id/view  (public — registra una vista)
router.post('/ads/:id/view', (req, res) => {
  getDb().prepare(`UPDATE ads SET views = views + 1 WHERE id = ? AND status = 'active'`).run(req.params.id);
  res.json({ ok: true });
});

// POST /api/ads  (public — propuesta de anuncio)
router.post('/ads', adLimiter, (req, res, next) => {
  uploadAd.single('image')(req, res, err => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'La imagen no puede superar 20MB.' });
      return res.status(400).json({ error: err.message });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'La imagen es obligatoria.' });

  const { title, description, contact_info, duration } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'El título es obligatorio.' });
  if (title.length > 60) return res.status(400).json({ error: 'El título no puede superar 60 caracteres.' });

  const VALID_DURATIONS = [24, 48, 120];
  const durationHours   = parseInt(duration, 10);
  if (!VALID_DURATIONS.includes(durationHours)) return res.status(400).json({ error: 'Duración inválida.' });

  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
  const outPath  = path.join(UPLOADS_DIR, filename);

  try {
    await sharp(req.file.buffer)
      .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outPath);
  } catch {
    return res.status(500).json({ error: 'Error al procesar la imagen. Intentá con otro archivo.' });
  }

  const cleanExpiry = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString().split('T')[0];

  const db   = getDb();
  const slug = ensureUniqueAdSlug(db, title.trim());
  db.prepare(`
    INSERT INTO ads (title, slug, description, image_path, contact_info, expires_at)
    VALUES (@title, @slug, @description, @image_path, @contact_info, @expires_at)
  `).run({
    title:        title.trim(),
    slug,
    description:  (description  || '').trim().slice(0, 500),
    image_path:   `/uploads/ads/${filename}`,
    contact_info: (contact_info || '').trim().slice(0, 200),
    expires_at:   cleanExpiry,
  });

  res.json({ ok: true });
});

// GET /api/admin/ads
router.get('/admin/ads', requireAuth, (req, res) => {
  const rows = getDb().prepare(`
    SELECT *, (expires_at <= date('now')) as expired
    FROM ads ORDER BY created_at DESC
  `).all();
  res.json(rows);
});

// POST /api/admin/ads/:id/approve
router.post('/admin/ads/:id/approve', requireAuth, (req, res) => {
  getDb().prepare(`UPDATE ads SET status = 'active' WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// POST /api/admin/ads/:id/reject
router.post('/admin/ads/:id/reject', requireAuth, (req, res) => {
  const ad = getDb().prepare(`SELECT image_path FROM ads WHERE id = ?`).get(req.params.id);
  if (ad) {
    getDb().prepare(`UPDATE ads SET status = 'rejected' WHERE id = ?`).run(req.params.id);
    safeUnlinkAd(ad.image_path);
  }
  res.json({ ok: true });
});

// DELETE /api/admin/ads/:id
router.delete('/admin/ads/:id', requireAuth, (req, res) => {
  const ad = getDb().prepare(`SELECT image_path FROM ads WHERE id = ?`).get(req.params.id);
  if (ad) {
    getDb().prepare(`DELETE FROM ads WHERE id = ?`).run(req.params.id);
    safeUnlinkAd(ad.image_path);
  }
  res.json({ ok: true });
});

// GET /api/admin/stats
router.get('/admin/stats', requireAuth, (req, res) => {
  const db = getDb();

  const biz = db.prepare(`
    SELECT
      COUNT(*)                                                              AS total,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END)                       AS active,
      SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END)                       AS inactive,
      SUM(CASE WHEN phone    != '' AND phone    IS NOT NULL THEN 1 ELSE 0 END) AS with_phone,
      SUM(CASE WHEN website  != '' AND website  IS NOT NULL THEN 1 ELSE 0 END) AS with_website,
      SUM(CASE WHEN address  != '' AND address  IS NOT NULL THEN 1 ELSE 0 END) AS with_address
    FROM businesses
  `).get();

  const totalCats = db.prepare(`
    SELECT COUNT(DISTINCT bc.category) AS count
    FROM business_categories bc
    JOIN businesses b ON b.id = bc.business_id
    WHERE b.is_active = 1
  `).get().count;

  const topCats = db.prepare(`
    SELECT bc.category, COUNT(*) AS count
    FROM business_categories bc
    JOIN businesses b ON b.id = bc.business_id
    WHERE b.is_active = 1
    GROUP BY bc.category
    ORDER BY count DESC
    LIMIT 10
  `).all();

  const proposals = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
    FROM proposals
  `).get();

  const reports = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
    FROM reports
  `).get();

  const reportsByType = db.prepare(`
    SELECT type, COUNT(*) AS count FROM reports GROUP BY type ORDER BY count DESC
  `).all();

  const adsRow = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'pending'                              THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'active'  AND expires_at >= date('now') THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN status = 'active'  AND expires_at <  date('now') THEN 1 ELSE 0 END) AS expired,
      SUM(CASE WHEN status = 'rejected'                             THEN 1 ELSE 0 END) AS rejected
    FROM ads
  `).get();

  res.json({
    businesses:    { ...biz, categories: totalCats },
    top_categories: topCats,
    proposals,
    reports:       { ...reports, by_type: reportsByType },
    ads:           adsRow,
  });
});

// GET /api/admin/reports
router.get('/admin/reports', requireAuth, (req, res) => {
  const rows = getDb().prepare(`SELECT * FROM reports ORDER BY created_at DESC`).all();
  res.json(rows);
});

// POST /api/admin/reports/:id/resolve
router.post('/admin/reports/:id/resolve', requireAuth, (req, res) => {
  getDb().prepare(`UPDATE reports SET status = 'resolved' WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// DELETE /api/admin/reports/:id
router.delete('/admin/reports/:id', requireAuth, (req, res) => {
  getDb().prepare(`DELETE FROM reports WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// GET /api/admin/proposals
router.get('/admin/proposals', requireAuth, (req, res) => {
  const status = req.query.status || 'pending';
  const rows = getDb().prepare(
    `SELECT * FROM proposals WHERE status = ? ORDER BY created_at DESC`
  ).all(status);
  res.json(rows);
});

// POST /api/admin/proposals/:id/approve
router.post('/admin/proposals/:id/approve', requireAuth, (req, res) => {
  const db       = getDb();
  const proposal = db.prepare(`SELECT * FROM proposals WHERE id = ?`).get(req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Propuesta no encontrada' });

  const proposalSlug = ensureUniqueSlug(db, proposal.name);
  const { lastInsertRowid: bizId } = db.prepare(`
    INSERT INTO businesses (name, address, phone, website, description, is_active, slug)
    VALUES (@name, @address, @phone, @website, @description, 1, @slug)
  `).run({ ...proposal, slug: proposalSlug });

  if (proposal.categories) {
    const insertCat = db.prepare(`INSERT OR IGNORE INTO business_categories (business_id, category) VALUES (?, ?)`);
    for (const cat of proposal.categories.split(',')) {
      if (cat.trim()) insertCat.run(bizId, cat.trim());
    }
  }

  db.prepare(`UPDATE proposals SET status = 'approved' WHERE id = ?`).run(req.params.id);
  res.json({ ok: true, bizId });
});

// POST /api/admin/proposals/:id/reject
router.post('/admin/proposals/:id/reject', requireAuth, (req, res) => {
  getDb().prepare(`UPDATE proposals SET status = 'rejected' WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const path = require('path');
const { getDb } = require('../db');

function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: 'No autorizado' });
}

// GET /admin
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// GET /admin/me
router.get('/me', (req, res) => {
  res.json({ admin: !!(req.session && req.session.admin) });
});

// POST /admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Credenciales incorrectas' });
});

// POST /admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ── Ticker ────────────────────────────────────────────────────────────────────

// GET /admin/ticker
router.get('/ticker', requireAuth, (req, res) => {
  const rows = getDb().prepare(
    'SELECT * FROM ticker_messages ORDER BY sort_order ASC, id ASC'
  ).all();
  res.json(rows);
});

// POST /admin/ticker
router.post('/ticker', requireAuth, (req, res) => {
  const text = (req.body.text || '').trim().slice(0, 280);
  if (!text) return res.status(400).json({ error: 'El texto es obligatorio' });
  const { lastInsertRowid } = getDb().prepare(
    'INSERT INTO ticker_messages (text) VALUES (?)'
  ).run(text);
  res.json({ id: lastInsertRowid, text, is_active: 1, sort_order: 0 });
});

// PATCH /admin/ticker/:id/toggle
router.patch('/ticker/:id/toggle', requireAuth, (req, res) => {
  getDb().prepare(
    'UPDATE ticker_messages SET is_active = 1 - is_active WHERE id = ?'
  ).run(req.params.id);
  res.json({ ok: true });
});

// DELETE /admin/ticker/:id
router.delete('/ticker/:id', requireAuth, (req, res) => {
  getDb().prepare('DELETE FROM ticker_messages WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

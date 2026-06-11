const express                          = require('express');
const router                           = express.Router();
const { getDb, ensureUniqueSlug }      = require('../db');
const { editMessage, editCaption, answerCallback, SECRET } = require('../lib/telegram');

async function handleCallback(cb) {
  const parts  = (cb.data || '').split('_');          // ['approve'|'publish', 'ad'|'proposal'|'report', id]
  const action = parts[0];
  const type   = parts[1];
  const id     = parseInt(parts[2], 10);

  if (!['approve','publish'].includes(action) || !type || !Number.isInteger(id) || id <= 0) return;

  const db          = getDb();
  const msgId       = cb.message?.message_id;
  const originalText = cb.message?.text || '';

  if (type === 'ad') {
    const row = db.prepare('SELECT status FROM ads WHERE id = ?').get(id);
    if (!row)                   { await answerCallback(cb.id, '❌ Anuncio no encontrado');  return; }
    if (row.status === 'active'){ await answerCallback(cb.id, 'Ya estaba publicado');       return; }
    db.prepare("UPDATE ads SET status = 'active' WHERE id = ?").run(id);
    await answerCallback(cb.id, '✅ Anuncio publicado');
    if (msgId) {
      const isPhoto = !!cb.message?.photo;
      const approved = '\n\n✅ <b>Publicado</b>';
      if (isPhoto) await editCaption(msgId, (cb.message.caption || '') + approved);
      else         await editMessage(msgId, originalText + approved);
    }

  } else if (type === 'proposal' && action === 'approve') {
    const row = db.prepare('SELECT status FROM proposals WHERE id = ?').get(id);
    if (!row)                      { await answerCallback(cb.id, '❌ Propuesta no encontrada'); return; }
    if (row.status === 'reviewed') { await answerCallback(cb.id, 'Ya estaba revisada');         return; }
    if (row.status === 'approved') { await answerCallback(cb.id, 'Ya estaba aprobada');         return; }
    db.prepare("UPDATE proposals SET status = 'reviewed' WHERE id = ?").run(id);
    await answerCallback(cb.id, '👀 Propuesta marcada como revisada');
    if (msgId) await editMessage(msgId, originalText + '\n\n👀 <b>Revisada — pendiente de aprobación en el panel</b>');

  } else if (type === 'proposal' && action === 'publish') {
    const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
    if (!proposal)                        { await answerCallback(cb.id, '❌ Propuesta no encontrada'); return; }
    if (proposal.status === 'approved')   { await answerCallback(cb.id, 'Ya estaba aprobada');         return; }
    const slug = ensureUniqueSlug(db, proposal.name);
    const { lastInsertRowid: bizId } = db.prepare(`
      INSERT INTO businesses (name, address, phone, website, description, is_active, slug)
      VALUES (@name, @address, @phone, @website, @description, 1, @slug)
    `).run({ ...proposal, slug });
    if (proposal.categories) {
      const insertCat = db.prepare('INSERT OR IGNORE INTO business_categories (business_id, category) VALUES (?, ?)');
      for (const cat of proposal.categories.split(',')) {
        if (cat.trim()) insertCat.run(bizId, cat.trim());
      }
    }
    db.prepare("UPDATE proposals SET status = 'approved' WHERE id = ?").run(id);
    await answerCallback(cb.id, '✅ Negocio publicado en el directorio');
    if (msgId) await editMessage(msgId, originalText + '\n\n✅ <b>Aprobado y publicado en el directorio</b>');

  } else if (type === 'report') {
    const row = db.prepare('SELECT status FROM reports WHERE id = ?').get(id);
    if (!row)                      { await answerCallback(cb.id, '❌ Reporte no encontrado'); return; }
    if (row.status === 'reviewed') { await answerCallback(cb.id, 'Ya estaba revisado');       return; }
    db.prepare("UPDATE reports SET status = 'reviewed' WHERE id = ?").run(id);
    await answerCallback(cb.id, '✅ Reporte marcado como revisado');
    if (msgId) await editMessage(msgId, originalText + '\n\n✅ <b>Revisado</b>');
  }
}

// POST /telegram-webhook
router.post('/', (req, res) => {
  if (!SECRET || req.headers['x-telegram-bot-api-secret-token'] !== SECRET) {
    return res.sendStatus(403);
  }

  res.sendStatus(200); // responder inmediatamente a Telegram

  const cb = req.body?.callback_query;
  if (cb) handleCallback(cb).catch(() => {});
});

module.exports = router;

const express                          = require('express');
const router                           = express.Router();
const { getDb }                        = require('../db');
const { editMessage, editCaption, answerCallback, SECRET } = require('../lib/telegram');

async function handleCallback(cb) {
  const parts  = (cb.data || '').split('_');          // ['approve', 'ad'|'proposal'|'report', id]
  const action = parts[0];
  const type   = parts[1];
  const id     = parseInt(parts[2], 10);

  if (action !== 'approve' || !type || !Number.isInteger(id) || id <= 0) return;

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

  } else if (type === 'proposal') {
    const row = db.prepare('SELECT status FROM proposals WHERE id = ?').get(id);
    if (!row)                      { await answerCallback(cb.id, '❌ Propuesta no encontrada'); return; }
    if (row.status === 'reviewed') { await answerCallback(cb.id, 'Ya estaba revisada');         return; }
    db.prepare("UPDATE proposals SET status = 'reviewed' WHERE id = ?").run(id);
    await answerCallback(cb.id, '✅ Propuesta marcada como revisada');
    if (msgId) await editMessage(msgId, originalText + '\n\n✅ <b>Revisada</b>');

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

const TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SECRET  = process.env.TELEGRAM_WEBHOOK_SECRET;

async function _call(method, body) {
  if (!TOKEN) return null;
  try {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    return await r.json();
  } catch { return null; }
}

// Envía un mensaje de texto con botones inline opcionales
async function notify(text, keyboard = null) {
  if (!CHAT_ID) return null;
  const body = { chat_id: CHAT_ID, text, parse_mode: 'HTML' };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  const r = await _call('sendMessage', body);
  return r?.result?.message_id ?? null;
}

// Envía una foto con caption y botones inline opcionales
async function notifyPhoto(photoUrl, caption, keyboard = null) {
  if (!CHAT_ID) return null;
  const body = { chat_id: CHAT_ID, photo: photoUrl, caption, parse_mode: 'HTML' };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  const r = await _call('sendPhoto', body);
  return r?.result?.message_id ?? null;
}

// Edita el texto de un mensaje (quita los botones)
async function editMessage(messageId, text) {
  if (!CHAT_ID) return;
  await _call('editMessageText', {
    chat_id:      CHAT_ID,
    message_id:   messageId,
    text,
    parse_mode:   'HTML',
    reply_markup: { inline_keyboard: [] },
  });
}

// Edita el caption de un mensaje de foto (quita los botones)
async function editCaption(messageId, caption) {
  if (!CHAT_ID) return;
  await _call('editMessageCaption', {
    chat_id:      CHAT_ID,
    message_id:   messageId,
    caption,
    parse_mode:   'HTML',
    reply_markup: { inline_keyboard: [] },
  });
}

async function answerCallback(callbackId, text) {
  await _call('answerCallbackQuery', { callback_query_id: callbackId, text });
}

async function registerWebhook(url) {
  if (!SECRET) return;
  return _call('setWebhook', {
    url,
    secret_token:    SECRET,
    allowed_updates: ['callback_query'],
  });
}

module.exports = { notify, notifyPhoto, editMessage, editCaption, answerCallback, registerWebhook, SECRET };

require('dotenv').config();
const express      = require('express');
const session      = require('express-session');
const compression  = require('compression');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const path         = require('path');
const { initDb }   = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === 'production';

// ── Trust nginx reverse proxy ───────────────────────────────────────────────
app.set('trust proxy', 1);

// ── Gzip compression ────────────────────────────────────────────────────────
app.use(compression());

// ── Security headers (helmet) ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:', 'https:'],
      connectSrc:  ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc:   ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── Rate limiters ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Esperá 15 minutos.' },
});

const proposeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hora
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Límite de propuestas por hora alcanzado.' },
});


const apiLimiter = rateLimit({
  windowMs: 60 * 1000,         // 1 min
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes.' },
});

// ── Init DB ──────────────────────────────────────────────────────────────────
initDb();

// ── Body parsing (with size limits) ─────────────────────────────────────────
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));

// ── Sessions ─────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge:   1000 * 60 * 60 * 8,  // 8 horas
    httpOnly: true,
    secure:   PROD,
    sameSite: 'lax',
  },
}));

// ── Rate limits por ruta ─────────────────────────────────────────────────────
app.use('/admin/login',  loginLimiter);
app.use('/api/propose',  proposeLimiter);
app.use('/api',          apiLimiter);

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use('/negocio', require('./routes/negocio'));
app.use('/anuncio', require('./routes/anuncio'));

// Imágenes de anuncios (sin cache agresivo para facilitar actualizaciones)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  maxAge: PROD ? '1d' : 0,
}));

// Archivos estáticos con cache agresivo en assets, sin cache en HTML
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: PROD ? '7d' : 0,
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

app.use('/api',    require('./routes/api'));
app.use('/admin',  require('./routes/admin'));

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});

// ── Error handler global ─────────────────────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Crash safety ─────────────────────────────────────────────────────────────
process.on('uncaughtException',  err  => { console.error('uncaughtException:', err);  process.exit(1); });
process.on('unhandledRejection', err  => { console.error('unhandledRejection:', err); process.exit(1); });

// ── Arrancar ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Servidor en http://localhost:${PORT} (${PROD ? 'producción' : 'desarrollo'})`);
});

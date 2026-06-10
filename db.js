require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.env.DB_PATH || './google_scrape.db');
let db;

/* ── Slug utilities ─────────────────────────────────────────────────────────── */

function generateSlug(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip accent marks
    .replace(/[^a-z0-9\s-]/g, '')      // keep alphanumeric, spaces, dashes
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function ensureUniqueSlug(database, name, excludeId = null) {
  const base = generateSlug(name) || 'negocio';
  let slug = base;
  let i = 2;
  while (true) {
    const row = excludeId
      ? database.prepare('SELECT id FROM businesses WHERE slug = ? AND id != ?').get(slug, excludeId)
      : database.prepare('SELECT id FROM businesses WHERE slug = ?').get(slug);
    if (!row) return slug;
    slug = `${base}-${i++}`;
  }
}

/* ── DB connection ──────────────────────────────────────────────────────────── */

function normalizeCategory(queryDisplayed) {
  return queryDisplayed
    .replace(/\s+en\s+ushuaia\s*$/i, '')
    .trim()
    .replace(/^(.)/, c => c.toUpperCase());
}

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/* ── Init & migrations ──────────────────────────────────────────────────────── */

function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      address     TEXT    DEFAULT '',
      phone       TEXT    DEFAULT '',
      website     TEXT    DEFAULT '',
      description TEXT    DEFAULT '',
      is_active   INTEGER DEFAULT 1,
      slug        TEXT    NOT NULL DEFAULT '',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS business_categories (
      business_id INTEGER NOT NULL,
      category    TEXT    NOT NULL,
      PRIMARY KEY (business_id, category),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      categories   TEXT    DEFAULT '',
      address      TEXT    DEFAULT '',
      phone        TEXT    DEFAULT '',
      website      TEXT    DEFAULT '',
      description  TEXT    DEFAULT '',
      contact_name TEXT    DEFAULT '',
      contact_info TEXT    DEFAULT '',
      status       TEXT    DEFAULT 'pending',
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id   INTEGER,
      business_name TEXT    NOT NULL,
      type          TEXT    NOT NULL,
      message       TEXT    DEFAULT '',
      contact_info  TEXT    DEFAULT '',
      status        TEXT    DEFAULT 'pending',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ads (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT    NOT NULL,
      description  TEXT    DEFAULT '',
      image_path   TEXT    NOT NULL,
      contact_info TEXT    DEFAULT '',
      expires_at   TEXT    NOT NULL,
      status       TEXT    DEFAULT 'pending',
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: add slug column if missing (existing DBs)
  const tableInfo = database.prepare('PRAGMA table_info(businesses)').all();
  if (!tableInfo.find(c => c.name === 'slug')) {
    database.exec("ALTER TABLE businesses ADD COLUMN slug TEXT NOT NULL DEFAULT ''");
    console.log('[db] Columna slug agregada a businesses.');
  }

  // Generate slugs for businesses that don't have one yet
  const withoutSlug = database.prepare("SELECT id, name FROM businesses WHERE slug = ''").all();
  if (withoutSlug.length > 0) {
    const upd = database.prepare('UPDATE businesses SET slug = ? WHERE id = ?');
    database.transaction(() => {
      for (const b of withoutSlug) {
        upd.run(ensureUniqueSlug(database, b.name, b.id), b.id);
      }
    })();
    console.log(`[db] ${withoutSlug.length} slugs generados.`);
  }

  const { count } = database.prepare('SELECT COUNT(*) as count FROM businesses').get();
  if (count === 0) {
    const hasSource = database.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='local_results'"
    ).get();
    if (hasSource) {
      console.log('[db] Migrando datos desde local_results...');
      migrateFromScrape(database);
      const { count: imported } = database.prepare('SELECT COUNT(*) as count FROM businesses').get();
      console.log(`[db] Migracion completa: ${imported} negocios importados.`);
    } else {
      console.log('[db] Base de datos lista (vacía, sin datos previos para migrar).');
    }
  } else {
    console.log(`[db] Base de datos lista: ${count} negocios.`);
  }
}

function migrateFromScrape(database) {
  const rows = database.prepare(`
    SELECT
      lr.title,
      lr.address,
      lr.phone,
      lr.website,
      q.query_displayed
    FROM local_results lr
    JOIN queries q ON lr.query_id = q.id
    WHERE lr.title IS NOT NULL AND TRIM(lr.title) != ''
    ORDER BY lr.id ASC
  `).all();

  const map = new Map();

  for (const row of rows) {
    const key = `${row.title.trim().toLowerCase()}|||${(row.address || '').trim().toLowerCase()}`;
    const category = normalizeCategory(row.query_displayed);

    if (!map.has(key)) {
      map.set(key, {
        name: row.title.trim(),
        address: row.address || '',
        phone: row.phone || '',
        website: row.website || '',
        categories: new Set()
      });
    } else {
      const biz = map.get(key);
      if (!biz.phone && row.phone) biz.phone = row.phone;
      if (!biz.website && row.website) biz.website = row.website;
    }

    map.get(key).categories.add(category);
  }

  const insertBiz = database.prepare(`
    INSERT INTO businesses (name, address, phone, website, slug)
    VALUES (@name, @address, @phone, @website, @slug)
  `);

  const insertCat = database.prepare(`
    INSERT OR IGNORE INTO business_categories (business_id, category) VALUES (?, ?)
  `);

  const migrate = database.transaction(() => {
    for (const [, biz] of map) {
      const slug = ensureUniqueSlug(database, biz.name);
      const { lastInsertRowid: bizId } = insertBiz.run({ ...biz, slug });
      for (const cat of biz.categories) {
        insertCat.run(bizId, cat);
      }
    }
  });

  migrate();
}

module.exports = { getDb, initDb, generateSlug, ensureUniqueSlug };

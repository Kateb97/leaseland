// LeaseLand Server - Database Setup using sql.js (pure JS SQLite, no native compilation needed)
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'leasedev.db');

let db = null;
let dbProxy = null;
let SQL = null;
let initPromise = null;

// Creates a prepared-statement-like wrapper around sql.js
function createStatement(sqlText) {
  return {
    get: (...params) => {
      try {
        const stmt = db.prepare(sqlText);
        if (params.length > 0) stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      } catch (e) {
        console.error('SQL get error:', sqlText, JSON.stringify(params), e.message);
        throw e;
      }
    },
    all: (...params) => {
      try {
        const stmt = db.prepare(sqlText);
        if (params.length > 0) stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      } catch (e) {
        console.error('SQL all error:', sqlText, JSON.stringify(params), e.message);
        throw e;
      }
    },
    run: (...params) => {
      try {
        db.run(sqlText, params);
        saveDb();
        return { changes: db.getRowsModified() };
      } catch (e) {
        console.error('SQL run error:', sqlText, JSON.stringify(params), e.message);
        throw e;
      }
    },
  };
}

function initTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'australia',
      state TEXT NOT NULL DEFAULT 'nsw',
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      stripe_customer_id TEXT,
      subscription_status TEXT DEFAULT 'free',
      subscription_id TEXT,
      subscription_end DATE,
      free_questions_remaining INTEGER DEFAULT 1,
      referral_code TEXT UNIQUE,
      referred_by TEXT,
      referral_free_months INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS lease_checks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lease_text TEXT,
      pdf_filename TEXT,
      country TEXT NOT NULL DEFAULT 'australia',
      state TEXT NOT NULL,
      result TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS assistant_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'australia',
      state TEXT NOT NULL,
      messages TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      stripe_session_id TEXT,
      amount INTEGER,
      currency TEXT DEFAULT 'usd',
      status TEXT DEFAULT 'pending',
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      referrer_user_id TEXT NOT NULL,
      referred_email TEXT,
      referred_user_id TEXT,
      status TEXT DEFAULT 'pending',
      free_month_granted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referrer_user_id) REFERENCES users(id)
    )
  `);
}

function saveDb() {
  if (db) {
    try {
      const data = db.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (e) {
      console.error('Save DB error:', e.message);
    }
  }
}

// Synchronous getter - returns proxy if initialized, otherwise throws
function getDb() {
  if (dbProxy) return dbProxy;
  throw new Error('Database not initialized yet. Call initDb() first.');
}

// Async init - call this once at startup
async function initDb() {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    SQL = await initSqlJs();
    
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    
    db.run('PRAGMA foreign_keys = ON');
    initTables();
    saveDb();
    
    dbProxy = {
      prepare: (sqlText) => createStatement(sqlText),
      exec: (sql) => { db.run(sql); saveDb(); },
      pragma: (str) => { db.run(`PRAGMA ${str}`); },
    };
    
    return dbProxy;
  })();
  
  return initPromise;
}

module.exports = { getDb, initDb, saveDb };
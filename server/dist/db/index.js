import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
let _dbInstance = null;
const dbPath = process.env.DATABASE_PATH || './data/riize-chat.db';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
// Also ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './data/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
/**
 * Initialize the database (async - must be called before any DB operation)
 */
export async function initDatabaseAsync() {
    const SQL = await initSqlJs();
    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        _dbInstance = new SQL.Database(fileBuffer);
    }
    else {
        _dbInstance = new SQL.Database();
    }
    // Enable WAL mode
    _dbInstance.run('PRAGMA journal_mode = WAL');
    _dbInstance.run('PRAGMA foreign_keys = ON');
    // Run schema creation
    _dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      device_id TEXT NOT NULL,
      current_mood TEXT DEFAULT 'normal',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(device_id)
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      member_key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      display_name TEXT,
      korean_name TEXT,
      avatar_url TEXT DEFAULT '',
      background_url TEXT DEFAULT '',
      base_prompt TEXT NOT NULL,
      custom_prompt TEXT DEFAULT '',
      personality_settings TEXT DEFAULT '{}',
      sort_order INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS user_member_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      UNIQUE(user_id, member_id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'member', 'system')),
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'emoji_card', 'image_placeholder', 'system')),
      mode TEXT DEFAULT 'daily',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS intimacy (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      intimacy_score INTEGER DEFAULT 0,
      intimacy_level INTEGER DEFAULT 1,
      relationship_title TEXT DEFAULT '初识粉丝',
      last_chat_at TEXT DEFAULT (datetime('now', 'localtime')),
      last_daily_bonus_date TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      UNIQUE(user_id, member_id)
    );

    CREATE TABLE IF NOT EXISTS proactive_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      trigger_type TEXT NOT NULL CHECK(trigger_type IN ('daily_first', 'intimacy_upgrade', 'long_absence')),
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      api_key TEXT DEFAULT '',
      base_url TEXT DEFAULT 'https://api.openai.com/v1',
      model_name TEXT DEFAULT 'gpt-3.5-turbo',
      admin_password_hash TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_user_member ON conversations(user_id, member_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_intimacy_user ON intimacy(user_id);
    CREATE INDEX IF NOT EXISTS idx_proactive_user_member ON proactive_messages(user_id, member_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_users_device ON users(device_id);
  `);
    console.log('Database initialized with sql.js');
}
/** Save database to disk (call after writes if you want persistence) */
export function saveDatabase() {
    if (_dbInstance) {
        const data = _dbInstance.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}
/** Get the raw sql.js instance */
export function getDb() {
    return _dbInstance;
}
/**
 * Compatible statement object mimicking better-sqlite3's prepare().get()/all()/run()
 * This allows all route files to remain unchanged.
 */
class Statement {
    sql;
    constructor(sql) {
        this.sql = sql;
    }
    get(...params) {
        const db = _dbInstance;
        if (!db)
            throw new Error('Database not initialized');
        const result = db.exec(this.sql, params);
        if (!result || result.length === 0 || result[0].values.length === 0)
            return undefined;
        const cols = result[0].columns;
        const row = result[0].values[0];
        const obj = {};
        for (let i = 0; i < cols.length; i++) {
            obj[cols[i]] = row[i];
        }
        return obj;
    }
    all(...params) {
        const db = _dbInstance;
        if (!db)
            throw new Error('Database not initialized');
        const result = db.exec(this.sql, params);
        if (!result || result.length === 0)
            return [];
        const cols = result[0].columns;
        return result[0].values.map((row) => {
            const obj = {};
            for (let i = 0; i < cols.length; i++) {
                obj[cols[i]] = row[i];
            }
            return obj;
        });
    }
    run(...params) {
        const db = _dbInstance;
        if (!db)
            throw new Error('Database not initialized');
        db.run(this.sql, params);
        saveDatabase();
        return { changes: 1, lastInsertRowid: 0 };
    }
}
/**
 * Database-compatible object mimicking better-sqlite3 interface.
 * Usage: db.prepare(sql).get(params), .all(params), .run(params)
 */
export const db = {
    prepare: (sql) => new Statement(sql),
};
/** Sync init wrapper (for backwards compat with init.ts calling it synchronously) */
export function initDatabase() {
    // This is now async - caller must await initDatabaseAsync()
    console.log('[db] initDatabase() called - use initDatabaseAsync() for sql.js');
}

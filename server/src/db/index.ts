import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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

export const db = new Database(dbPath);

export function initDatabase(): void {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    -- 用户表：昵称 + 设备ID登录（无密码）
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      device_id TEXT NOT NULL,
      current_mood TEXT DEFAULT 'normal',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(device_id)
    );

    -- 成员配置表：完整字段
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

    -- 用户成员备注表：每个用户可以为成员设置备注名
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

    -- 聊天记录表：支持 message_type 和 mode
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

    -- 亲密度表：7档系统
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

    -- 主动消息表：记录成员主动发给用户的消息
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

    -- 设置表：系统级配置（API Key 等安全信息）
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      api_key TEXT DEFAULT '',
      base_url TEXT DEFAULT 'https://api.openai.com/v1',
      model_name TEXT DEFAULT 'gpt-3.5-turbo',
      admin_password_hash TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 创建索引提升查询性能
    CREATE INDEX IF NOT EXISTS idx_conversations_user_member ON conversations(user_id, member_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_intimacy_user ON intimacy(user_id);
    CREATE INDEX IF NOT EXISTS idx_proactive_user_member ON proactive_messages(user_id, member_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_users_device ON users(device_id);
  `);
}

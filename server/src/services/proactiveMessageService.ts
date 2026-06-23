import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { PROACTIVE_MESSAGE_TEMPLATES } from '../db/init.js';
import { getIntimacy } from './intimacyService.js';

export function generateProactiveMessages(userId: string, memberId: string): string[] {
  const member = db.prepare('SELECT member_key FROM members WHERE id = ?').get(memberId) as any;
  if (!member) return [];

  const memberKey = member.member_key;
  const templates = PROACTIVE_MESSAGE_TEMPLATES[memberKey];
  if (!templates) return [];

  const messages: string[] = [];

  // 1. Check daily first visit
  const today = new Date().toISOString().split('T')[0];
  const intimacyData = getIntimacy(userId, memberId);

  // If last chat was not today, send daily first message
  if (!intimacyData.lastChatAt || intimacyData.lastChatAt.split('T')[0] !== today) {
    const dailyTemplates = templates.daily_first || [];
    if (dailyTemplates.length > 0) {
      messages.push(dailyTemplates[Math.floor(Math.random() * dailyTemplates.length)]);
    }
  }

  // 2. Check long absence (more than 3 days since last chat)
  if (intimacyData.lastChatAt) {
    const lastChatDate = new Date(intimacyData.lastChatAt);
    const daysSinceLastChat = Math.floor((Date.now() - lastChatDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastChat >= 3) {
      const absenceTemplates = templates.long_absence || [];
      if (absenceTemplates.length > 0) {
        messages.push(absenceTemplates[Math.floor(Math.random() * absenceTemplates.length)]);
      }
    }
  }

  // Save proactive messages to database
  for (const content of messages) {
    const triggerType = messages.indexOf(content) === 0 && !intimacyData.lastChatAt
      ? 'daily_first'
      : 'long_absence';

    db.prepare(`
      INSERT INTO proactive_messages (id, user_id, member_id, trigger_type, content, is_read)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(uuidv4(), userId, memberId, triggerType, content);
  }

  return messages;
}

export function getUnreadProactiveMessages(userId: string, memberId: string): any[] {
  return db.prepare(`
    SELECT id, member_id, trigger_type, content, created_at
    FROM proactive_messages
    WHERE user_id = ? AND member_id = ? AND is_read = 0
    ORDER BY created_at ASC
  `).all(userId, memberId) as any[];
}

export function getAllUnreadProactiveMessages(userId: string): any[] {
  return db.prepare(`
    SELECT pm.id, pm.member_id, pm.trigger_type, pm.content, pm.created_at, m.name, m.member_key, m.avatar_url
    FROM proactive_messages pm
    JOIN members m ON pm.member_id = m.id
    WHERE pm.user_id = ? AND pm.is_read = 0
    ORDER BY pm.created_at ASC
  `).all(userId) as any[];
}

export function markProactiveMessagesAsRead(userId: string, memberId: string): void {
  db.prepare(`
    UPDATE proactive_messages SET is_read = 1 WHERE user_id = ? AND member_id = ? AND is_read = 0
  `).run(userId, memberId);
}

export function addIntimacyUpgradeMessage(userId: string, memberId: string, newTitle: string): string {
  const member = db.prepare('SELECT member_key FROM members WHERE id = ?').get(memberId) as any;
  if (!member) return '';

  const templates = PROACTIVE_MESSAGE_TEMPLATES[member.member_key];
  if (!templates || !templates.intimacy_upgrade) return '';

  const upgradeTemplates = templates.intimacy_upgrade;
  const content = upgradeTemplates[Math.floor(Math.random() * upgradeTemplates.length)];

  // Save to database
  db.prepare(`
    INSERT INTO proactive_messages (id, user_id, member_id, trigger_type, content, is_read)
    VALUES (?, ?, ?, 'intimacy_upgrade', ?, 0)
  `).run(uuidv4(), userId, memberId, content);

  return content;
}

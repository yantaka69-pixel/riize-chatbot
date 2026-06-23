import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
// 需求文档规定的7档关系称呼
const INTIMACY_LEVELS = [
    { level: 1, title: '初识粉丝', minScore: 0 },
    { level: 2, title: '眼熟粉丝', minScore: 100 },
    { level: 3, title: '常来聊天的人', minScore: 300 },
    { level: 4, title: '熟悉朋友', minScore: 600 },
    { level: 5, title: '亲近粉丝', minScore: 1000 },
    { level: 6, title: '特别在意的人', minScore: 2000 },
    { level: 7, title: '专属陪伴', minScore: 4000 },
];
export function getIntimacyLevel(score) {
    let currentLevel = INTIMACY_LEVELS[0];
    for (const lvl of INTIMACY_LEVELS) {
        if (score >= lvl.minScore) {
            currentLevel = lvl;
        }
        else {
            break;
        }
    }
    const nextIdx = INTIMACY_LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
    const nextLevel = nextIdx < INTIMACY_LEVELS.length ? INTIMACY_LEVELS[nextIdx] : null;
    return {
        level: currentLevel.level,
        title: currentLevel.title,
        nextLevel: nextLevel?.level ?? null,
        nextTitle: nextLevel?.title ?? null,
        nextScore: nextLevel?.minScore ?? null,
    };
}
export function getIntimacy(userId, memberId) {
    const row = db.prepare(`
    SELECT intimacy_score, intimacy_level, relationship_title, last_chat_at, last_daily_bonus_date
    FROM intimacy WHERE user_id = ? AND member_id = ?
  `).get(userId, memberId);
    if (!row) {
        // Auto-create intimacy record
        const initial = getIntimacyLevel(0);
        db.prepare(`
      INSERT INTO intimacy (id, user_id, member_id, intimacy_score, intimacy_level, relationship_title, last_daily_bonus_date)
      VALUES (?, ?, ?, 0, ?, ?, '')
    `).run(uuidv4(), userId, memberId, initial.level, initial.title);
        return {
            score: 0,
            lastChatAt: null,
            lastDailyBonusDate: '',
            ...getIntimacyLevel(0),
        };
    }
    const computed = getIntimacyLevel(row.intimacy_score);
    return {
        score: row.intimacy_score,
        level: computed.level,
        title: computed.title,
        lastChatAt: row.last_chat_at,
        lastDailyBonusDate: row.last_daily_bonus_date,
        nextLevel: computed.nextLevel,
        nextTitle: computed.nextTitle,
        nextScore: computed.nextScore,
    };
}
export function addIntimacyPoints(userId, memberId, points, reason) {
    const current = getIntimacy(userId, memberId);
    const previousLevel = current.level;
    const newScore = current.score + points;
    const computed = getIntimacyLevel(newScore);
    const upgraded = computed.level > previousLevel;
    // Update intimacy record
    db.prepare(`
    UPDATE intimacy SET
      intimacy_score = ?,
      intimacy_level = ?,
      relationship_title = ?,
      last_chat_at = datetime('now', 'localtime'),
      updated_at = datetime('now', 'localtime')
    WHERE user_id = ? AND member_id = ?
  `).run(newScore, computed.level, computed.title, userId, memberId);
    return {
        score: newScore,
        level: computed.level,
        title: computed.title,
        upgraded,
        previousLevel,
    };
}
export function addDailyBonus(userId, memberId) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const current = getIntimacy(userId, memberId);
    // Only add daily bonus once per day
    if (current.lastDailyBonusDate === today) {
        return { bonusAdded: false, points: 0 };
    }
    const bonusPoints = 10; // Daily first chat bonus
    addIntimacyPoints(userId, memberId, bonusPoints, 'daily_bonus');
    // Mark daily bonus as claimed
    db.prepare(`
    UPDATE intimacy SET last_daily_bonus_date = ? WHERE user_id = ? AND member_id = ?
  `).run(today, userId, memberId);
    return { bonusAdded: true, points: bonusPoints };
}
export function getAllIntimacy(userId) {
    const rows = db.prepare(`
    SELECT
      i.member_id,
      i.intimacy_score,
      i.intimacy_level,
      i.relationship_title,
      i.last_chat_at,
      i.last_daily_bonus_date,
      m.name,
      m.member_key,
      m.avatar_url
    FROM intimacy i
    JOIN members m ON i.member_id = m.id
    WHERE i.user_id = ?
    ORDER BY m.sort_order
  `).all(userId);
    return rows.map(row => {
        const computed = getIntimacyLevel(row.intimacy_score);
        return {
            memberId: row.member_id,
            memberKey: row.member_key,
            name: row.name,
            avatarUrl: row.avatar_url,
            score: row.intimacy_score,
            level: computed.level,
            title: computed.title,
            lastChatAt: row.last_chat_at,
            nextLevel: computed.nextLevel,
            nextTitle: computed.nextTitle,
            nextScore: computed.nextScore,
        };
    });
}
export { INTIMACY_LEVELS };

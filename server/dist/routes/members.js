import { Router } from 'express';
import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
// Get all members with user-specific data (last message, intimacy, notes, unread)
router.get('/', (req, res) => {
    try {
        const { userId } = req.query;
        const members = db.prepare('SELECT * FROM members ORDER BY sort_order').all();
        const enrichedMembers = members.map((m) => {
            let lastMessage = null;
            let lastChatAt = null;
            let intimacy = null;
            let userNote = null;
            let unreadCount = 0;
            if (userId) {
                // Last message
                const lastMsg = db.prepare(`
          SELECT content, created_at FROM conversations
          WHERE user_id = ? AND member_id = ?
          ORDER BY created_at DESC LIMIT 1
        `).get(userId, m.id);
                if (lastMsg) {
                    lastMessage = lastMsg.content;
                    lastChatAt = lastMsg.created_at;
                }
                // Intimacy
                const intimacyRow = db.prepare(`
          SELECT intimacy_score, intimacy_level, relationship_title FROM intimacy
          WHERE user_id = ? AND member_id = ?
        `).get(userId, m.id);
                if (intimacyRow) {
                    intimacy = {
                        score: intimacyRow.intimacy_score,
                        level: intimacyRow.intimacy_level,
                        title: intimacyRow.relationship_title,
                    };
                }
                // User note (custom nickname)
                const noteRow = db.prepare(`
          SELECT nickname FROM user_member_notes
          WHERE user_id = ? AND member_id = ?
        `).get(userId, m.id);
                if (noteRow) {
                    userNote = noteRow.nickname;
                }
                // Unread proactive messages count
                const unreadRow = db.prepare(`
          SELECT COUNT(*) as count FROM proactive_messages
          WHERE user_id = ? AND member_id = ? AND is_read = 0
        `).get(userId, m.id);
                unreadCount = unreadRow?.count || 0;
            }
            return {
                id: m.id,
                memberKey: m.member_key,
                name: m.name,
                displayName: m.display_name,
                koreanName: m.korean_name,
                avatarUrl: m.avatar_url,
                backgroundUrl: m.background_url,
                sortOrder: m.sort_order,
                // User-specific data
                lastMessage,
                lastChatAt,
                intimacy,
                userNote,
                unreadCount,
            };
        });
        res.json({ members: enrichedMembers });
    }
    catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// Get single member detail
router.get('/:id', (req, res) => {
    try {
        const { userId } = req.query;
        const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
        if (!member) {
            return res.status(404).json({ error: '成员不存在' });
        }
        let userNote = null;
        let intimacy = null;
        if (userId) {
            const noteRow = db.prepare(`
        SELECT nickname FROM user_member_notes WHERE user_id = ? AND member_id = ?
      `).get(userId, member.id);
            userNote = noteRow?.nickname || '';
            const intimacyRow = db.prepare(`
        SELECT intimacy_score, intimacy_level, relationship_title FROM intimacy
        WHERE user_id = ? AND member_id = ?
      `).get(userId, member.id);
            intimacy = intimacyRow ? {
                score: intimacyRow.intimacy_score,
                level: intimacyRow.intimacy_level,
                title: intimacyRow.relationship_title,
            } : null;
        }
        res.json({
            member: {
                id: member.id,
                memberKey: member.member_key,
                name: member.name,
                displayName: member.display_name,
                koreanName: member.korean_name,
                avatarUrl: member.avatar_url,
                backgroundUrl: member.background_url,
                basePrompt: member.base_prompt,
                customPrompt: member.custom_prompt,
                personalitySettings: member.personality_settings,
                sortOrder: member.sort_order,
                userNote,
                intimacy,
            },
        });
    }
    catch (error) {
        console.error('Get member error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// Update member (avatar, background, user note, prompt, personality)
router.post('/update', (req, res) => {
    try {
        const { userId, memberId, avatarUrl, backgroundUrl, userNote, customPrompt, personalitySettings } = req.body;
        if (!userId || !memberId) {
            return res.status(400).json({ error: '参数不完整' });
        }
        // Update member global fields (avatar, background)
        if (avatarUrl !== undefined || backgroundUrl !== undefined) {
            const updates = [];
            const values = [];
            if (avatarUrl !== undefined) {
                updates.push('avatar_url = ?');
                values.push(avatarUrl);
            }
            if (backgroundUrl !== undefined) {
                updates.push('background_url = ?');
                values.push(backgroundUrl);
            }
            values.push(memberId);
            db.prepare(`UPDATE members SET ${updates.join(', ')}, updated_at = datetime('now', 'localtime') WHERE id = ?`)
                .run(...values);
        }
        // Update user-specific note
        if (userNote !== undefined) {
            const existingNote = db.prepare(`
        SELECT id FROM user_member_notes WHERE user_id = ? AND member_id = ?
      `).get(userId, memberId);
            if (existingNote) {
                db.prepare('UPDATE user_member_notes SET nickname = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?')
                    .run(userNote, existingNote.id);
            }
            else {
                db.prepare('INSERT INTO user_member_notes (id, user_id, member_id, nickname) VALUES (?, ?, ?, ?)')
                    .run(uuidv4(), userId, memberId, userNote);
            }
        }
        // Update custom prompt
        if (customPrompt !== undefined) {
            db.prepare('UPDATE members SET custom_prompt = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?')
                .run(customPrompt, memberId);
        }
        // Update personality settings
        if (personalitySettings !== undefined) {
            db.prepare('UPDATE members SET personality_settings = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?')
                .run(JSON.stringify(personalitySettings), memberId);
        }
        res.json({ message: '成员信息已更新' });
    }
    catch (error) {
        console.error('Update member error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
export default router;

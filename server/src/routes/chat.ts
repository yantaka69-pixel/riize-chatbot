import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { getAIResponse } from '../services/aiService.js';
import { addIntimacyPoints, addDailyBonus, getIntimacy } from '../services/intimacyService.js';
import { generateProactiveMessages, markProactiveMessagesAsRead, addIntimacyUpgradeMessage } from '../services/proactiveMessageService.js';

const router = Router();

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Send message to a member
router.post('/message', async (req, res) => {
  try {
    const { userId, memberId, content, mode = 'daily', mood = 'normal' } = req.body;

    if (!userId || !memberId || !content) {
      return res.status(400).json({ error: '参数不完整' });
    }

    // Verify user exists
    const user = db.prepare('SELECT id, nickname, current_mood FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // Verify member exists
    const member = db.prepare('SELECT id, member_key FROM members WHERE id = ?').get(memberId) as any;
    if (!member) {
      return res.status(404).json({ error: '成员不存在' });
    }

    // Get current intimacy for prompt building
    const intimacyData = getIntimacy(userId, memberId);
    const relationshipTitle = intimacyData.title;
    const nickname = user.nickname;

    // Get chat history for AI context
    const historyRows = db.prepare(`
      SELECT content, role FROM conversations
      WHERE user_id = ? AND member_id = ?
      ORDER BY created_at ASC
    `).all(userId, memberId) as any[];

    const chatHistory: ChatMessage[] = historyRows.map(row => ({
      role: row.role === 'user' ? 'user' : 'assistant',
      content: row.content,
    }));

    // Save user message
    db.prepare(`
      INSERT INTO conversations (id, user_id, member_id, role, content, message_type, mode)
      VALUES (?, ?, ?, 'user', ?, 'text', ?)
    `).run(uuidv4(), userId, memberId, content, mode);

    // Get AI response
    const moodToUse = mood || user.current_mood || 'normal';
    const aiResult = await getAIResponse(
      memberId,
      content,
      chatHistory,
      mode,
      moodToUse,
      nickname,
      relationshipTitle
    );

    // Save AI response
    const messageType = aiResult.isFallback ? 'text' : 'text';
    db.prepare(`
      INSERT INTO conversations (id, user_id, member_id, role, content, message_type, mode)
      VALUES (?, ?, ?, 'member', ?, ?, ?)
    `).run(uuidv4(), userId, memberId, aiResult.content, messageType, mode);

    // Add intimacy points for sending a message
    const messagePoints = 3;
    const intimacyResult = addIntimacyPoints(userId, memberId, messagePoints, 'message');

    // Add daily bonus if first chat of the day
    const dailyBonusResult = addDailyBonus(userId, memberId);

    // Check for intimacy upgrade -> generate proactive message
    let upgradeMessage = null;
    if (intimacyResult.upgraded) {
      upgradeMessage = addIntimacyUpgradeMessage(userId, memberId, intimacyResult.title);
    }

    // Mark proactive messages as read when user enters chat
    markProactiveMessagesAsRead(userId, memberId);

    res.json({
      response: {
        content: aiResult.content,
        isFallback: aiResult.isFallback,
      },
      intimacy: {
        score: intimacyResult.score,
        level: intimacyResult.level,
        title: intimacyResult.title,
        upgraded: intimacyResult.upgraded,
        previousLevel: intimacyResult.previousLevel,
        upgradeMessage,
      },
      dailyBonus: dailyBonusResult,
    });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Get chat history for a member
router.get('/history/:userId/:memberId', (req, res) => {
  try {
    const { userId, memberId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string | undefined;
    const search = req.query.search as string | undefined;

    let query = `
      SELECT id, role, content, message_type, mode, created_at FROM conversations
      WHERE user_id = ? AND member_id = ?
    `;
    const params: any[] = [userId, memberId];

    if (search) {
      query += ` AND content LIKE ?`;
      params.push(`%${search}%`);
    }

    if (before) {
      query += ` AND created_at < ?`;
      params.push(before);
    }

    query += ` ORDER BY created_at ASC`;

    if (!search) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    const history = db.prepare(query).all(...params) as any[];

    // Also get unread proactive messages
    const proactiveMsgs = db.prepare(`
      SELECT id, content, trigger_type, created_at FROM proactive_messages
      WHERE user_id = ? AND member_id = ? AND is_read = 0
      ORDER BY created_at ASC
    `).all(userId, memberId) as any[];

    const intimacyData = getIntimacy(userId, memberId);

    res.json({
      history: history.map(h => ({
        id: h.id,
        role: h.role,
        content: h.content,
        messageType: h.message_type,
        mode: h.mode,
        createdAt: h.created_at,
      })),
      proactiveMessages: proactiveMsgs.map(pm => ({
        id: pm.id,
        content: pm.content,
        triggerType: pm.trigger_type,
        createdAt: pm.created_at,
      })),
      intimacy: intimacyData,
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Delete chat history for a specific member
router.delete('/history/:userId/:memberId', (req, res) => {
  try {
    const { userId, memberId } = req.params;

    db.prepare('DELETE FROM conversations WHERE user_id = ? AND member_id = ?')
      .run(userId, memberId);

    db.prepare('DELETE FROM proactive_messages WHERE user_id = ? AND member_id = ?')
      .run(userId, memberId);

    // Reset intimacy (optional - keep or reset based on preference)
    // We keep intimacy since it's a "relationship" that doesn't reset when chat is deleted

    res.json({ message: '聊天记录已删除' });
  } catch (error) {
    console.error('Delete history error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Delete all chat history for a user
router.delete('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    db.prepare('DELETE FROM conversations WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM proactive_messages WHERE user_id = ?').run(userId);

    res.json({ message: '全部聊天记录已删除' });
  } catch (error) {
    console.error('Delete all history error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Translate Korean text to Chinese
router.post('/translate', async (req, res) => {
  try {
    const { text, memberId } = req.body;

    if (!text) {
      return res.status(400).json({ error: '请提供要翻译的文本' });
    }

    // Get AI config
    const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('settings_1') as any;
    const apiKey = settings?.api_key || process.env.OPENAI_API_KEY || 'sk-afbfokpvnqdaewryitdtlsznijxpoikdukxaxgfzajkrybih';
    const baseUrl = settings?.base_url || process.env.OPENAI_BASE_URL || 'https://api.siliconflow.cn/v1';
    const model = settings?.model_name || process.env.OPENAI_MODEL || 'Qwen/Qwen2.5-7B-Instruct';

    // Get member name for context
    let memberName = 'RIIZE成员';
    if (memberId) {
      const member = db.prepare('SELECT name FROM members WHERE id = ?').get(memberId) as any;
      if (member) memberName = member.name;
    }

    const systemPrompt = `你是一个翻译助手。将下面的韩语文本翻译成自然流畅的中文。
这是来自虚拟聊天角色"${memberName}"的回复，翻译时保持角色的语气和情感。
只输出翻译结果，不要添加任何解释或说明。`;

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Translate API error (${response.status}):`, errorText);
        return res.status(500).json({ error: '翻译服务暂时不可用' });
      }

      const data = await response.json();
      const translation = data.choices?.[0]?.message?.content;

      if (!translation) {
        return res.status(500).json({ error: '翻译结果为空' });
      }

      res.json({ translation });
    } catch (fetchError) {
      console.error('Translate fetch error:', fetchError);
      res.status(500).json({ error: '翻译服务暂时不可用' });
    }
  } catch (error) {
    console.error('Translate error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;

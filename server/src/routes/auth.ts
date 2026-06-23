import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';

const router = Router();

// 昵称 + 设备ID 登录（无密码）
router.post('/login', (req, res) => {
  try {
    const { nickname, deviceId } = req.body;

    if (!nickname || !deviceId) {
      return res.status(400).json({ error: '昵称和设备ID不能为空' });
    }

    if (nickname.length < 1 || nickname.length > 20) {
      return res.status(400).json({ error: '昵称长度需在1-20个字符之间' });
    }

    // Check if device_id already exists -> return existing user
    const existingUser = db.prepare('SELECT * FROM users WHERE device_id = ?').get(deviceId) as any;

    if (existingUser) {
      // Update nickname if changed
      if (existingUser.nickname !== nickname) {
        db.prepare('UPDATE users SET nickname = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?')
          .run(nickname, existingUser.id);
        existingUser.nickname = nickname;
      }

      // Initialize intimacy records for all members if not exist
      const members = db.prepare('SELECT id FROM members ORDER BY sort_order').all() as any[];
      for (const member of members) {
        const intimacyExists = db.prepare('SELECT id FROM intimacy WHERE user_id = ? AND member_id = ?')
          .get(existingUser.id, member.id);
        if (!intimacyExists) {
          db.prepare(`
            INSERT INTO intimacy (id, user_id, member_id, intimacy_score, intimacy_level, relationship_title, last_daily_bonus_date)
            VALUES (?, ?, ?, 0, 1, '初识粉丝', '')
          `).run(uuidv4(), existingUser.id, member.id);
        }
      }

      return res.json({
        user: {
          id: existingUser.id,
          nickname,
          deviceId,
          currentMood: existingUser.current_mood || 'normal',
          createdAt: existingUser.created_at,
        },
        isNew: false,
      });
    }

    // Create new user
    const userId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, nickname, device_id)
      VALUES (?, ?, ?)
    `).run(userId, nickname, deviceId);

    // Initialize intimacy for all members
    const members = db.prepare('SELECT id FROM members ORDER BY sort_order').all() as any[];
    for (const member of members) {
      db.prepare(`
        INSERT INTO intimacy (id, user_id, member_id, intimacy_score, intimacy_level, relationship_title, last_daily_bonus_date)
        VALUES (?, ?, ?, 0, 1, '初识粉丝', '')
      `).run(uuidv4(), userId, member.id);
    }

    res.json({
      user: {
        id: userId,
        nickname,
        deviceId,
        currentMood: 'normal',
        createdAt: new Date().toISOString(),
      },
      isNew: true,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Get current user info
router.get('/me', (req, res) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: '缺少设备ID' });
    }

    const user = db.prepare('SELECT * FROM users WHERE device_id = ?').get(deviceId) as any;

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        deviceId: user.device_id,
        currentMood: user.current_mood,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Update mood
router.put('/mood', (req, res) => {
  try {
    const { userId, mood } = req.body;

    if (!userId || !mood) {
      return res.status(400).json({ error: '参数不完整' });
    }

    db.prepare('UPDATE users SET current_mood = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?')
      .run(mood, userId);

    res.json({ message: '心情已更新', mood });
  } catch (error) {
    console.error('Update mood error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Update nickname
router.put('/nickname', (req, res) => {
  try {
    const { userId, nickname } = req.body;

    if (!userId || !nickname) {
      return res.status(400).json({ error: '参数不完整' });
    }

    if (nickname.length < 1 || nickname.length > 20) {
      return res.status(400).json({ error: '昵称长度需在1-20个字符之间' });
    }

    db.prepare('UPDATE users SET nickname = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?')
      .run(nickname, userId);

    res.json({ message: '昵称已更新', nickname });
  } catch (error) {
    console.error('Update nickname error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;

import { Router } from 'express';
import { getIntimacy, getAllIntimacy } from '../services/intimacyService.js';

const router = Router();

// Get intimacy for a specific member
router.get('/:userId/:memberId', (req, res) => {
  try {
    const { userId, memberId } = req.params;
    const intimacy = getIntimacy(userId, memberId);
    res.json({ intimacy });
  } catch (error) {
    console.error('Get intimacy error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Get all intimacy data for a user
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const intimacyList = getAllIntimacy(userId);
    res.json({ intimacyList });
  } catch (error) {
    console.error('Get all intimacy error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;

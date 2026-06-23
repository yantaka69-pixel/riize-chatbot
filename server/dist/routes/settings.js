import { Router } from 'express';
import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const router = Router();
// --- Settings API --- 
// Verify admin password
router.post('/verify-password', (req, res) => {
    try {
        const { password } = req.body;
        const settings = db.prepare('SELECT admin_password_hash FROM settings WHERE id = ?').get('settings_1');
        if (!settings) {
            return res.status(404).json({ error: '设置不存在' });
        }
        // First version: plain text comparison (password stored as-is)
        if (password === settings.admin_password_hash) {
            return res.json({ verified: true });
        }
        return res.status(401).json({ error: '密码错误' });
    }
    catch (error) {
        console.error('Verify password error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// Get settings (API config only, not sensitive)
router.get('/api-config', (req, res) => {
    try {
        const settings = db.prepare('SELECT base_url, model_name FROM settings WHERE id = ?').get('settings_1');
        if (!settings) {
            return res.status(404).json({ error: '设置不存在' });
        }
        // Note: we do NOT return api_key to frontend for security
        res.json({
            baseUrl: settings.base_url,
            modelName: settings.model_name,
        });
    }
    catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// Update API settings (requires admin password verification in body)
router.post('/api-config', (req, res) => {
    try {
        const { apiKey, baseUrl, modelName, adminPassword } = req.body;
        // Verify admin password
        const settings = db.prepare('SELECT admin_password_hash FROM settings WHERE id = ?').get('settings_1');
        if (adminPassword !== settings.admin_password_hash) {
            return res.status(401).json({ error: '管理密码错误' });
        }
        const updates = [];
        const values = [];
        if (apiKey !== undefined) {
            updates.push('api_key = ?');
            values.push(apiKey);
        }
        if (baseUrl !== undefined) {
            updates.push('base_url = ?');
            values.push(baseUrl);
        }
        if (modelName !== undefined) {
            updates.push('model_name = ?');
            values.push(modelName);
        }
        if (updates.length > 0) {
            values.push('settings_1');
            db.prepare(`UPDATE settings SET ${updates.join(', ')}, updated_at = datetime('now', 'localtime') WHERE id = ?`)
                .run(...values);
        }
        res.json({ message: 'API配置已更新' });
    }
    catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// Delete account data
router.delete('/account/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { adminPassword } = req.body;
        // Verify admin password or verify it's the user's own request
        const settings = db.prepare('SELECT admin_password_hash FROM settings WHERE id = ?').get('settings_1');
        if (adminPassword !== settings.admin_password_hash) {
            return res.status(401).json({ error: '管理密码错误' });
        }
        // Delete all user data (cascade will handle related tables)
        db.prepare('DELETE FROM conversations WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM intimacy WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM proactive_messages WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM user_member_notes WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);
        res.json({ message: '账号全部数据已删除' });
    }
    catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// --- Upload API --- 
const uploadDir = process.env.UPLOAD_DIR || './data/uploads';
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('只支持 JPG/PNG/GIF/WebP 格式'));
        }
    },
});
// Upload avatar for a member
router.post('/avatar/:memberId', upload.single('avatar'), (req, res) => {
    try {
        const { memberId } = req.params;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: '请选择图片文件' });
        }
        const avatarUrl = `/uploads/${file.filename}`;
        db.prepare('UPDATE members SET avatar_url = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?')
            .run(avatarUrl, memberId);
        res.json({ avatarUrl, message: '头像已上传' });
    }
    catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ error: '上传失败' });
    }
});
// Upload background for a member
router.post('/background/:memberId', upload.single('background'), (req, res) => {
    try {
        const { memberId } = req.params;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: '请选择图片文件' });
        }
        const backgroundUrl = `/uploads/${file.filename}`;
        db.prepare('UPDATE members SET background_url = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?')
            .run(backgroundUrl, memberId);
        res.json({ backgroundUrl, message: '背景已上传' });
    }
    catch (error) {
        console.error('Upload background error:', error);
        res.status(500).json({ error: '上传失败' });
    }
});
// Serve uploaded files
router.get('/files/:filename', (req, res) => {
    try {
        const filePath = path.join(uploadDir, req.params.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '文件不存在' });
        }
        res.sendFile(filePath);
    }
    catch (error) {
        console.error('Serve file error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
export default router;

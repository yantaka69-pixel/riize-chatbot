import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/index.js';
import authRoutes from './routes/auth.js';
import membersRoutes from './routes/members.js';
import chatRoutes from './routes/chat.js';
import settingsRoutes from './routes/settings.js';
import intimacyRoutes from './routes/intimacy.js';
// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;
// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Serve uploaded files statically
const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '../data/uploads');
app.use('/uploads', express.static(uploadDir));
// Initialize database
initDatabase();
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/intimacy', intimacyRoutes);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Serve frontend static files in production
// In local dev: __dirname = server/dist, so ../../client/dist works
// In deployment: __dirname = dist, so ../client/dist works
// Use env variable to override if needed
const frontendDistPath = process.env.FRONTEND_DIST_PATH || path.resolve(__dirname, '../../client/dist');
app.use(express.static(frontendDistPath));
// SPA fallback - all non-API routes serve index.html
app.get('*', (_req, res, next) => {
    if (_req.path.startsWith('/api') || _req.path.startsWith('/uploads')) {
        return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});
app.listen(PORT, () => {
    console.log(`✅ RIIZE Chat Server running on http://localhost:${PORT}`);
    console.log(`📁 Upload directory: ${uploadDir}`);
    console.log(`🌐 Frontend static files: ${frontendDistPath}`);
    console.log(`🔑 API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes ✅' : 'No (using fallback) ⚠️'}`);
});

import 'dotenv/config';
import 'express-async-errors';   // must be imported BEFORE routes
import express        from 'express';
import mongoose       from 'mongoose';
import cors           from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync }    from 'fs';
import authRoutes        from './routes/auth.js';
import leaderboardRoutes from './routes/leaderboard.js';
import roomRoutes        from './routes/rooms.js';

const app  = express();
const PORT = process.env.PORT || 5000;

// ── __dirname equivalent for ESM ────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
    origin: allowedOrigins.length
        ? (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
            cb(new Error(`CORS: Origin ${origin} not allowed`));
        }
        : '*',
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/rooms',       roomRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── Serve React build in production ───────────────────────────────────────────
// When the backend and frontend are deployed together (same service),
// serve the Vite dist folder and handle SPA routing.
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
    app.use(express.static(distPath));
    // Catch-all → return index.html for client-side routes
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(join(distPath, 'index.html'));
        }
    });
    console.log(`📦  Serving React build from ${distPath}`);
}

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('[YTLearn API Error]', err.stack || err.message);
    const status = typeof err.status === 'number' ? err.status : 500;
    res.status(status).json({
        success: false,
        message: err.message || 'Internal server error.',
    });
});

// ── DB + Start ────────────────────────────────────────────────────────────────
mongoose
    .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ytlearn')
    .then(() => {
        console.log('✅  MongoDB connected → ytlearn');
        app.listen(PORT, () => console.log(`🚀  YTLearn API running on http://localhost:${PORT}`));
    })
    .catch(err => {
        console.error('❌  MongoDB connection failed:', err.message);
        process.exit(1);
    });

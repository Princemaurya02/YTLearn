import 'dotenv/config';
import 'express-async-errors';   // must be imported BEFORE routes — patches async handlers
import express        from 'express';
import mongoose       from 'mongoose';
import cors           from 'cors';
import authRoutes     from './routes/auth.js';

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
// Allow requests from any configured CLIENT_ORIGIN (comma-separated) or * in dev
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins.length
        ? (origin, cb) => {
            // allow server-to-server (no origin) or a listed origin
            if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
            cb(new Error(`CORS: Origin ${origin} not allowed`));
        }
        : '*',        // no CLIENT_ORIGIN set → open CORS (useful for local dev)
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('[YTLearn API Error]', err.stack || err.message);
    // Always return JSON — never let the client receive an empty body
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

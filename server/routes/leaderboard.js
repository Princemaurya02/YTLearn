import express from 'express';
import User     from '../models/User.js';

const router = express.Router();

// ─── Medal badges ──────────────────────────────────────────────────────────────
const BADGES = ['👑', '🥈', '🥉', '⭐', '🎖️', '🎗️'];

const LEVEL_NAMES = [
    'Beginner', 'Learner', 'Explorer', 'Achiever',
    'Scholar', 'Expert', 'Master', 'Legend', 'Grand Master', 'Supreme', 'GOAT'
];

function levelName(lv) { return LEVEL_NAMES[Math.min(lv - 1, LEVEL_NAMES.length - 1)]; }

// ─── GET /api/leaderboard ──────────────────────────────────────────────────────
// Returns all users sorted by XP desc (top 50). Strips sensitive info.
router.get('/', async (req, res) => {
    try {
        const users = await User.find({})
            .sort({ xp: -1, totalHours: -1 })
            .limit(50)
            .lean();

        const entries = users.map((u, i) => ({
            id:         u._id.toString(),
            name:       u.name || u.email.split('@')[0],
            email:      u.email,
            xp:         u.xp         || 0,
            level:      u.level      || 1,
            levelName:  levelName(u.level || 1),
            totalHours: +(u.totalHours || 0).toFixed(1),
            rank:       i + 1,
            badge:      BADGES[i] || '',
            avatarColor: u.avatarColor || '#7c6eff',
        }));

        return res.status(200).json({ success: true, entries });
    } catch (err) {
        console.error('[leaderboard error]', err.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch leaderboard.' });
    }
});

// ─── POST /api/leaderboard/sync ───────────────────────────────────────────────
// Called by the frontend to update the current user's XP / hours / name in DB.
router.post('/sync', async (req, res) => {
    try {
        const { email, xp, totalHours, name, avatarColor, currentStreak } = req.body;

        if (!email) return res.status(400).json({ success: false, message: 'Email required.' });

        const update = { $set: {} };
        if (typeof xp         === 'number') update.$set.xp         = xp;
        if (typeof totalHours === 'number') update.$set.totalHours = totalHours;
        if (name)                           update.$set.name        = name;
        if (avatarColor)                    update.$set.avatarColor = avatarColor;
        if (typeof currentStreak === 'number') update.$set.currentStreak = currentStreak;

        // MongoDB pre-save hook won't run with findOneAndUpdate, so compute level here
        if (typeof xp === 'number') {
            const THRESH = [0, 500, 1200, 2500, 4500, 7000, 10000, 14000, 19000, 25000, 32000];
            let lv = 1;
            for (let i = 1; i < THRESH.length; i++) {
                if (xp >= THRESH[i]) lv = i + 1; else break;
            }
            const nextThresh = THRESH[lv] ?? THRESH[THRESH.length - 1];
            update.$set.level   = lv;
            update.$set.xpToNext = Math.max(0, nextThresh - xp);
        }

        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            update,
            { new: true }
        );

        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        return res.status(200).json({
            success: true,
            level:   user.level,
            xpToNext: user.xpToNext,
        });
    } catch (err) {
        console.error('[leaderboard/sync error]', err.message);
        return res.status(500).json({ success: false, message: 'Sync failed.' });
    }
});

export default router;

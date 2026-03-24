import mongoose from 'mongoose';

// Level thresholds — same as frontend AppContext
const LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 4500, 7000, 10000, 14000, 19000, 25000, 32000];

function computeLevel(xp) {
    let lv = 1;
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
        if (xp >= LEVEL_THRESHOLDS[i]) lv = i + 1; else break;
    }
    return lv;
}

function xpToNext(xp) {
    const lv   = computeLevel(xp) - 1; // 0-indexed
    const next = LEVEL_THRESHOLDS[lv + 1];
    return next ? next - xp : 0;
}

const UserSchema = new mongoose.Schema(
    {
        email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
        name:          { type: String, default: '' },           // display name
        profilePhoto:  { type: String, default: '' },
        avatarColor:   { type: String, default: '#7c6eff' },
        bio:           { type: String, default: '' },
        lastLogin:     { type: Date,   default: null },
        currentStreak: { type: Number, default: 0 },
        lastStudyDate: { type: Date,   default: null },

        // ── Gamification ──────────────────────────────────────────────
        xp:            { type: Number, default: 0 },
        level:         { type: Number, default: 1 },
        xpToNext:      { type: Number, default: 500 },
        totalHours:    { type: Number, default: 0 },   // in hours (float)
    },
    { timestamps: true }
);

// Auto-compute level + xpToNext before saving
UserSchema.pre('save', function (next) {
    if (this.isModified('xp') || this.isNew) {
        this.level   = computeLevel(this.xp);
        this.xpToNext = xpToNext(this.xp);
    }
    next();
});

export default mongoose.model('User', UserSchema);

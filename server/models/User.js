import mongoose from 'mongoose';

// Password-free user — identified by email only
const UserSchema = new mongoose.Schema(
    {
        email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
        profilePhoto:  { type: String, default: '' },
        avatarColor:   { type: String, default: '#7c6eff' },
        bio:           { type: String, default: '' },
        lastLogin:     { type: Date,   default: null },
        currentStreak: { type: Number, default: 0 },
        lastStudyDate: { type: Date,   default: null },
    },
    { timestamps: true }
);

export default mongoose.model('User', UserSchema);

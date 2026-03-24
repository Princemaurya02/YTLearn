import express    from 'express';
import crypto     from 'crypto';
import dns        from 'dns/promises';
import User       from '../models/User.js';
import Otp        from '../models/Otp.js';
import { sendOtpEmail } from '../utils/email.js';

const router = express.Router();

// ─── Helper: safe public user ─────────────────────────────────────────────────
function safeUser(u) {
    return {
        id:            u._id,
        email:         u.email,
        profilePhoto:  u.profilePhoto || '',
        avatarColor:   u.avatarColor  || '#7c6eff',
        bio:           u.bio          || '',
        currentStreak: u.currentStreak || 0,
        lastLogin:     u.lastLogin,
        createdAt:     u.createdAt,
    };
}

// ─── Helper: verify email domain has real MX records (DNS check) ──────────────
async function isRealEmailDomain(email) {
    const domain = email.split('@')[1];
    if (!domain) return false;

    // Block known test/dev/fake domains
    const BLOCKED = [
        'ytlearn.dev', 'test.com', 'example.com', 'fake.com',
        'mailinator.com', 'guerrillamail.com', 'trashmail.com',
        'tempmail.com', 'throwam.com', 'yopmail.com', 'sharklasers.com',
        'guerrillamailblock.com', 'grr.la', 'guerrillamail.info',
        'spam4.me', 'dispostable.com', 'mailnull.com', '10minutemail.com',
    ];
    if (BLOCKED.includes(domain.toLowerCase())) return false;

    // DNS MX record check — does this domain actually receive email?
    try {
        const records = await dns.resolveMx(domain);
        return Array.isArray(records) && records.length > 0;
    } catch {
        return false; // domain doesn't exist / no MX record
    }
}

// ─── POST /api/auth/send-otp ──────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        const normalised = email.toLowerCase().trim();

        // Basic format check
        const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRx.test(normalised)) {
            return res.status(400).json({ success: false, message: 'Invalid email format.' });
        }

        // DNS MX check — reject fake/non-existent email domains
        const isReal = await isRealEmailDomain(normalised);
        if (!isReal) {
            return res.status(400).json({
                success: false,
                message: 'This email address does not appear to be valid. Please use a real email address.',
            });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Delete any existing OTP for this email
        await Otp.deleteMany({ email: normalised });

        // Save new OTP (expires in 5 minutes)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await Otp.create({ email: normalised, otp, expiresAt });

        // Send email (real or dev mode if GMAIL_PASS not set)
        await sendOtpEmail(normalised, otp);

        console.log(`[send-otp] OTP sent → ${normalised}`);
        return res.status(200).json({ success: true, message: 'OTP sent to your email.' });

    } catch (error) {
        console.error('[send-otp error]', error.message);
        return res.status(500).json({ success: false, message: error.message || 'Failed to send OTP.' });
    }
});

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
        }

        const normalised = email.toLowerCase().trim();

        // Find OTP record
        const record = await Otp.findOne({ email: normalised });
        if (!record) {
            return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.' });
        }

        // Check expiry
        if (record.expiresAt < new Date()) {
            await Otp.deleteMany({ email: normalised });
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Verify code
        if (record.otp !== otp.trim()) {
            return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
        }

        // Delete used OTP
        await Otp.deleteMany({ email: normalised });

        // Find or create user
        let user = await User.findOne({ email: normalised });
        const isNewUser = !user;
        if (isNewUser) {
            user = await User.create({ email: normalised });
            console.log(`[verify-otp] New user created: ${normalised}`);
        }

        // Update lastLogin
        user.lastLogin = new Date();
        await user.save();

        console.log(`[verify-otp] Login success → ${normalised} (${isNewUser ? 'new' : 'returning'})`);
        return res.status(200).json({ success: true, isNewUser, user: safeUser(user) });

    } catch (error) {
        console.error('[verify-otp error]', error.message);
        return res.status(500).json({ success: false, message: error.message || 'OTP verification failed.' });
    }
});

export default router;

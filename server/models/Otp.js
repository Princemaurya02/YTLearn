import mongoose from 'mongoose';

// OTP codes expire in 5 minutes via MongoDB TTL index
const OtpSchema = new mongoose.Schema({
    email:     { type: String, required: true, lowercase: true, trim: true },
    otp:       { type: String, required: true },
    expiresAt: { type: Date,   required: true, index: { expires: 0 } }, // TTL: auto-delete at expiresAt
});

export default mongoose.model('Otp', OtpSchema);

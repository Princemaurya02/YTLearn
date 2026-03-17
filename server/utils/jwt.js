import jwt from 'jsonwebtoken';

const SECRET  = process.env.JWT_SECRET  || 'ytlearn_fallback_secret';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token) {
    return jwt.verify(token, SECRET);
}

/**
 * Express middleware — attaches req.user or sends 401.
 */
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided.' });
    }
    try {
        req.user = verifyToken(header.slice(7));
        next();
    } catch {
        res.status(401).json({ message: 'Token invalid or expired.' });
    }
}

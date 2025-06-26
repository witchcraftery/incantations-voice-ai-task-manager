"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = __importDefault(require("express"));
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const index_1 = require("../index");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
exports.authRouter = router;
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
// Validation schemas
const GoogleTokenSchema = zod_1.z.object({
    credential: zod_1.z.string(),
    clientId: zod_1.z.string()
});
// Google OAuth login
router.post('/google', async (req, res) => {
    try {
        const { credential } = GoogleTokenSchema.parse(req.body);
        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid Google token' });
        }
        const { email, name, picture, sub: googleId } = payload;
        // Check if user exists
        let userResult = await index_1.db.query('SELECT * FROM users WHERE email = $1', [email]);
        let user;
        if (userResult.rows.length === 0) {
            // Create new user
            const insertResult = await index_1.db.query(`INSERT INTO users (email, name, avatar_url, google_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`, [email, name, picture, googleId]);
            user = insertResult.rows[0];
            logger_1.logger.info(`✅ New user created: ${email}`);
        }
        else {
            // Update existing user
            const updateResult = await index_1.db.query(`UPDATE users 
         SET name = $1, avatar_url = $2, google_id = $3, updated_at = NOW(), last_login = NOW()
         WHERE email = $4
         RETURNING *`, [name, picture, googleId, email]);
            user = updateResult.rows[0];
            logger_1.logger.info(`✅ User login: ${email}`);
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            name: user.name
        }, process.env.JWT_SECRET, { expiresIn: '30d' });
        // Set secure cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatar_url
            },
            token
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Google auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});
// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Get fresh user data
        const userResult = await index_1.db.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }
        const user = userResult.rows[0];
        // Generate new token
        const newToken = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            name: user.name
        }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatar_url
            },
            token: newToken
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Token refresh error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});
// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true });
});
// Get current user
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userResult = await index_1.db.query('SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1', [decoded.userId]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }
        const user = userResult.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatar_url,
            createdAt: user.created_at
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Get user error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});
//# sourceMappingURL=auth.js.map
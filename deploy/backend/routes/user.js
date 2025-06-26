"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const index_1 = require("../index");
const router = express_1.default.Router();
exports.userRouter = router;
// Get user profile
router.get('/profile', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userResult = await index_1.db.query('SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
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
        res.status(500).json({ error: 'Failed to get profile' });
    }
});
// Update user profile
router.patch('/profile', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name } = req.body;
        await index_1.db.query('UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2', [name, userId]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
//# sourceMappingURL=user.js.map
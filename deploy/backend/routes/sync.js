"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncRouter = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
exports.syncRouter = router;
// Validation schemas
const SyncDataSchema = zod_1.z.object({
    tasks: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        title: zod_1.z.string(),
        description: zod_1.z.string().optional(),
        priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']),
        status: zod_1.z.enum(['pending', 'in-progress', 'completed', 'cancelled']),
        dueDate: zod_1.z.string().optional(),
        project: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()),
        createdAt: zod_1.z.string(),
        updatedAt: zod_1.z.string(),
        extractedFrom: zod_1.z.string().optional()
    })),
    conversations: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        title: zod_1.z.string(),
        summary: zod_1.z.string().optional(),
        messages: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            type: zod_1.z.enum(['user', 'assistant']),
            content: zod_1.z.string(),
            timestamp: zod_1.z.string(),
            isVoiceInput: zod_1.z.boolean().optional(),
            extractedTasks: zod_1.z.array(zod_1.z.string()).optional(),
            metadata: zod_1.z.record(zod_1.z.any()).optional()
        })),
        createdAt: zod_1.z.string(),
        updatedAt: zod_1.z.string()
    })),
    preferences: zod_1.z.record(zod_1.z.any())
});
// Upload local data to cloud
router.post('/upload', auth_1.authMiddleware, async (req, res) => {
    try {
        const { tasks, conversations, preferences } = SyncDataSchema.parse(req.body);
        const userId = req.user.userId;
        // Start transaction
        await index_1.db.query('BEGIN');
        // Clear existing data
        await index_1.db.query('DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = $1)', [userId]);
        await index_1.db.query('DELETE FROM conversations WHERE user_id = $1', [userId]);
        await index_1.db.query('DELETE FROM tasks WHERE user_id = $1', [userId]);
        // Insert tasks
        for (const task of tasks) {
            await index_1.db.query(`INSERT INTO tasks (user_id, title, description, priority, status, due_date, project, tags, extracted_from, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
                userId,
                task.title,
                task.description,
                task.priority,
                task.status,
                task.dueDate ? new Date(task.dueDate) : null,
                task.project,
                task.tags,
                task.extractedFrom,
                new Date(task.createdAt),
                new Date(task.updatedAt)
            ]);
        }
        // Insert conversations and messages
        for (const conversation of conversations) {
            const convResult = await index_1.db.query(`INSERT INTO conversations (user_id, title, summary, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`, [
                userId,
                conversation.title,
                conversation.summary,
                new Date(conversation.createdAt),
                new Date(conversation.updatedAt)
            ]);
            const conversationId = convResult.rows[0].id;
            for (const message of conversation.messages) {
                await index_1.db.query(`INSERT INTO messages (conversation_id, type, content, is_voice_input, extracted_task_ids, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                    conversationId,
                    message.type,
                    message.content,
                    message.isVoiceInput || false,
                    message.extractedTasks || [],
                    message.metadata || {},
                    new Date(message.timestamp)
                ]);
            }
        }
        // Save preferences
        await index_1.db.query(`INSERT INTO user_preferences (user_id, preferences)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET preferences = $2, updated_at = NOW()`, [userId, JSON.stringify(preferences)]);
        await index_1.db.query('COMMIT');
        logger_1.logger.info(`📤 Data uploaded for user ${userId}: ${tasks.length} tasks, ${conversations.length} conversations`);
        res.json({ success: true, message: 'Data uploaded successfully' });
    }
    catch (error) {
        await index_1.db.query('ROLLBACK');
        logger_1.logger.error('❌ Upload failed:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});
// Download cloud data
router.get('/download', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        // Get tasks
        const tasksResult = await index_1.db.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        // Get conversations with messages
        const conversationsResult = await index_1.db.query('SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        const conversations = [];
        for (const conv of conversationsResult.rows) {
            const messagesResult = await index_1.db.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC', [conv.id]);
            conversations.push({
                id: conv.id.toString(),
                title: conv.title,
                summary: conv.summary,
                messages: messagesResult.rows.map(msg => ({
                    id: msg.id.toString(),
                    type: msg.type,
                    content: msg.content,
                    timestamp: msg.created_at.toISOString(),
                    isVoiceInput: msg.is_voice_input,
                    extractedTasks: msg.extracted_task_ids || [],
                    metadata: msg.metadata || {}
                })),
                createdAt: conv.created_at.toISOString(),
                updatedAt: conv.updated_at.toISOString()
            });
        }
        // Get preferences
        const prefsResult = await index_1.db.query('SELECT preferences FROM user_preferences WHERE user_id = $1', [userId]);
        const preferences = prefsResult.rows[0]?.preferences || {};
        const data = {
            tasks: tasksResult.rows.map(task => ({
                id: task.id.toString(),
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: task.status,
                dueDate: task.due_date?.toISOString(),
                project: task.project,
                tags: task.tags || [],
                createdAt: task.created_at.toISOString(),
                updatedAt: task.updated_at.toISOString(),
                extractedFrom: task.extracted_from
            })),
            conversations,
            preferences
        };
        logger_1.logger.info(`📥 Data downloaded for user ${userId}: ${data.tasks.length} tasks, ${data.conversations.length} conversations`);
        res.json(data);
    }
    catch (error) {
        logger_1.logger.error('❌ Download failed:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});
// Sync preferences only
router.post('/preferences', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const preferences = req.body;
        await index_1.db.query(`INSERT INTO user_preferences (user_id, preferences)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET preferences = $2, updated_at = NOW()`, [userId, JSON.stringify(preferences)]);
        res.json({ success: true });
    }
    catch (error) {
        logger_1.logger.error('❌ Preferences sync failed:', error);
        res.status(500).json({ error: 'Sync failed' });
    }
});
//# sourceMappingURL=sync.js.map
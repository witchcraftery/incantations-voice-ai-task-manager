import express from 'express';
import { z } from 'zod';
import { db } from '../index';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const SyncDataSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']),
    dueDate: z.string().optional(),
    project: z.string().optional(),
    tags: z.array(z.string()),
    createdAt: z.string(),
    updatedAt: z.string(),
    extractedFrom: z.string().optional()
  })),
  conversations: z.array(z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string().optional(),
    messages: z.array(z.object({
      id: z.string(),
      type: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.string(),
      isVoiceInput: z.boolean().optional(),
      extractedTasks: z.array(z.string()).optional(),
      metadata: z.record(z.any()).optional()
    })),
    createdAt: z.string(),
    updatedAt: z.string()
  })),
  preferences: z.record(z.any())
});

// Upload local data to cloud
router.post('/upload', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { tasks, conversations, preferences } = SyncDataSchema.parse(req.body);
    const userId = req.user!.userId;

    // Start transaction
    await db.query('BEGIN');

    // Clear existing data
    await db.query('DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = $1)', [userId]);
    await db.query('DELETE FROM conversations WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM tasks WHERE user_id = $1', [userId]);

    // Insert tasks
    for (const task of tasks) {
      await db.query(
        `INSERT INTO tasks (user_id, title, description, priority, status, due_date, project, tags, extracted_from, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
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
        ]
      );
    }

    // Insert conversations and messages
    for (const conversation of conversations) {
      const convResult = await db.query(
        `INSERT INTO conversations (user_id, title, summary, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          userId,
          conversation.title,
          conversation.summary,
          new Date(conversation.createdAt),
          new Date(conversation.updatedAt)
        ]
      );
      
      const conversationId = convResult.rows[0].id;

      for (const message of conversation.messages) {
        await db.query(
          `INSERT INTO messages (conversation_id, type, content, is_voice_input, extracted_task_ids, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            conversationId,
            message.type,
            message.content,
            message.isVoiceInput || false,
            message.extractedTasks || [],
            message.metadata || {},
            new Date(message.timestamp)
          ]
        );
      }
    }

    // Save preferences
    await db.query(
      `INSERT INTO user_preferences (user_id, preferences)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET preferences = $2, updated_at = NOW()`,
      [userId, JSON.stringify(preferences)]
    );

    await db.query('COMMIT');

    logger.info(`📤 Data uploaded for user ${userId}: ${tasks.length} tasks, ${conversations.length} conversations`);

    res.json({ success: true, message: 'Data uploaded successfully' });

  } catch (error) {
    await db.query('ROLLBACK');
    logger.error('❌ Upload failed:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Download cloud data
router.get('/download', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Get tasks
    const tasksResult = await db.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    // Get conversations with messages
    const conversationsResult = await db.query(
      'SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const conversations = [];
    for (const conv of conversationsResult.rows) {
      const messagesResult = await db.query(
        'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [conv.id]
      );

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
    const prefsResult = await db.query(
      'SELECT preferences FROM user_preferences WHERE user_id = $1',
      [userId]
    );

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

    logger.info(`📥 Data downloaded for user ${userId}: ${data.tasks.length} tasks, ${data.conversations.length} conversations`);

    res.json(data);

  } catch (error) {
    logger.error('❌ Download failed:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Sync preferences only
router.post('/preferences', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const preferences = req.body;

    await db.query(
      `INSERT INTO user_preferences (user_id, preferences)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET preferences = $2, updated_at = NOW()`,
      [userId, JSON.stringify(preferences)]
    );

    res.json({ success: true });

  } catch (error) {
    logger.error('❌ Preferences sync failed:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

export { router as syncRouter };

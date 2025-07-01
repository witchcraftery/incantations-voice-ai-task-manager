import express from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../index';

const router = express.Router();

// Get all tasks for user
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    const result = await db.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const tasks = result.rows.map(task => ({
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
    }));

    res.json(tasks);

  } catch (error) {
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Create new task
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { title, description, priority, dueDate, project, tags } = req.body;

    const result = await db.query(
      `INSERT INTO tasks (user_id, title, description, priority, due_date, project, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, title, description, priority, dueDate ? new Date(dueDate) : null, project, tags]
    );

    const task = result.rows[0];
    res.json({
      id: task.id.toString(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.due_date?.toISOString(),
      project: task.project,
      tags: task.tags || [],
      createdAt: task.created_at.toISOString(),
      updatedAt: task.updated_at.toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.patch('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const taskId = req.params.id;
    const updates = req.body;

    const result = await db.query(
      `UPDATE tasks SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        priority = COALESCE($3, priority),
        status = COALESCE($4, status),
        due_date = COALESCE($5, due_date),
        project = COALESCE($6, project),
        tags = COALESCE($7, tags),
        updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        updates.title,
        updates.description,
        updates.priority,
        updates.status,
        updates.dueDate ? new Date(updates.dueDate) : null,
        updates.project,
        updates.tags,
        taskId,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = result.rows[0];
    res.json({
      id: task.id.toString(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.due_date?.toISOString(),
      project: task.project,
      tags: task.tags || [],
      createdAt: task.created_at.toISOString(),
      updatedAt: task.updated_at.toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const taskId = req.params.id;

    const result = await db.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export { router as taskRouter };

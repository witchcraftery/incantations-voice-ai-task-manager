import React from 'react';
import { CheckCircle2, Circle, Calendar, Flag, Tag, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Task } from '../types';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit?: (taskId: string, updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  showProject?: boolean;
  showExtractedFrom?: boolean;
}

export function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  showProject = true,
  showExtractedFrom = false
}: TaskCardProps) {
  const isCompleted = task.status === 'completed';
  const isOverdue = task.dueDate && new Date() > task.dueDate && !isCompleted;

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`group p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
        isCompleted
          ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
          : isOverdue
          ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
          : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleComplete(task.id)}
          className="p-0 h-auto hover:bg-transparent"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          )}
        </Button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Priority */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className={`font-medium leading-tight ${
                isCompleted
                  ? 'line-through text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {task.title}
            </h3>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                <Flag className="h-3 w-3 mr-1" />
                {task.priority}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p
              className={`text-sm mb-3 ${
                isCompleted
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
            {/* Status */}
            <Badge className={`${statusColors[task.status]}`}>
              {task.status.replace('-', ' ')}
            </Badge>

            {/* Due Date */}
            {task.dueDate && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                <Calendar className="h-3 w-3" />
                <span>
                  {isOverdue ? 'Overdue: ' : 'Due: '}
                  {format(task.dueDate, 'MMM d, yyyy')}
                </span>
              </div>
            )}

            {/* Project */}
            {showProject && task.project && (
              <div className="flex items-center gap-1">
                <span>📁</span>
                <span>{task.project}</span>
              </div>
            )}

            {/* Extracted From Message */}
            {showExtractedFrom && task.extractedFrom && (
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <MessageSquare className="h-3 w-3" />
                <span>From conversation</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Tag className="h-3 w-3 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs px-2 py-0"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Created Date */}
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Created {formatDistanceToNow(task.createdAt, { addSuffix: true })}
            {task.updatedAt.getTime() !== task.createdAt.getTime() && (
              <span className="ml-2">
                • Updated {formatDistanceToNow(task.updatedAt, { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {/* Actions (shown on hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task.id, {})}
              className="h-8 w-8 p-0"
            >
              ✏️
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400"
            >
              🗑️
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

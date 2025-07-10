import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Flag,
  Tag,
  MessageSquare,
  Save,
  X,
  Building,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { TaskTimer } from './TaskTimer';
import { Task } from '../types';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit?: (taskId: string, updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  onStartTimer?: (taskId: string) => void;
  onStopTimer?: (taskId: string) => void;
  showProject?: boolean;
  showExtractedFrom?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (taskId: string) => void;
  showSelection?: boolean;
}

export function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onStartTimer,
  onStopTimer,
  showProject = true,
  showExtractedFrom = false,
  isSelected = false,
  onToggleSelect,
  showSelection = false,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || '',
    dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
    project: task.project || '',
    client: task.client || '',
    tags: task.tags.join(', '),
    priority: task.priority,
  });

  const isCompleted = task.status === 'completed';
  const isOverdue = task.dueDate && new Date() > task.dueDate && !isCompleted;

  const handleEditClick = () => {
    setIsEditing(true);
    setEditForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
      project: task.project || '',
      client: task.client || '',
      tags: task.tags.join(', '),
      priority: task.priority,
    });
  };

  const handleSave = () => {
    if (!onEdit || !editForm.title.trim()) return;
    
    const updates: Partial<Task> = {
      title: editForm.title.trim(),
      description: editForm.description.trim() || undefined,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate) : undefined,
      project: editForm.project.trim() || undefined,
      client: editForm.client.trim() || undefined,
      tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      priority: editForm.priority,
      updatedAt: new Date(),
    };
    
    onEdit(task.id, updates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
      project: task.project || '',
      client: task.client || '',
      tags: task.tags.join(', '),
      priority: task.priority,
    });
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'in-progress':
      'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    completed:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
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
        {/* Selection Checkbox */}
        {showSelection && (
          <div className="flex items-center pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.(task.id)}
              className="h-4 w-4"
            />
          </div>
        )}

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
          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-3">
              {/* Title and Priority Row */}
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Task title"
                  className="col-span-2"
                />
                <Select
                  value={editForm.priority}
                  onValueChange={(value) => setEditForm({ ...editForm, priority: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Task description (optional)"
                className="min-h-[60px]"
              />

              {/* Project, Client, Due Date Row */}
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={editForm.project}
                  onChange={(e) => setEditForm({ ...editForm, project: e.target.value })}
                  placeholder="Project"
                />
                <Input
                  value={editForm.client}
                  onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                  placeholder="Client/Company"
                />
                <Input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                />
              </div>

              {/* Tags */}
              <Input
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="Tags (comma-separated)"
              />

              {/* Edit Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} size="sm" className="gap-1">
                  <Save className="h-3 w-3" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm" className="gap-1">
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* Display Mode */
            <div>
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
            </div>
          )}

          {/* Metadata Row */}
          {!isEditing && (
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
              {/* Status */}
              <Badge className={`${statusColors[task.status]}`}>
                {task.status.replace('-', ' ')}
              </Badge>

              {/* Due Date */}
              {task.dueDate && (
                <div
                  className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}
                >
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

              {/* Client/Company */}
              {task.client && (
                <div className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  <span>{task.client}</span>
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
          )}

          {/* Tags */}
          {!isEditing && task.tags.length > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Tag className="h-3 w-3 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {task.tags.map(tag => (
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

          {/* Timer */}
          {!isEditing && onStartTimer && onStopTimer && (
            <div className="mb-2">
              <TaskTimer
                task={task}
                onStartTimer={onStartTimer}
                onStopTimer={onStopTimer}
              />
            </div>
          )}

          {/* Created Date */}
          {!isEditing && (
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Created {formatDistanceToNow(task.createdAt, { addSuffix: true })}
              {task.updatedAt.getTime() !== task.createdAt.getTime() && (
                <span className="ml-2">
                  • Updated{' '}
                  {formatDistanceToNow(task.updatedAt, { addSuffix: true })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions (shown on hover) */}
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="h-8 w-8 p-0"
                title="Edit task"
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
                title="Delete task"
              >
                🗑️
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

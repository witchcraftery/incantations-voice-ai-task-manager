import React, { useState } from 'react';
import { CheckCircle2, Trash2, Edit3, FolderOpen, Tag, X } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Task } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskBulkActionsProps {
  selectedTaskIds: Set<string>;
  tasks: Task[];
  onBulkUpdate: (taskIds: string[], updates: Partial<Task>) => void;
  onBulkDelete: (taskIds: string[]) => void;
  onClearSelection: () => void;
}

export function TaskBulkActions({
  selectedTaskIds,
  tasks,
  onBulkUpdate,
  onBulkDelete,
  onClearSelection
}: TaskBulkActionsProps) {
  const [showActions, setShowActions] = useState(false);
  const selectedCount = selectedTaskIds.size;
  const selectedTasks = tasks.filter(task => selectedTaskIds.has(task.id));

  if (selectedCount === 0) return null;

  const handleStatusUpdate = (status: Task['status']) => {
    onBulkUpdate(Array.from(selectedTaskIds), { status });
    onClearSelection();
  };

  const handlePriorityUpdate = (priority: Task['priority']) => {
    onBulkUpdate(Array.from(selectedTaskIds), { priority });
    onClearSelection();
  };

  const handleProjectUpdate = (project: string) => {
    onBulkUpdate(Array.from(selectedTaskIds), { project: project === 'none' ? undefined : project });
    onClearSelection();
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCount} task(s)?`)) {
      onBulkDelete(Array.from(selectedTaskIds));
    }
  };

  // Get unique projects from all tasks
  const allProjects = Array.from(new Set(tasks.map(task => task.project).filter(Boolean)));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-96"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-2 py-1">
              {selectedCount} selected
            </Badge>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedCount === 1 ? '1 task' : `${selectedCount} tasks`}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusUpdate('completed')}
            className="flex items-center gap-1"
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>

        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                    Status
                  </label>
                  <Select onValueChange={handleStatusUpdate}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Set status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                    Priority
                  </label>
                  <Select onValueChange={handlePriorityUpdate}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Set priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                    Project
                  </label>
                  <Select onValueChange={handleProjectUpdate}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Set project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Project</SelectItem>
                      {allProjects.map(project => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
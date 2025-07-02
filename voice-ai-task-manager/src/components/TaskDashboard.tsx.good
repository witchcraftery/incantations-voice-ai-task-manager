import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, Plus, BarChart3, CheckCircle2, Clock, AlertTriangle, MousePointer } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { TaskCard } from './TaskCard';
import { TaskBulkActions } from './TaskBulkActions';
import { TaskTemplateSelector } from './TaskTemplateSelector';
import { Task, TaskTemplate } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskDashboardProps {
  tasks: Task[];
  selectedTaskIds: Set<string>;
  onToggleComplete: (taskId: string) => void;
  onEditTask?: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
  onStartTimer?: (taskId: string) => void;
  onStopTimer?: (taskId: string) => void;
  onCreateTask?: () => void;
  onCreateTaskFromTemplate?: (template: TaskTemplate) => void;
  onToggleTaskSelection: (taskId: string) => void;
  onSelectAllTasks: () => void;
  onClearSelection: () => void;
  onBulkUpdateTasks: (taskIds: string[], updates: Partial<Task>) => void;
  onBulkDeleteTasks: (taskIds: string[]) => void;
}

type FilterType = 'all' | 'pending' | 'in-progress' | 'completed' | 'overdue';
type SortType = 'created' | 'updated' | 'due' | 'priority' | 'title';

export function TaskDashboard({
  tasks,
  selectedTaskIds,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onStartTimer,
  onStopTimer,
  onCreateTask,
  onCreateTaskFromTemplate,
  onToggleTaskSelection,
  onSelectAllTasks,
  onClearSelection,
  onBulkUpdateTasks,
  onBulkDeleteTasks
}: TaskDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('created');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [showBulkSelection, setShowBulkSelection] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get unique projects
  const projects = useMemo(() => {
    const projectSet = new Set(tasks.map(task => task.project).filter(Boolean));
    return Array.from(projectSet).sort();
  }, [tasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (filterType !== 'all') {
      if (filterType === 'overdue') {
        const now = new Date();
        filtered = filtered.filter(task =>
          task.dueDate &&
          task.dueDate < now &&
          task.status !== 'completed'
        );
      } else {
        filtered = filtered.filter(task => task.status === filterType);
      }
    }

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(task => task.project === selectedProject);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'due':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        case 'priority': {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case 'updated':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'created':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return filtered;
  }, [tasks, searchQuery, filterType, sortType, selectedProject]);

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const pending = tasks.filter(task => task.status === 'pending').length;
    const inProgress = tasks.filter(task => task.status === 'in-progress').length;
    const now = new Date();
    const overdue = tasks.filter(task =>
      task.dueDate &&
      task.dueDate < now &&
      task.status !== 'completed'
    ).length;

    return { total, completed, pending, inProgress, overdue };
  }, [tasks]);

  const getFilterCount = (filter: FilterType) => {
    switch (filter) {
      case 'all': return stats.total;
      case 'pending': return stats.pending;
      case 'in-progress': return stats.inProgress;
      case 'completed': return stats.completed;
      case 'overdue': return stats.overdue;
      default: return 0;
    }
  };

  // Keyboard shortcuts handlers
  const handleFocusSearch = () => {
    searchInputRef.current?.focus();
  };

  const handleDeleteSelected = () => {
    if (selectedTaskIds.size > 0) {
      const selectedArray = Array.from(selectedTaskIds);
      if (window.confirm(`Delete ${selectedArray.length} selected task(s)?`)) {
        onBulkDeleteTasks(selectedArray);
      }
    }
  };

  const handleToggleSelectedComplete = () => {
    if (selectedTaskIds.size > 0) {
      const selectedArray = Array.from(selectedTaskIds);
      onBulkUpdateTasks(selectedArray, { status: 'completed' });
      onClearSelection();
    }
  };

  const handleBulkSelect = () => {
    if (selectedTaskIds.size === filteredAndSortedTasks.length) {
      onClearSelection();
    } else {
      onSelectAllTasks();
    }
  };

  const toggleBulkSelectionMode = () => {
    setShowBulkSelection(!showBulkSelection);
    if (showBulkSelection) {
      onClearSelection();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-950 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Task Dashboard
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage and track your tasks
              </p>
            </div>
          </div>

          {onCreateTask && (
            <Button onClick={onCreateTask} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {stats.total}
            </p>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Completed</span>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
              {stats.completed}
            </p>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
              {stats.inProgress}
            </p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 mt-1">
              {stats.pending}
            </p>
          </div>

          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
              {stats.overdue}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

          <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks ({getFilterCount('all')})</SelectItem>
              <SelectItem value="pending">Pending ({getFilterCount('pending')})</SelectItem>
              <SelectItem value="in-progress">In Progress ({getFilterCount('in-progress')})</SelectItem>
              <SelectItem value="completed">Completed ({getFilterCount('completed')})</SelectItem>
              <SelectItem value="overdue">Overdue ({getFilterCount('overdue')})</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project} value={project}>
                  {project}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortType} onValueChange={(value) => setSortType(value as SortType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Sort by Created</SelectItem>
              <SelectItem value="updated">Sort by Updated</SelectItem>
              <SelectItem value="due">Sort by Due Date</SelectItem>
              <SelectItem value="priority">Sort by Priority</SelectItem>
              <SelectItem value="title">Sort by Title</SelectItem>
            </SelectContent>
          </Select>
          </div>
          
          {/* Bulk Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={showBulkSelection ? "default" : "outline"}
                size="sm"
                onClick={toggleBulkSelectionMode}
                className="flex items-center gap-2"
              >
                <MousePointer className="h-4 w-4" />
                {showBulkSelection ? "Exit Selection" : "Bulk Select"}
              </Button>
              
              {showBulkSelection && selectedTaskIds.size > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {onCreateTaskFromTemplate && (
                <TaskTemplateSelector 
                  onSelectTemplate={onCreateTaskFromTemplate}
                />
              )}
              {onCreateTask && (
                <Button onClick={onCreateTask} size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <TaskBulkActions
        selectedTaskIds={selectedTaskIds}
        tasks={tasks}
        onBulkUpdate={onBulkUpdateTasks}
        onBulkDelete={onBulkDeleteTasks}
        onClearSelection={onClearSelection}
      />

      {/* Task List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onStartTimer={onStartTimer}
                onStopTimer={onStopTimer}
                showProject={selectedProject === 'all'}
                showExtractedFrom={true}
                showSelection={showBulkSelection}
                isSelected={selectedTaskIds.has(task.id)}
                onToggleSelect={onToggleTaskSelection}
              />
            ))}
          </AnimatePresence>

          {filteredAndSortedTasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No tasks found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery || filterType !== 'all' || selectedProject !== 'all'
                  ? 'Try adjusting your filters to see more tasks.'
                  : 'Start by having a conversation about your tasks or create one manually.'}
              </p>
              {onCreateTask && (
                <Button onClick={onCreateTask} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Task
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

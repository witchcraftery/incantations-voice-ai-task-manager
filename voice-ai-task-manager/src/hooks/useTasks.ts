import { useState, useEffect, useCallback } from 'react';
import { Task, Project, TaskTemplate, TimeEntry } from '../types';
import { StorageService } from '../services/storageService';
import { AnalyticsService } from '../services/analyticsService';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set()
  );

  const storageService = new StorageService();
  const analyticsService = new AnalyticsService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const loadedTasks = storageService.loadTasks();
      const loadedProjects = storageService.loadProjects();
      const loadedTemplates = storageService.loadTaskTemplates();

      setTasks(loadedTasks);
      setProjects(loadedProjects);
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = useCallback(
    (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Get time estimation for new task
      const estimation = analyticsService.estimateTaskTime(task);

      const newTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        estimatedMinutes: estimation.estimatedMinutes,
        timeEntries: [],
        totalTimeSpent: 0,
        isActiveTimer: false,
      };

      setTasks(prev => {
        const updated = [...prev, newTask];
        storageService.saveTasks(updated);
        return updated;
      });

      return newTask;
    },
    []
  );

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(task => {
        if (task.id === taskId) {
          const updatedTask = { ...task, ...updates, updatedAt: new Date() };

          // Track timing when status changes
          if (updates.status && updates.status !== task.status) {
            const now = new Date();

            if (updates.status === 'in-progress' && !task.startedAt) {
              updatedTask.startedAt = now;
            } else if (updates.status === 'completed' && task.startedAt) {
              updatedTask.completedAt = now;
              // Track completion for analytics
              analyticsService.trackTaskCompletion(updatedTask);
            }
          }

          return updatedTask;
        }
        return task;
      });
      storageService.saveTasks(updated);
      return updated;
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const updated = prev.filter(task => task.id !== taskId);
      storageService.saveTasks(updated);
      return updated;
    });
  }, []);

  const completeTask = useCallback(
    (taskId: string) => {
      updateTask(taskId, { status: 'completed' });
    },
    [updateTask]
  );

  const reopenTask = useCallback(
    (taskId: string) => {
      updateTask(taskId, { status: 'pending' });
    },
    [updateTask]
  );

  const addProject = useCallback(
    (project: Omit<Project, 'id' | 'createdAt' | 'taskIds'>) => {
      const newProject: Project = {
        ...project,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        taskIds: [],
      };

      setProjects(prev => {
        const updated = [...prev, newProject];
        storageService.saveProjects(updated);
        return updated;
      });

      return newProject;
    },
    []
  );

  const updateProject = useCallback(
    (projectId: string, updates: Partial<Project>) => {
      setProjects(prev => {
        const updated = prev.map(project =>
          project.id === projectId ? { ...project, ...updates } : project
        );
        storageService.saveProjects(updated);
        return updated;
      });
    },
    []
  );

  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => {
      const updated = prev.filter(project => project.id !== projectId);
      storageService.saveProjects(updated);
      return updated;
    });

    // Remove project reference from tasks
    setTasks(prev => {
      const updated = prev.map(task =>
        task.project === projectId ? { ...task, project: undefined } : task
      );
      storageService.saveTasks(updated);
      return updated;
    });
  }, []);

  const getTasksByProject = useCallback(
    (projectName?: string) => {
      return tasks.filter(task => task.project === projectName);
    },
    [tasks]
  );

  const getTasksByStatus = useCallback(
    (status: Task['status']) => {
      return tasks.filter(task => task.status === status);
    },
    [tasks]
  );

  const getTasksByPriority = useCallback(
    (priority: Task['priority']) => {
      return tasks.filter(task => task.priority === priority);
    },
    [tasks]
  );

  const getUpcomingTasks = useCallback(
    (days = 7) => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      return tasks.filter(task => {
        if (!task.dueDate) return false;
        return task.dueDate >= now && task.dueDate <= futureDate;
      });
    },
    [tasks]
  );

  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      return task.dueDate < now;
    });
  }, [tasks]);

  const searchTasks = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return tasks.filter(
        task =>
          task.title.toLowerCase().includes(lowerQuery) ||
          task.description?.toLowerCase().includes(lowerQuery) ||
          task.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    },
    [tasks]
  );

  const getTaskStats = useCallback(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const pending = tasks.filter(task => task.status === 'pending').length;
    const inProgress = tasks.filter(
      task => task.status === 'in-progress'
    ).length;
    const overdue = getOverdueTasks().length;

    return {
      total,
      completed,
      pending,
      inProgress,
      overdue,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [tasks, getOverdueTasks]);

  const getProjectStats = useCallback(() => {
    return projects.map(project => {
      const projectTasks = getTasksByProject(project.name);
      const completed = projectTasks.filter(
        task => task.status === 'completed'
      ).length;
      const total = projectTasks.length;

      return {
        ...project,
        taskCount: total,
        completedCount: completed,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
      };
    });
  }, [projects, getTasksByProject]);

  const bulkUpdateTasks = useCallback(
    (taskIds: string[], updates: Partial<Task>) => {
      setTasks(prev => {
        const updated = prev.map(task =>
          taskIds.includes(task.id)
            ? { ...task, ...updates, updatedAt: new Date() }
            : task
        );
        storageService.saveTasks(updated);
        return updated;
      });
    },
    []
  );

  const bulkDeleteTasks = useCallback((taskIds: string[]) => {
    setTasks(prev => {
      const updated = prev.filter(task => !taskIds.includes(task.id));
      storageService.saveTasks(updated);
      return updated;
    });
    setSelectedTaskIds(new Set());
  }, []);

  // Selection management
  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(taskId)) {
        newSelection.delete(taskId);
      } else {
        newSelection.add(taskId);
      }
      return newSelection;
    });
  }, []);

  const selectAllTasks = useCallback(() => {
    setSelectedTaskIds(new Set(tasks.map(task => task.id)));
  }, [tasks]);

  const clearSelection = useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  const selectTasksByFilter = useCallback(
    (filterFn: (task: Task) => boolean) => {
      const filteredTaskIds = tasks.filter(filterFn).map(task => task.id);
      setSelectedTaskIds(new Set(filteredTaskIds));
    },
    [tasks]
  );

  // Template operations
  const createTaskFromTemplate = useCallback((template: TaskTemplate) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: template.title,
      description: template.taskDescription,
      priority: template.priority,
      status: 'pending',
      project: template.project,
      tags: [...template.tags],
      createdAt: new Date(),
      updatedAt: new Date(),
      timeEntries: [],
      totalTimeSpent: 0,
      isActiveTimer: false,
    };

    setTasks(prev => {
      const updated = [...prev, newTask];
      storageService.saveTasks(updated);
      return updated;
    });

    return newTask;
  }, []);

  // Timer functions
  const startTimer = useCallback(
    (taskId: string) => {
      updateTask(taskId, {
        isActiveTimer: true,
        currentSessionStart: new Date(),
      });
    },
    [updateTask]
  );

  const stopTimer = useCallback((taskId: string) => {
    setTasks(prev => {
      const updated = prev.map(task => {
        if (
          task.id === taskId &&
          task.isActiveTimer &&
          task.currentSessionStart
        ) {
          const endTime = new Date();
          const duration = Math.round(
            (endTime.getTime() - task.currentSessionStart.getTime()) /
              (1000 * 60)
          );

          const newTimeEntry: TimeEntry = {
            id: crypto.randomUUID(),
            startTime: task.currentSessionStart,
            endTime,
            duration,
          };

          const updatedTimeEntries = [...task.timeEntries, newTimeEntry];
          const totalTimeSpent = updatedTimeEntries.reduce(
            (sum, entry) => sum + entry.duration,
            0
          );

          return {
            ...task,
            timeEntries: updatedTimeEntries,
            totalTimeSpent,
            isActiveTimer: false,
            currentSessionStart: undefined,
            updatedAt: new Date(),
          };
        }
        return task;
      });
      storageService.saveTasks(updated);
      return updated;
    });
  }, []);

  const getActiveTimers = useCallback(() => {
    return tasks.filter(task => task.isActiveTimer);
  }, [tasks]);

  const exportTasks = useCallback(() => {
    return {
      tasks,
      projects,
      exportDate: new Date().toISOString(),
    };
  }, [tasks, projects]);

  // Analytics functions
  const getProductivityPatterns = useCallback(() => {
    return analyticsService.calculateProductivityPatterns();
  }, []);

  const getEnergyWindows = useCallback(() => {
    return analyticsService.detectEnergyWindows();
  }, []);

  const getTaskRecommendations = useCallback(() => {
    return analyticsService.calculateTaskOrder(tasks);
  }, [tasks]);

  const getOptimalTimeSuggestions = useCallback((task: Task) => {
    return analyticsService.getOptimalTimeSuggestions(task);
  }, []);

  const estimateTaskTime = useCallback((task: Partial<Task>) => {
    return analyticsService.estimateTaskTime(task);
  }, []);

  return {
    tasks,
    projects,
    templates,
    isLoading,
    selectedTaskIds,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    reopenTask,
    addProject,
    updateProject,
    deleteProject,
    getTasksByProject,
    getTasksByStatus,
    getTasksByPriority,
    getUpcomingTasks,
    getOverdueTasks,
    searchTasks,
    getTaskStats,
    getProjectStats,
    bulkUpdateTasks,
    bulkDeleteTasks,
    toggleTaskSelection,
    selectAllTasks,
    clearSelection,
    selectTasksByFilter,
    createTaskFromTemplate,
    exportTasks,
    loadData,
    // Timer functions
    startTimer,
    stopTimer,
    getActiveTimers,
    // Analytics functions
    getProductivityPatterns,
    getEnergyWindows,
    getTaskRecommendations,
    getOptimalTimeSuggestions,
    estimateTaskTime,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { Task, Project } from '../types';
import { StorageService } from '../services/storageService';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const storageService = new StorageService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const loadedTasks = storageService.loadTasks();
      const loadedProjects = storageService.loadProjects();
      
      setTasks(loadedTasks);
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTasks(prev => {
      const updated = [...prev, newTask];
      storageService.saveTasks(updated);
      return updated;
    });

    return newTask;
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(task =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      );
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

  const completeTask = useCallback((taskId: string) => {
    updateTask(taskId, { status: 'completed' });
  }, [updateTask]);

  const reopenTask = useCallback((taskId: string) => {
    updateTask(taskId, { status: 'pending' });
  }, [updateTask]);

  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt' | 'taskIds'>) => {
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      taskIds: []
    };

    setProjects(prev => {
      const updated = [...prev, newProject];
      storageService.saveProjects(updated);
      return updated;
    });

    return newProject;
  }, []);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    setProjects(prev => {
      const updated = prev.map(project =>
        project.id === projectId ? { ...project, ...updates } : project
      );
      storageService.saveProjects(updated);
      return updated;
    });
  }, []);

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

  const getTasksByProject = useCallback((projectName?: string) => {
    return tasks.filter(task => task.project === projectName);
  }, [tasks]);

  const getTasksByStatus = useCallback((status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  const getTasksByPriority = useCallback((priority: Task['priority']) => {
    return tasks.filter(task => task.priority === priority);
  }, [tasks]);

  const getUpcomingTasks = useCallback((days = 7) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return task.dueDate >= now && task.dueDate <= futureDate;
    });
  }, [tasks]);

  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      return task.dueDate < now;
    });
  }, [tasks]);

  const searchTasks = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return tasks.filter(task =>
      task.title.toLowerCase().includes(lowerQuery) ||
      task.description?.toLowerCase().includes(lowerQuery) ||
      task.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [tasks]);

  const getTaskStats = useCallback(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const pending = tasks.filter(task => task.status === 'pending').length;
    const inProgress = tasks.filter(task => task.status === 'in-progress').length;
    const overdue = getOverdueTasks().length;
    
    return {
      total,
      completed,
      pending,
      inProgress,
      overdue,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  }, [tasks, getOverdueTasks]);

  const getProjectStats = useCallback(() => {
    return projects.map(project => {
      const projectTasks = getTasksByProject(project.name);
      const completed = projectTasks.filter(task => task.status === 'completed').length;
      const total = projectTasks.length;
      
      return {
        ...project,
        taskCount: total,
        completedCount: completed,
        completionRate: total > 0 ? (completed / total) * 100 : 0
      };
    });
  }, [projects, getTasksByProject]);

  const bulkUpdateTasks = useCallback((taskIds: string[], updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(task =>
        taskIds.includes(task.id)
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      );
      storageService.saveTasks(updated);
      return updated;
    });
  }, []);

  const exportTasks = useCallback(() => {
    return {
      tasks,
      projects,
      exportDate: new Date().toISOString()
    };
  }, [tasks, projects]);

  return {
    tasks,
    projects,
    isLoading,
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
    exportTasks,
    loadData
  };
}

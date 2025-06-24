import { useEffect, useRef } from 'react';
import { Task } from '../types';
import { notificationService } from '../services/notificationService';

interface UseNotificationsOptions {
  enabled: boolean;
  checkInterval?: number; // milliseconds
}

export function useNotifications(
  tasks: Task[], 
  options: UseNotificationsOptions = { enabled: true, checkInterval: 60000 }
) {
  const lastCheckRef = useRef<Date>(new Date());
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!options.enabled || !notificationService.hasPermission) {
      return;
    }

    const checkTasks = () => {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      tasks.forEach(task => {
        if (task.status === 'completed' || task.status === 'cancelled') {
          // Remove from notified set if task is done
          notifiedTasksRef.current.delete(task.id);
          return;
        }

        if (!task.dueDate) return;

        const dueDate = new Date(task.dueDate);
        const taskKey = `${task.id}-${task.dueDate}`;

        // Check for overdue tasks
        if (dueDate < now && !notifiedTasksRef.current.has(`overdue-${taskKey}`)) {
          notificationService.notifyTaskOverdue(task.title);
          notifiedTasksRef.current.add(`overdue-${taskKey}`);
        }
        
        // Check for tasks due within an hour
        else if (dueDate <= oneHourFromNow && dueDate > now && 
                 !notifiedTasksRef.current.has(`due-${taskKey}`)) {
          const minutesUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60));
          const timeText = minutesUntilDue <= 60 ? `in ${minutesUntilDue} minutes` : 'soon';
          
          notificationService.notifyTaskDue(task.title, timeText);
          notifiedTasksRef.current.add(`due-${taskKey}`);
        }
      });

      lastCheckRef.current = now;
    };

    // Initial check
    checkTasks();

    // Set up interval
    const interval = setInterval(checkTasks, options.checkInterval);

    return () => clearInterval(interval);
  }, [tasks, options.enabled, options.checkInterval]);

  // Function to manually request notification permission
  const requestPermission = async () => {
    return await notificationService.requestPermission();
  };

  // Function to send daily agenda notification
  const sendDailyAgenda = async () => {
    const todayTasks = tasks.filter(task => {
      if (task.status === 'completed' || task.status === 'cancelled') return false;
      if (!task.dueDate) return false;
      
      const today = new Date();
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === today.toDateString();
    });

    if (todayTasks.length > 0) {
      await notificationService.notifyDailyAgenda(todayTasks.length);
    }
  };

  // Function to celebrate task completion
  const celebrateCompletion = async (taskTitle: string) => {
    await notificationService.notifyTaskCompleted(taskTitle);
  };

  // Function to send smart suggestions
  const sendSuggestion = async (suggestion: string) => {
    await notificationService.notifySmartSuggestion(suggestion);
  };

  return {
    requestPermission,
    sendDailyAgenda,
    celebrateCompletion,
    sendSuggestion,
    isSupported: notificationService.isSupported,
    hasPermission: notificationService.hasPermission,
    permissionStatus: notificationService.permissionStatus,
  };
}

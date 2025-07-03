import React, { useState, useEffect } from 'react';
import { Play, Pause, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Task } from '../types';
import { formatDuration } from '../utils/timeUtils';

interface TaskTimerProps {
  task: Task;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (taskId: string) => void;
}

export function TaskTimer({ task, onStartTimer, onStopTimer }: TaskTimerProps) {
  const [currentSessionTime, setCurrentSessionTime] = useState(0);

  // Update current session time every minute when timer is active
  useEffect(() => {
    if (!task.isActiveTimer || !task.currentSessionStart) {
      setCurrentSessionTime(0);
      return;
    }

    const updateTime = () => {
      const now = new Date();
      const sessionTime = Math.floor(
        (now.getTime() - task.currentSessionStart!.getTime()) / (1000 * 60)
      );
      setCurrentSessionTime(sessionTime);
    };

    // Update immediately
    updateTime();

    // Update every minute
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [task.isActiveTimer, task.currentSessionStart]);

  const handleToggleTimer = () => {
    if (task.isActiveTimer) {
      onStopTimer(task.id);
    } else {
      onStartTimer(task.id);
    }
  };

  const totalDisplayTime = task.totalTimeSpent + currentSessionTime;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={task.isActiveTimer ? 'destructive' : 'outline'}
        size="sm"
        onClick={handleToggleTimer}
        className="flex items-center gap-1 h-8"
      >
        {task.isActiveTimer ? (
          <>
            <Pause className="h-3 w-3" />
            Stop
          </>
        ) : (
          <>
            <Play className="h-3 w-3" />
            Start
          </>
        )}
      </Button>

      {(totalDisplayTime > 0 || task.isActiveTimer) && (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-500" />
          <Badge variant="secondary" className="text-xs font-mono">
            {formatDuration(totalDisplayTime)}
          </Badge>
          {task.isActiveTimer && (
            <Badge
              variant="default"
              className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            >
              ACTIVE
            </Badge>
          )}
        </div>
      )}

      {task.timeEntries.length > 1 && (
        <Badge variant="outline" className="text-xs">
          {task.timeEntries.length} sessions
        </Badge>
      )}
    </div>
  );
}

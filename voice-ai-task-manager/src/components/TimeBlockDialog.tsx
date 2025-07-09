import React, { useState } from 'react';
import { Calendar, Clock, Plus, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Task } from '../types';

interface TimeBlockDialogProps {
  task: Task;
  onCreateCalendarBlock: (blockData: CalendarBlockData) => Promise<void>;
  conflicts?: any[];
  trigger?: React.ReactNode;
}

interface CalendarBlockData {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  taskId: string;
  location?: string;
  isTimeBlock: boolean;
}

export function TimeBlockDialog({ 
  task, 
  onCreateCalendarBlock, 
  conflicts = [],
  trigger 
}: TimeBlockDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(
    task.dueDate ? new Date(task.dueDate.getTime() - 2 * 60 * 60 * 1000) : new Date()
  );
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(task.estimatedMinutes ? Math.ceil(task.estimatedMinutes / 30) * 30 : 60);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState(`Time blocked for: ${task.title}`);
  const [isCreating, setIsCreating] = useState(false);

  const calculateEndTime = () => {
    const start = new Date(startDate);
    const [hours, minutes] = startTime.split(':').map(Number);
    start.setHours(hours, minutes, 0, 0);
    
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);
    
    return { start, end };
  };

  const { start: blockStart, end: blockEnd } = calculateEndTime();

  const formatDateTime = (date: Date) => {
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateBlock = async () => {
    setIsCreating(true);
    
    try {
      const blockData: CalendarBlockData = {
        title: `🎯 ${task.title}`,
        description: description,
        startTime: blockStart,
        endTime: blockEnd,
        taskId: task.id,
        location: location || undefined,
        isTimeBlock: true
      };

      await onCreateCalendarBlock(blockData);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create time block:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const durationOptions = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
    { value: 240, label: '4 hours' }
  ];

  const hasConflicts = conflicts.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            Block Time
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Block Calendar Time
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              {task.title}
            </h4>
            <div className="flex items-center gap-4 text-sm text-blue-700 dark:text-blue-300">
              <Badge variant={task.priority === 'high' ? 'destructive' : 'default'}>
                {task.priority}
              </Badge>
              {task.estimatedMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~{task.estimatedMinutes}min
                </span>
              )}
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="block-date">Date</Label>
            <Input
              id="block-date"
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={(e) => setStartDate(new Date(e.target.value))}
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time Block Preview */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Time Block Preview</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formatDateTime(blockStart)} → {formatDateTime(blockEnd)}
            </div>
          </div>

          {/* Conflict Warning */}
          {hasConflicts && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  Schedule Conflicts
                </span>
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                {conflicts.length} existing event{conflicts.length > 1 ? 's' : ''} overlap with this time slot
              </div>
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              placeholder="Office, Home, Conference Room A..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add notes about what you'll work on..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCreateBlock}
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? 'Creating...' : 'Block Time'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React from 'react';
import { Clock, TrendingUp, Users, Target } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Task, TaskEstimation } from '../types';
import { formatDuration } from '../utils/timeUtils';

interface TaskEstimateDisplayProps {
  task: Task;
  estimation?: TaskEstimation;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TaskEstimateDisplay({
  task,
  estimation,
  showDetails = false,
  size = 'md',
}: TaskEstimateDisplayProps) {
  const estimatedMinutes =
    estimation?.estimatedMinutes || task.estimatedMinutes || 0;
  const confidence = estimation?.confidence || 0.5;

  if (estimatedMinutes === 0) return null;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600 dark:text-green-400';
    if (conf >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.8) return 'High confidence';
    if (conf >= 0.6) return 'Medium confidence';
    return 'Low confidence';
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (!showDetails) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`flex items-center gap-1 ${sizeClasses[size]}`}
          >
            <Clock className="h-3 w-3" />
            {formatDuration(estimatedMinutes)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Estimated completion time</p>
            <p className={`text-sm ${getConfidenceColor(confidence)}`}>
              {getConfidenceText(confidence)} ({Math.round(confidence * 100)}%)
            </p>
            {estimation?.basedOnSimilar.length > 0 && (
              <p className="text-xs text-gray-500">
                Based on {estimation.basedOnSimilar.length} similar tasks
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="font-medium">
          Estimated Time: {formatDuration(estimatedMinutes)}
        </span>
        <Badge
          variant="outline"
          className={`text-xs ${getConfidenceColor(confidence)}`}
        >
          {Math.round(confidence * 100)}% confidence
        </Badge>
      </div>

      {estimation && (
        <div className="pl-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
          {estimation.basedOnSimilar.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>
                Based on {estimation.basedOnSimilar.length} similar tasks
              </span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            <span>Factors:</span>
            <div className="flex gap-1 ml-1">
              {estimation.factors.priority !== 1 && (
                <Badge variant="secondary" className="text-xs">
                  Priority: {Math.round(estimation.factors.priority * 100)}%
                </Badge>
              )}
              {estimation.factors.complexity !== 1 && (
                <Badge variant="secondary" className="text-xs">
                  Complexity: {Math.round(estimation.factors.complexity * 100)}%
                </Badge>
              )}
              {estimation.factors.projectFamiliarity !== 1 && (
                <Badge variant="secondary" className="text-xs">
                  Familiarity:{' '}
                  {Math.round(estimation.factors.projectFamiliarity * 100)}%
                </Badge>
              )}
            </div>
          </div>

          {task.actualMinutes && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>
                Actual: {formatDuration(task.actualMinutes)}
                {task.estimatedMinutes && (
                  <span
                    className={`ml-1 ${
                      task.actualMinutes <= task.estimatedMinutes
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    ({task.actualMinutes > task.estimatedMinutes ? '+' : ''}
                    {Math.round(
                      ((task.actualMinutes - task.estimatedMinutes) /
                        task.estimatedMinutes) *
                        100
                    )}
                    %)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

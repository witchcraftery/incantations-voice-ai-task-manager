import React from 'react';
import { BarChart3, Clock, Zap, TrendingUp, Target, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ProductivityPattern, EnergyWindow, Task } from '../types';
import { formatTimeOfDay, getHourRange } from '../utils/timeUtils';

interface ProductivityInsightsProps {
  patterns: ProductivityPattern[];
  energyWindows: EnergyWindow[];
  recommendations: { taskId: string; score: number; reasons: string[] }[];
  tasks: Task[];
}

export function ProductivityInsights({ 
  patterns, 
  energyWindows, 
  recommendations, 
  tasks 
}: ProductivityInsightsProps) {
  const highEnergyWindows = energyWindows.filter(w => w.energyLevel === 'high');
  const lowEnergyWindows = energyWindows.filter(w => w.energyLevel === 'low');

  const getBestProductivityHours = () => {
    return patterns
      .filter(p => p.taskCount > 0)
      .sort((a, b) => (b.completionRate * (1 / Math.max(b.avgCompletionTime, 1))) - 
                     (a.completionRate * (1 / Math.max(a.avgCompletionTime, 1))))
      .slice(0, 3);
  };

  const getWorstProductivityHours = () => {
    return patterns
      .filter(p => p.taskCount > 0)
      .sort((a, b) => (a.completionRate * (1 / Math.max(a.avgCompletionTime, 1))) - 
                     (b.completionRate * (1 / Math.max(b.avgCompletionTime, 1))))
      .slice(0, 3);
  };

  const topRecommendations = recommendations.slice(0, 5);
  const bestHours = getBestProductivityHours();
  const worstHours = getWorstProductivityHours();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold">Productivity Insights</h2>
      </div>

      <Tabs defaultValue="energy" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="energy">Energy Patterns</TabsTrigger>
          <TabsTrigger value="productivity">Productivity Hours</TabsTrigger>
          <TabsTrigger value="recommendations">Task Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="energy" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  High Energy Windows
                </CardTitle>
                <CardDescription>
                  Your most productive hours for tackling important tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {highEnergyWindows.length > 0 ? (
                  <div className="space-y-3">
                    {highEnergyWindows.map((window, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium">
                          {getHourRange(window.startHour, window.endHour)}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          {Math.round(window.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Complete more tasks to identify your high-energy periods
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Low Energy Windows
                </CardTitle>
                <CardDescription>
                  Better suited for simple, routine tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lowEnergyWindows.length > 0 ? (
                  <div className="space-y-3">
                    {lowEnergyWindows.map((window, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium">
                          {getHourRange(window.startHour, window.endHour)}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                        >
                          {Math.round(window.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No clear low-energy patterns detected yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Most Productive Hours
                </CardTitle>
                <CardDescription>
                  When you complete tasks fastest and most efficiently
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bestHours.length > 0 ? (
                  <div className="space-y-4">
                    {bestHours.map((pattern, index) => (
                      <div key={pattern.hourOfDay} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {formatTimeOfDay(pattern.hourOfDay)}
                          </span>
                          <Badge variant="outline">
                            {pattern.taskCount} tasks completed
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Completion Rate</span>
                            <span>{Math.round(pattern.completionRate * 100)}%</span>
                          </div>
                          <Progress value={pattern.completionRate * 100} className="h-2" />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Avg completion time: {Math.round(pattern.avgCompletionTime)}m
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Complete more tasks to see productivity patterns
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-red-600" />
                  Challenging Hours
                </CardTitle>
                <CardDescription>
                  Times when tasks take longer or completion rates are lower
                </CardDescription>
              </CardHeader>
              <CardContent>
                {worstHours.length > 0 ? (
                  <div className="space-y-4">
                    {worstHours.map((pattern, index) => (
                      <div key={pattern.hourOfDay} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {formatTimeOfDay(pattern.hourOfDay)}
                          </span>
                          <Badge variant="outline">
                            {pattern.taskCount} tasks
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Completion Rate</span>
                            <span>{Math.round(pattern.completionRate * 100)}%</span>
                          </div>
                          <Progress value={pattern.completionRate * 100} className="h-2" />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Avg completion time: {Math.round(pattern.avgCompletionTime)}m
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Not enough data for challenging hour analysis
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Smart Task Recommendations
              </CardTitle>
              <CardDescription>
                AI-recommended task order based on priority, deadlines, and your energy patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {topRecommendations.map((rec, index) => {
                    const task = tasks.find(t => t.id === rec.taskId);
                    if (!task) return null;

                    return (
                      <div key={rec.taskId} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              #{index + 1}
                            </Badge>
                            <span className="font-medium">{task.title}</span>
                          </div>
                          <Badge variant="outline">
                            Score: {rec.score}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {rec.reasons.map((reason, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                        {task.estimatedMinutes && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Estimated time: {Math.round(task.estimatedMinutes)}m
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No pending tasks to recommend
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
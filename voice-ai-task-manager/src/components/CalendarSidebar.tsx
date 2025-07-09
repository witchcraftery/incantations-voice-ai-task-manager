import React, { useState } from 'react';
import { Calendar, Clock, Users, AlertTriangle, Plus, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { CalendarEvent } from '../services/googleCalendarService';
import { Task } from '../types';
import { cn } from '../lib/utils';

interface CalendarSidebarProps {
  events: CalendarEvent[];
  todaysEvents: CalendarEvent[];
  isConnected: boolean;
  isLoading: boolean;
  error?: string;
  onConnect: () => Promise<boolean>;
  onRefresh: () => void;
  onCreateTaskFromEvent: (eventId: string, taskType: 'prep' | 'followup') => void;
  conflictingTasks?: Task[];
  className?: string;
}

export function CalendarSidebar({
  events,
  todaysEvents,
  isConnected,
  isLoading,
  error,
  onConnect,
  onRefresh,
  onCreateTaskFromEvent,
  conflictingTasks = [],
  className
}: CalendarSidebarProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week'>('today');

  const displayEvents = selectedTimeRange === 'today' ? todaysEvents : events;

  // Get upcoming events in next 2 hours
  const upcomingEvents = todaysEvents.filter(event => {
    const eventStart = new Date(event.start.dateTime || event.start.date || '');
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return eventStart > now && eventStart <= twoHoursFromNow;
  });

  const formatEventTime = (event: CalendarEvent) => {
    const start = new Date(event.start.dateTime || event.start.date || '');
    const end = new Date(event.end.dateTime || event.end.date || '');
    
    if (event.start.date) {
      // All-day event
      return 'All day';
    }
    
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getEventPriority = (event: CalendarEvent): 'low' | 'medium' | 'high' => {
    const attendeeCount = event.attendees?.length || 0;
    const summary = event.summary.toLowerCase();
    
    if (summary.includes('urgent') || summary.includes('critical') || attendeeCount > 5) {
      return 'high';
    }
    if (attendeeCount > 2 || summary.includes('important')) {
      return 'medium';
    }
    return 'low';
  };

  const isEventSoon = (event: CalendarEvent): boolean => {
    const eventStart = new Date(event.start.dateTime || event.start.date || '');
    const now = new Date();
    const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    return eventStart > now && eventStart <= thirtyMinFromNow;
  };

  const renderEventCard = (event: CalendarEvent) => {
    const priority = getEventPriority(event);
    const isSoon = isEventSoon(event);
    const hasAttendees = event.attendees && event.attendees.length > 0;

    return (
      <Card key={event.id} className={cn(
        "mb-2 transition-all hover:shadow-md",
        isSoon && "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
      )}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">{event.summary}</h4>
                <Badge 
                  variant={priority === 'high' ? 'destructive' : priority === 'medium' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {priority}
                </Badge>
                {isSoon && (
                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                    Soon
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                <span>{formatEventTime(event)}</span>
              </div>

              {hasAttendees && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Users className="h-3 w-3" />
                  <span>{event.attendees!.length} attendee{event.attendees!.length > 1 ? 's' : ''}</span>
                </div>
              )}

              {event.location && (
                <div className="text-xs text-muted-foreground mb-2 truncate">
                  📍 {event.location}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCreateTaskFromEvent(event.id, 'prep')}
              className="text-xs h-6 px-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Prep Task
            </Button>
            {hasAttendees && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCreateTaskFromEvent(event.id, 'followup')}
                className="text-xs h-6 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Follow-up
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Connect your Google Calendar to see events and automatically generate preparation tasks
            </p>
            <Button onClick={onConnect} size="sm" disabled={isLoading}>
              {isLoading ? 'Connecting...' : 'Connect Calendar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <ChevronRight className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 mt-2">
          <Button
            size="sm"
            variant={selectedTimeRange === 'today' ? 'default' : 'outline'}
            onClick={() => setSelectedTimeRange('today')}
            className="text-xs h-6 px-2"
          >
            Today ({todaysEvents.length})
          </Button>
          <Button
            size="sm"
            variant={selectedTimeRange === 'week' ? 'default' : 'outline'}
            onClick={() => setSelectedTimeRange('week')}
            className="text-xs h-6 px-2"
          >
            Week ({events.length})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Upcoming Events Alert */}
        {upcomingEvents.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Upcoming ({upcomingEvents.length})
              </span>
            </div>
            {upcomingEvents.slice(0, 2).map(event => (
              <div key={event.id} className="text-xs text-orange-700 dark:text-orange-300 mb-1">
                • {event.summary} in {Math.round((new Date(event.start.dateTime || event.start.date || '').getTime() - new Date().getTime()) / (1000 * 60))} min
              </div>
            ))}
          </div>
        )}

        {/* Conflict Warnings */}
        {conflictingTasks.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                Schedule Conflicts
              </span>
            </div>
            {conflictingTasks.slice(0, 2).map(task => (
              <div key={task.id} className="text-xs text-red-700 dark:text-red-300 mb-1">
                • {task.title} conflicts with calendar
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <div className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Events List */}
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-xs text-muted-foreground mt-2">Loading events...</p>
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No events {selectedTimeRange === 'today' ? 'today' : 'this week'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayEvents.slice(0, 10).map(renderEventCard)}
            
            {displayEvents.length > 10 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  View {displayEvents.length - 10} more events
                </Button>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Quick Stats */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>📅 {todaysEvents.length} events today</div>
          <div>📊 {events.length} events this week</div>
          {upcomingEvents.length > 0 && (
            <div className="text-orange-600">⏰ {upcomingEvents.length} starting soon</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
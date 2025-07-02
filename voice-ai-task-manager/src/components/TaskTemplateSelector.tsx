import React, { useState, useEffect } from 'react';
import { FileText, Plus, Clock, Tag, Flag, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TaskTemplate, Task } from '../types';
import { StorageService } from '../services/storageService';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskTemplateSelectorProps {
  onSelectTemplate: (template: TaskTemplate) => void;
  trigger?: React.ReactNode;
}

export function TaskTemplateSelector({ onSelectTemplate, trigger }: TaskTemplateSelectorProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const storageService = new StorageService();

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = () => {
    const loadedTemplates = storageService.loadTaskTemplates();
    setTemplates(loadedTemplates);
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectTemplate = (template: TaskTemplate) => {
    onSelectTemplate(template);
    setOpen(false);
    setSearchQuery('');
  };

  const createTaskFromTemplate = (template: TaskTemplate): Omit<Task, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      title: template.title,
      description: template.taskDescription,
      priority: template.priority,
      status: 'pending' as const,
      project: template.project,
      tags: [...template.tags],
      dueDate: undefined,
      timeEntries: [],
      totalTimeSpent: 0,
      isActiveTimer: false
    };
  };

  const getPriorityColor = (priority: TaskTemplate['priority']) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'medium': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'high': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Task Templates
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Templates Grid */}
          <ScrollArea className="h-96">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
              <AnimatePresence mode="popLayout">
                {filteredTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className="cursor-pointer transition-all duration-200 hover:shadow-md border-2 hover:border-blue-200 dark:hover:border-blue-800"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {template.name}
                            </CardTitle>
                            {template.description && (
                              <CardDescription className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {template.description}
                              </CardDescription>
                            )}
                          </div>
                          <Badge className={`ml-2 ${getPriorityColor(template.priority)}`}>
                            <Flag className="h-3 w-3 mr-1" />
                            {template.priority}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Template Title Preview */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Task Title:
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                              "{template.title}"
                            </p>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-4">
                              {template.estimatedDuration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {template.estimatedDuration}m
                                </div>
                              )}
                              {template.project && (
                                <div className="flex items-center gap-1">
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {template.project}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Tags */}
                          {template.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {template.tags.slice(0, 3).map((tag) => (
                                <Badge 
                                  key={tag} 
                                  variant="secondary" 
                                  className="text-xs px-2 py-0.5"
                                >
                                  <Tag className="h-2.5 w-2.5 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {template.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                  +{template.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No templates match your search.' : 'No templates available.'}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click a template to create a task from it
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Open template creation dialog
                console.log('Create new template');
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
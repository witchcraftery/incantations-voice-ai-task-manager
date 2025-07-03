import React, { useState, useEffect } from 'react';
import { Bookmark, Star, Tag, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { ConversationBookmark, Message } from '../types';

interface BookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    title: string,
    description: string,
    tags: string[],
    isStarred: boolean
  ) => void;
  bookmark?: ConversationBookmark | null;
  message?: Message | null;
  mode: 'create' | 'edit';
}

export function BookmarkDialog({
  isOpen,
  onClose,
  onSave,
  bookmark,
  message,
  mode,
}: BookmarkDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isStarred, setIsStarred] = useState(false);

  // Initialize form when bookmark changes
  useEffect(() => {
    if (mode === 'edit' && bookmark) {
      setTitle(bookmark.title);
      setDescription(bookmark.description || '');
      setTags(bookmark.tags);
      setIsStarred(bookmark.isStarred);
    } else if (mode === 'create') {
      // Auto-generate title from message if available
      if (message) {
        const autoTitle = generateTitleFromMessage(message);
        setTitle(autoTitle);
        const autoTags = extractTagsFromMessage(message);
        setTags(autoTags);
      } else {
        setTitle('');
        setTags([]);
      }
      setDescription('');
      setIsStarred(false);
    }
  }, [mode, bookmark, message]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setTags([]);
      setTagInput('');
      setIsStarred(false);
    }
  }, [isOpen]);

  const generateTitleFromMessage = (msg: Message): string => {
    const content = msg.content.trim();
    const maxLength = 50;

    // Remove common filler words
    const cleanContent = content
      .replace(
        /^(well|so|um|uh|okay|alright|now|let me|i think|i need to|i want to|can you|could you)\s+/i,
        ''
      )
      .replace(/\s+/g, ' ');

    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }

    // Try to find sentence break
    const sentences = cleanContent.split(/[.!?]+/);
    if (sentences[0] && sentences[0].length <= maxLength) {
      return sentences[0].trim();
    }

    // Truncate at word boundary
    const words = cleanContent.split(' ');
    let result = '';

    for (const word of words) {
      if ((result + ' ' + word).length > maxLength) {
        break;
      }
      result += (result ? ' ' : '') + word;
    }

    return result + (result.length < cleanContent.length ? '...' : '');
  };

  const extractTagsFromMessage = (msg: Message): string[] => {
    const content = msg.content.toLowerCase();
    const extractedTags: string[] = [];

    // Topic patterns
    const topicPatterns = {
      task: /\b(task|todo|need to|have to|remind|deadline)\b/,
      project: /\b(project|work on|working on|development)\b/,
      meeting: /\b(meeting|call|discuss|presentation)\b/,
      planning: /\b(plan|schedule|organize|strategy)\b/,
      idea: /\b(idea|thought|concept|brainstorm)\b/,
      question: /\b(question|ask|wonder|clarify)\b/,
      decision: /\b(decide|decision|choose|option)\b/,
      priority: /\b(urgent|important|priority|critical)\b/,
    };

    Object.entries(topicPatterns).forEach(([tag, pattern]) => {
      if (pattern.test(content)) {
        extractedTags.push(tag);
      }
    });

    // Extract hashtags
    const hashtags = content.match(/#(\w+)/g);
    if (hashtags) {
      extractedTags.push(...hashtags.map(tag => tag.slice(1)));
    }

    return [...new Set(extractedTags)];
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;

    onSave(title.trim(), description.trim(), tags, isStarred);
    onClose();
  };

  const isValid = title.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            {mode === 'create' ? 'Create Bookmark' : 'Edit Bookmark'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Title *
            </label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter bookmark title..."
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description to help you remember this moment..."
              rows={3}
              className="w-full resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Tags
            </label>

            {/* Tag input */}
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={
                  !tagInput.trim() ||
                  tags.includes(tagInput.trim().toLowerCase())
                }
              >
                Add
              </Button>
            </div>

            {/* Tag list */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Star toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star
                className={`h-4 w-4 ${isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Star this bookmark
              </span>
            </div>
            <Switch checked={isStarred} onCheckedChange={setIsStarred} />
          </div>

          {/* Message preview (for create mode) */}
          {mode === 'create' && message && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Bookmarking message:
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {message.content}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {message.timestamp.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="flex items-center gap-2"
          >
            <Bookmark className="h-4 w-4" />
            {mode === 'create' ? 'Create' : 'Save'} Bookmark
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

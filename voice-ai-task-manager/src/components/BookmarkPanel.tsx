import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Star,
  Search,
  Filter,
  MessageSquare,
  Clock,
  Tag,
  MoreHorizontal,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ConversationBookmark, Conversation } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface BookmarkPanelProps {
  bookmarks: ConversationBookmark[];
  conversations: Conversation[];
  onNavigateToBookmark: (bookmark: ConversationBookmark) => void;
  onEditBookmark: (bookmark: ConversationBookmark) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onToggleStar: (bookmarkId: string) => void;
  isVisible: boolean;
}

type FilterType = 'all' | 'starred' | 'recent' | 'conversation';
type SortType = 'created' | 'title' | 'conversation';

export function BookmarkPanel({
  bookmarks,
  conversations,
  onNavigateToBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onToggleStar,
  isVisible,
}: BookmarkPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('created');
  const [selectedConversationId, setSelectedConversationId] =
    useState<string>('all');

  // Filter and sort bookmarks
  const filteredAndSortedBookmarks = useMemo(() => {
    let filtered = bookmarks;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        bookmark =>
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.description?.toLowerCase().includes(query) ||
          bookmark.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'starred':
        filtered = filtered.filter(bookmark => bookmark.isStarred);
        break;
      case 'recent':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(bookmark => bookmark.createdAt >= weekAgo);
        break;
      case 'conversation':
        if (selectedConversationId !== 'all') {
          filtered = filtered.filter(
            bookmark => bookmark.conversationId === selectedConversationId
          );
        }
        break;
    }

    // Sort bookmarks
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'conversation':
          const convA =
            conversations.find(c => c.id === a.conversationId)?.title || '';
          const convB =
            conversations.find(c => c.id === b.conversationId)?.title || '';
          return convA.localeCompare(convB);
        case 'created':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return filtered;
  }, [
    bookmarks,
    searchQuery,
    filterType,
    sortType,
    selectedConversationId,
    conversations,
  ]);

  const getConversationTitle = (conversationId: string) => {
    return (
      conversations.find(c => c.id === conversationId)?.title ||
      'Unknown Conversation'
    );
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const stats = useMemo(() => {
    const total = bookmarks.length;
    const starred = bookmarks.filter(b => b.isStarred).length;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = bookmarks.filter(b => b.createdAt >= weekAgo).length;

    return { total, starred, recent };
  }, [bookmarks]);

  if (!isVisible) return null;

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Bookmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Bookmarks
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stats.total} total, {stats.starred} starred
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <Select
            value={filterType}
            onValueChange={value => setFilterType(value as FilterType)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({stats.total})</SelectItem>
              <SelectItem value="starred">Starred ({stats.starred})</SelectItem>
              <SelectItem value="recent">Recent ({stats.recent})</SelectItem>
              <SelectItem value="conversation">By Conversation</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortType}
            onValueChange={value => setSortType(value as SortType)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">By Date</SelectItem>
              <SelectItem value="title">By Title</SelectItem>
              <SelectItem value="conversation">By Conversation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conversation filter */}
        {filterType === 'conversation' && (
          <Select
            value={selectedConversationId}
            onValueChange={setSelectedConversationId}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conversations</SelectItem>
              {conversations.map(conversation => (
                <SelectItem key={conversation.id} value={conversation.id}>
                  {conversation.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Bookmark List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedBookmarks.map(bookmark => (
              <motion.div
                key={bookmark.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="cursor-pointer transition-all duration-200 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {bookmark.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <MessageSquare className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {getConversationTitle(bookmark.conversationId)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={e => {
                            e.stopPropagation();
                            onToggleStar(bookmark.id);
                          }}
                        >
                          <Star
                            className={`h-3 w-3 ${
                              bookmark.isStarred
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-400'
                            }`}
                          />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={e => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={e => {
                                e.stopPropagation();
                                onNavigateToBookmark(bookmark);
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Go to Message
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={e => {
                                e.stopPropagation();
                                onEditBookmark(bookmark);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={e => {
                                e.stopPropagation();
                                onDeleteBookmark(bookmark.id);
                              }}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  {(bookmark.description || bookmark.tags.length > 0) && (
                    <CardContent className="pt-0">
                      {bookmark.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                          {bookmark.description}
                        </p>
                      )}

                      {bookmark.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {bookmark.tags.slice(0, 3).map(tag => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs px-1 py-0"
                            >
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {bookmark.tags.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1 py-0"
                            >
                              +{bookmark.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(bookmark.createdAt)}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAndSortedBookmarks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Bookmark className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                No bookmarks found
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery || filterType !== 'all'
                  ? 'Try adjusting your filters to see more bookmarks.'
                  : 'Start by bookmarking important moments in your conversations.'}
              </p>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

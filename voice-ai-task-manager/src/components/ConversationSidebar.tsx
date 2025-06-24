import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Edit3, Search, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Conversation } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onUpdateTitle?: (conversationId: string, title: string) => void;
  getConversationSummary: (conversationId: string) => string;
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onUpdateTitle,
  getConversationSummary
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages.some(msg =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleStartEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editingTitle.trim() && onUpdateTitle) {
      onUpdateTitle(editingId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const groupConversationsByDate = (conversations: Conversation[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as Conversation[],
      yesterday: [] as Conversation[],
      thisWeek: [] as Conversation[],
      older: [] as Conversation[]
    };

    conversations.forEach(conv => {
      const convDate = new Date(conv.updatedAt.getFullYear(), conv.updatedAt.getMonth(), conv.updatedAt.getDate());
      
      if (convDate.getTime() === today.getTime()) {
        groups.today.push(conv);
      } else if (convDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(conv);
      } else if (convDate.getTime() > thisWeek.getTime()) {
        groups.thisWeek.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const conversationGroups = groupConversationsByDate(filteredConversations);

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
    const isActive = conversation.id === currentConversationId;
    const isEditing = editingId === conversation.id;
    const messageCount = conversation.messages.length;
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 ${
          isActive
            ? 'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800 border'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        onClick={() => !isEditing && onSelectConversation(conversation.id)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex gap-1">
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="h-7 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  className="h-7 px-2"
                >
                  ✓
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="h-7 px-2"
                >
                  ✕
                </Button>
              </div>
            ) : (
              <>
                <h3 className={`font-medium text-sm leading-tight mb-1 ${
                  isActive
                    ? 'text-blue-800 dark:text-blue-200'
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {conversation.title}
                </h3>
                
                <p className={`text-xs leading-relaxed mb-2 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {getConversationSummary(conversation.id)}
                </p>

                <div className={`flex items-center justify-between text-xs ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  <span>{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
                  <span>
                    {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
                  </span>
                </div>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
              {onUpdateTitle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(conversation);
                  }}
                  className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conversation.id);
                }}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const ConversationGroup = ({ title, conversations }: { title: string, conversations: Conversation[] }) => {
    if (conversations.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-3">
          {title}
        </h4>
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {conversations.map((conversation) => (
              <ConversationItem key={conversation.id} conversation={conversation} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 border-r bg-white dark:bg-gray-950 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Conversations
            </h2>
          </div>
          <Button
            onClick={onNewConversation}
            size="sm"
            className="gap-1 h-8"
          >
            <Plus className="h-3 w-3" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 p-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <Button onClick={onNewConversation} variant="outline" size="sm">
                Start your first conversation
              </Button>
            )}
          </div>
        ) : (
          <div>
            <ConversationGroup title="Today" conversations={conversationGroups.today} />
            <ConversationGroup title="Yesterday" conversations={conversationGroups.yesterday} />
            <ConversationGroup title="This Week" conversations={conversationGroups.thisWeek} />
            <ConversationGroup title="Older" conversations={conversationGroups.older} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

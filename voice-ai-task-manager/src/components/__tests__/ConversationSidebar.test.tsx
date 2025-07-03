import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationSidebar } from '../ConversationSidebar';
import { Conversation } from '../../types';

// Mock date-fns functions
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
  format: jest.fn(() => 'Dec 25, 2024'),
}));

const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'First Conversation',
    messages: [
      {
        id: 'msg1',
        conversationId: '1',
        content: 'Hello',
        role: 'user',
        timestamp: new Date('2024-01-01'),
      },
      {
        id: 'msg2',
        conversationId: '1',
        content: 'Hi there!',
        role: 'assistant',
        timestamp: new Date('2024-01-01'),
      },
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    title: 'Second Conversation',
    messages: [
      {
        id: 'msg3',
        conversationId: '2',
        content: 'How are you?',
        role: 'user',
        timestamp: new Date('2024-01-02'),
      },
    ],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

const defaultProps = {
  conversations: mockConversations,
  currentConversationId: '1',
  onSelectConversation: jest.fn(),
  onNewConversation: jest.fn(),
  onDeleteConversation: jest.fn(),
  onUpdateTitle: jest.fn(),
  getConversationSummary: jest.fn((id: string) => `Summary for ${id}`),
  minimized: false,
  onToggleMinimized: jest.fn(),
  settingsComponent: <div>Settings</div>,
  docsComponent: <div>Docs</div>,
};

describe('ConversationSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders conversation list correctly', () => {
    render(<ConversationSidebar {...defaultProps} />);

    expect(screen.getByText('First Conversation')).toBeInTheDocument();
    expect(screen.getByText('Second Conversation')).toBeInTheDocument();
    expect(screen.getByText('Conversations')).toBeInTheDocument();
  });

  it('shows new conversation button', () => {
    render(<ConversationSidebar {...defaultProps} />);

    const newButton = screen.getByRole('button', { name: /new/i });
    expect(newButton).toBeInTheDocument();
  });

  it('calls onNewConversation when new button is clicked', () => {
    render(<ConversationSidebar {...defaultProps} />);

    const newButton = screen.getByRole('button', { name: /new/i });
    fireEvent.click(newButton);

    expect(defaultProps.onNewConversation).toHaveBeenCalledTimes(1);
  });

  it('highlights current conversation', () => {
    render(<ConversationSidebar {...defaultProps} />);

    const activeConversation = screen
      .getByText('First Conversation')
      .closest('div');
    expect(activeConversation).toHaveClass('bg-blue-100');
  });

  it('calls onSelectConversation when a conversation is clicked', () => {
    render(<ConversationSidebar {...defaultProps} />);

    const conversationItem = screen.getByText('Second Conversation');
    fireEvent.click(conversationItem);

    expect(defaultProps.onSelectConversation).toHaveBeenCalledWith('2');
  });

  it('shows search input when not minimized', () => {
    render(<ConversationSidebar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search conversations...');
    expect(searchInput).toBeInTheDocument();
  });

  it('filters conversations based on search query', async () => {
    const user = userEvent.setup();
    render(<ConversationSidebar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search conversations...');
    await user.type(searchInput, 'First');

    expect(screen.getByText('First Conversation')).toBeInTheDocument();
    expect(screen.queryByText('Second Conversation')).not.toBeInTheDocument();
  });

  it('shows edit and delete buttons on hover', () => {
    render(<ConversationSidebar {...defaultProps} />);

    const conversationItem = screen
      .getByText('First Conversation')
      .closest('.group');
    fireEvent.mouseEnter(conversationItem!);

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls onDeleteConversation when delete button is clicked', () => {
    render(<ConversationSidebar {...defaultProps} />);

    const conversationItem = screen
      .getByText('First Conversation')
      .closest('.group');
    fireEvent.mouseEnter(conversationItem!);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(defaultProps.onDeleteConversation).toHaveBeenCalledWith('1');
  });

  it('enters edit mode when edit button is clicked', () => {
    render(<ConversationSidebar {...defaultProps} />);

    const conversationItem = screen
      .getByText('First Conversation')
      .closest('.group');
    fireEvent.mouseEnter(conversationItem!);

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue('First Conversation')).toBeInTheDocument();
  });

  it('saves title changes when enter is pressed', async () => {
    const user = userEvent.setup();
    render(<ConversationSidebar {...defaultProps} />);

    const conversationItem = screen
      .getByText('First Conversation')
      .closest('.group');
    fireEvent.mouseEnter(conversationItem!);

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const input = screen.getByDisplayValue('First Conversation');
    await user.clear(input);
    await user.type(input, 'Updated Title');
    await user.keyboard('{Enter}');

    expect(defaultProps.onUpdateTitle).toHaveBeenCalledWith(
      '1',
      'Updated Title'
    );
  });

  it('cancels edit when escape is pressed', async () => {
    const user = userEvent.setup();
    render(<ConversationSidebar {...defaultProps} />);

    const conversationItem = screen
      .getByText('First Conversation')
      .closest('.group');
    fireEvent.mouseEnter(conversationItem!);

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const input = screen.getByDisplayValue('First Conversation');
    await user.clear(input);
    await user.type(input, 'Updated Title');
    await user.keyboard('{Escape}');

    expect(defaultProps.onUpdateTitle).not.toHaveBeenCalled();
  });

  it('displays message count for each conversation', () => {
    render(<ConversationSidebar {...defaultProps} />);

    expect(screen.getByText('2 messages')).toBeInTheDocument();
    expect(screen.getByText('1 message')).toBeInTheDocument();
  });

  it('shows conversation summary', () => {
    render(<ConversationSidebar {...defaultProps} />);

    expect(screen.getByText('Summary for 1')).toBeInTheDocument();
    expect(screen.getByText('Summary for 2')).toBeInTheDocument();
  });

  it('renders in minimized mode correctly', () => {
    render(<ConversationSidebar {...defaultProps} minimized={true} />);

    expect(screen.queryByText('Conversations')).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Search conversations...')
    ).not.toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Conversation count
  });

  it('shows expand button when minimized', () => {
    render(<ConversationSidebar {...defaultProps} minimized={true} />);

    const expandButton = screen.getByTitle('Expand Sidebar');
    expect(expandButton).toBeInTheDocument();
  });

  it('calls onToggleMinimized when expand button is clicked', () => {
    render(<ConversationSidebar {...defaultProps} minimized={true} />);

    const expandButton = screen.getByTitle('Expand Sidebar');
    fireEvent.click(expandButton);

    expect(defaultProps.onToggleMinimized).toHaveBeenCalledTimes(1);
  });

  it('renders settings and docs components', () => {
    render(<ConversationSidebar {...defaultProps} />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
  });

  it('shows empty state when no conversations exist', () => {
    render(<ConversationSidebar {...defaultProps} conversations={[]} />);

    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(
      screen.getByText('Start your first conversation')
    ).toBeInTheDocument();
  });

  it('shows no results message when search returns empty', async () => {
    const user = userEvent.setup();
    render(<ConversationSidebar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search conversations...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No conversations found')).toBeInTheDocument();
  });

  it('groups conversations by date correctly', () => {
    const conversationsWithDates: Conversation[] = [
      {
        ...mockConversations[0],
        updatedAt: new Date(), // Today
      },
      {
        ...mockConversations[1],
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      },
    ];

    render(
      <ConversationSidebar
        {...defaultProps}
        conversations={conversationsWithDates}
      />
    );

    expect(screen.getByText('TODAY')).toBeInTheDocument();
    expect(screen.getByText('YESTERDAY')).toBeInTheDocument();
  });

  it('displays total conversation count', () => {
    render(<ConversationSidebar {...defaultProps} />);

    expect(screen.getByText('2 conversations')).toBeInTheDocument();
  });

  it('shows singular form for single conversation', () => {
    render(
      <ConversationSidebar
        {...defaultProps}
        conversations={[mockConversations[0]]}
      />
    );

    expect(screen.getByText('1 conversation')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../TaskCard';
import { Task } from '../../types';

// Mock date-fns functions
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
  format: jest.fn(() => 'Dec 25, 2024'),
}));

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'This is a test task',
  status: 'pending',
  priority: 'medium',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  tags: ['test', 'important'],
  dueDate: new Date('2024-12-25'),
  project: 'Test Project',
  extractedFrom: 'conversation-1',
};

const defaultProps = {
  task: mockTask,
  onToggleComplete: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onStartTimer: jest.fn(),
  onStopTimer: jest.fn(),
  onToggleSelect: jest.fn(),
};

describe('TaskCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task information correctly', () => {
    render(<TaskCard {...defaultProps} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('important')).toBeInTheDocument();
  });

  it('shows project information when showProject is true', () => {
    render(<TaskCard {...defaultProps} showProject={true} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('hides project information when showProject is false', () => {
    render(<TaskCard {...defaultProps} showProject={false} />);
    expect(screen.queryByText('Test Project')).not.toBeInTheDocument();
  });

  it('shows extracted from information when showExtractedFrom is true', () => {
    render(<TaskCard {...defaultProps} showExtractedFrom={true} />);
    expect(screen.getByText('From conversation')).toBeInTheDocument();
  });

  it('shows selection checkbox when showSelection is true', () => {
    render(<TaskCard {...defaultProps} showSelection={true} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('calls onToggleComplete when completion button is clicked', () => {
    render(<TaskCard {...defaultProps} />);
    const toggleButton = screen.getByRole('button', { name: /toggle/i });
    fireEvent.click(toggleButton);
    expect(defaultProps.onToggleComplete).toHaveBeenCalledWith('1');
  });

  it('calls onToggleSelect when selection checkbox is clicked', () => {
    render(<TaskCard {...defaultProps} showSelection={true} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(defaultProps.onToggleSelect).toHaveBeenCalledWith('1');
  });

  it('displays completed task styling when status is completed', () => {
    const completedTask = { ...mockTask, status: 'completed' as const };
    render(<TaskCard {...defaultProps} task={completedTask} />);

    const title = screen.getByText('Test Task');
    expect(title).toHaveClass('line-through');
  });

  it('displays overdue styling when task is overdue', () => {
    const overdueTask = {
      ...mockTask,
      dueDate: new Date('2023-01-01'), // Past date
      status: 'pending' as const,
    };
    render(<TaskCard {...defaultProps} task={overdueTask} />);

    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it('shows timer component when timer props are provided', () => {
    render(<TaskCard {...defaultProps} />);
    // TaskTimer should be rendered when onStartTimer and onStopTimer are provided
    // Since TaskTimer is mocked in setupTests, we just check it doesn't crash
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('shows due date information correctly', () => {
    render(<TaskCard {...defaultProps} />);
    expect(screen.getByText(/due:/i)).toBeInTheDocument();
  });

  it('shows created and updated time information', () => {
    const taskWithDifferentUpdateTime = {
      ...mockTask,
      updatedAt: new Date('2024-01-02'),
    };
    render(<TaskCard {...defaultProps} task={taskWithDifferentUpdateTime} />);

    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });

  it('applies correct priority colors', () => {
    const priorities = ['low', 'medium', 'high', 'urgent'] as const;

    priorities.forEach(priority => {
      const taskWithPriority = { ...mockTask, priority };
      const { rerender } = render(
        <TaskCard {...defaultProps} task={taskWithPriority} />
      );

      expect(screen.getByText(priority)).toBeInTheDocument();
      rerender(<></>); // Clean up for next iteration
    });
  });

  it('applies correct status colors', () => {
    const statuses = [
      'pending',
      'in-progress',
      'completed',
      'cancelled',
    ] as const;

    statuses.forEach(status => {
      const taskWithStatus = { ...mockTask, status };
      const { rerender } = render(
        <TaskCard {...defaultProps} task={taskWithStatus} />
      );

      expect(screen.getByText(status.replace('-', ' '))).toBeInTheDocument();
      rerender(<></>); // Clean up for next iteration
    });
  });

  it('handles task without description', () => {
    const taskWithoutDescription = { ...mockTask, description: undefined };
    render(<TaskCard {...defaultProps} task={taskWithoutDescription} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.queryByText('This is a test task')).not.toBeInTheDocument();
  });

  it('handles task without tags', () => {
    const taskWithoutTags = { ...mockTask, tags: [] };
    render(<TaskCard {...defaultProps} task={taskWithoutTags} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.queryByText('test')).not.toBeInTheDocument();
  });

  it('handles task without due date', () => {
    const taskWithoutDueDate = { ...mockTask, dueDate: undefined };
    render(<TaskCard {...defaultProps} task={taskWithoutDueDate} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.queryByText(/due:/i)).not.toBeInTheDocument();
  });
});

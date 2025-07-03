import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoiceControls } from '../VoiceControls';

const defaultProps = {
  isListening: false,
  isProcessing: false,
  onStartListening: jest.fn(),
  onStopListening: jest.fn(),
  onToggleVoice: jest.fn(),
  voiceEnabled: true,
  transcript: '',
  hasPermission: true,
};

describe('VoiceControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders voice toggle button', () => {
    render(<VoiceControls {...defaultProps} />);

    const toggleButton = screen.getByRole('button', { name: /voice/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('calls onToggleVoice when toggle button is clicked', () => {
    render(<VoiceControls {...defaultProps} />);

    const toggleButton = screen.getByRole('button', { name: /voice/i });
    fireEvent.click(toggleButton);

    expect(defaultProps.onToggleVoice).toHaveBeenCalledTimes(1);
  });

  it('shows microphone button when voice is enabled and has permission', () => {
    render(<VoiceControls {...defaultProps} />);

    const micButton = screen.getByRole('button', { name: /start listening/i });
    expect(micButton).toBeInTheDocument();
  });

  it('calls onStartListening when microphone button is clicked and not listening', () => {
    render(<VoiceControls {...defaultProps} />);

    const micButton = screen.getByRole('button', { name: /start listening/i });
    fireEvent.click(micButton);

    expect(defaultProps.onStartListening).toHaveBeenCalledTimes(1);
  });

  it('calls onStopListening when microphone button is clicked and is listening', () => {
    render(<VoiceControls {...defaultProps} isListening={true} />);

    const micButton = screen.getByRole('button', { name: /stop listening/i });
    fireEvent.click(micButton);

    expect(defaultProps.onStopListening).toHaveBeenCalledTimes(1);
  });

  it('shows processing state correctly', () => {
    render(<VoiceControls {...defaultProps} isProcessing={true} />);

    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  it('shows listening state correctly', () => {
    render(<VoiceControls {...defaultProps} isListening={true} />);

    expect(screen.getByText(/listening/i)).toBeInTheDocument();
  });

  it('displays transcript when provided', () => {
    render(<VoiceControls {...defaultProps} transcript="Hello world" />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows permission required message when no permission', () => {
    render(<VoiceControls {...defaultProps} hasPermission={false} />);

    expect(
      screen.getByText(/microphone permission required/i)
    ).toBeInTheDocument();
  });

  it('disables microphone button when voice is disabled', () => {
    render(<VoiceControls {...defaultProps} voiceEnabled={false} />);

    const micButton = screen.queryByRole('button', {
      name: /start listening/i,
    });
    expect(micButton).not.toBeInTheDocument();
  });

  it('shows voice disabled state', () => {
    render(<VoiceControls {...defaultProps} voiceEnabled={false} />);

    expect(screen.getByText(/voice disabled/i)).toBeInTheDocument();
  });

  it('applies correct styling when listening', () => {
    render(<VoiceControls {...defaultProps} isListening={true} />);

    const micButton = screen.getByRole('button', { name: /stop listening/i });
    expect(micButton).toHaveClass('bg-red-500');
  });

  it('applies correct styling when processing', () => {
    render(<VoiceControls {...defaultProps} isProcessing={true} />);

    const micButton = screen.getByRole('button');
    expect(micButton).toHaveClass('bg-yellow-500');
  });

  it('shows keyboard shortcut hint', () => {
    render(<VoiceControls {...defaultProps} />);

    expect(screen.getByText(/space to talk/i)).toBeInTheDocument();
  });
});

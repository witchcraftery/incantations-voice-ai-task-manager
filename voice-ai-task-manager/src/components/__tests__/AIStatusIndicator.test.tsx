import React from 'react';
import { render, screen } from '@testing-library/react';
import { AIStatusIndicator } from '../AIStatusIndicator';

describe('AIStatusIndicator', () => {
  it('renders online status correctly', () => {
    render(
      <AIStatusIndicator status="online" provider="OpenRouter" model="gpt-4" />
    );

    expect(screen.getByText('AI Online')).toBeInTheDocument();
    expect(screen.getByText('OpenRouter')).toBeInTheDocument();
    expect(screen.getByText('gpt-4')).toBeInTheDocument();
  });

  it('renders offline status correctly', () => {
    render(<AIStatusIndicator status="offline" provider="" model="" />);

    expect(screen.getByText('AI Offline')).toBeInTheDocument();
  });

  it('renders error status correctly', () => {
    render(
      <AIStatusIndicator status="error" provider="OpenRouter" model="gpt-4" />
    );

    expect(screen.getByText('AI Error')).toBeInTheDocument();
  });

  it('renders loading status correctly', () => {
    render(
      <AIStatusIndicator status="loading" provider="OpenRouter" model="gpt-4" />
    );

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('applies correct styling for online status', () => {
    render(
      <AIStatusIndicator status="online" provider="OpenRouter" model="gpt-4" />
    );

    const indicator = screen.getByText('AI Online').closest('div');
    expect(indicator).toHaveClass('text-green-600');
  });

  it('applies correct styling for offline status', () => {
    render(<AIStatusIndicator status="offline" provider="" model="" />);

    const indicator = screen.getByText('AI Offline').closest('div');
    expect(indicator).toHaveClass('text-gray-500');
  });

  it('applies correct styling for error status', () => {
    render(
      <AIStatusIndicator status="error" provider="OpenRouter" model="gpt-4" />
    );

    const indicator = screen.getByText('AI Error').closest('div');
    expect(indicator).toHaveClass('text-red-600');
  });

  it('applies custom className', () => {
    render(
      <AIStatusIndicator
        status="online"
        provider="OpenRouter"
        model="gpt-4"
        className="custom-class"
      />
    );

    const container = screen
      .getByText('AI Online')
      .closest('div')?.parentElement;
    expect(container).toHaveClass('custom-class');
  });
});

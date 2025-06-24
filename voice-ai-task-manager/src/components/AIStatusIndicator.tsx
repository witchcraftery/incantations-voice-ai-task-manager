import React from 'react';
import { Badge } from './ui/badge';
import { Brain, Zap, Wifi, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface AIStatusIndicatorProps {
  service: 'simulation' | 'openrouter';
  model: string;
  enhanced: boolean;
  connected: boolean;
  className?: string;
}

export function AIStatusIndicator({ 
  service, 
  model, 
  enhanced, 
  connected, 
  className = '' 
}: AIStatusIndicatorProps) {
  const getStatusColor = () => {
    if (!connected && service === 'openrouter') return 'destructive';
    if (enhanced) return 'default';
    return 'secondary';
  };

  const getStatusIcon = () => {
    if (!connected && service === 'openrouter') return <WifiOff className="h-3 w-3" />;
    if (enhanced) return <Zap className="h-3 w-3" />;
    return <Brain className="h-3 w-3" />;
  };

  const getDisplayModel = () => {
    if (model === 'local-simulation') return 'Simulation';
    if (model.includes('claude')) return 'Claude';
    if (model.includes('gpt')) return 'GPT';
    if (model.includes('llama')) return 'Llama';
    if (model.includes('gemini')) return 'Gemini';
    return model.split('/').pop() || model;
  };

  const getTooltipText = () => {
    if (!connected && service === 'openrouter') {
      return 'OpenRouter disconnected - using local simulation';
    }
    if (enhanced) {
      return `Enhanced AI: ${model} via OpenRouter`;
    }
    return 'Local simulation mode - free but limited task extraction';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant={getStatusColor()} 
          className={`flex items-center gap-1 text-xs ${className}`}
        >
          {getStatusIcon()}
          {getDisplayModel()}
          {enhanced && connected && <span className="text-green-400">⚡</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getTooltipText()}</p>
      </TooltipContent>
    </Tooltip>
  );
}

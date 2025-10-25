import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { config } from '@/config/environment';

interface StatusIndicatorProps {
  status: 'connecting' | 'connected' | 'error';
  onRefresh: () => void;
  totalIndexed: number;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  onRefresh,
  totalIndexed
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Connected',
          className: 'text-green-300 border-green-400/50 bg-green-500/10'
        };
      case 'connecting':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: 'Connecting...',
          className: 'text-yellow-300 border-yellow-400/50 bg-yellow-500/10'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Disconnected',
          className: 'text-red-300 border-red-400/50 bg-red-500/10'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="flex items-center space-x-2">
      <Badge variant="outline" className={statusConfig.className}>
        {statusConfig.icon}
        <span className="ml-1">{statusConfig.text}</span>
      </Badge>
      
      {status === 'connected' && (
        <Badge variant="outline" className="text-blue-300 border-blue-400/50 bg-blue-500/10">
          {totalIndexed} Documents
        </Badge>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={status === 'connecting'}
        className="text-blue-300 border-blue-400/50 hover:bg-blue-500/10"
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${status === 'connecting' ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
      
      {config.ENVIRONMENT === 'development' && (
        <Badge variant="outline" className="text-purple-300 border-purple-400/50 bg-purple-500/10">
          DEV
        </Badge>
      )}
    </div>
  );
};
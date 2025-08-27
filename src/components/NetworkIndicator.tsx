import useNetworkStatus from '@/hooks/useNetworkStatus';
import { Wifi, WifiOff, Signal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkIndicatorProps {
  className?: string;
  showText?: boolean;
}

export default function NetworkIndicator({ className, showText = false }: NetworkIndicatorProps) {
  const { online } = useNetworkStatus();
  const isOnline = online;
  const isSlowConnection = false; // Simplified for now
  const connectionType = 'unknown'; // Simplified for now

  const getIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    if (isSlowConnection) {
      return <Signal className="h-4 w-4" />;
    }
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }
    if (isSlowConnection) {
      return 'Conexão lenta';
    }
    return 'Online';
  };

  const getStatusColor = () => {
    if (!isOnline) {
      return 'text-red-500';
    }
    if (isSlowConnection) {
      return 'text-yellow-500';
    }
    return 'text-green-500';
  };

  const getTooltipText = () => {
    if (!isOnline) {
      return 'Sem conexão com a internet';
    }
    if (isSlowConnection) {
      return `Conexão lenta (${connectionType})`;
    }
    return `Conectado (${connectionType})`;
  };

  return (
    <div 
      className={cn(
        'flex items-center space-x-1 transition-colors duration-200',
        getStatusColor(),
        className
      )}
      title={getTooltipText()}
    >
      {getIcon()}
      {showText && (
        <span className="text-xs font-medium hidden sm:inline">
          {getStatusText()}
        </span>
      )}
    </div>
  );
}
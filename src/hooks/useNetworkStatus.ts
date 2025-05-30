import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  saveWhenOnline: boolean;
  lastOnlineAt?: Date;
  connectionType?: string;
  effectiveType?: string; // '2g', '3g', '4g', 'slow-2g'
  downlink?: number; // Megabits per second
  rtt?: number; // Round trip time in milliseconds
}

export interface NetworkStatusConfig {
  enableSlowConnectionDetection: boolean;
  slowConnectionThreshold: number; // RTT threshold in ms
  autoSaveOnReconnect: boolean;
  trackDetailedMetrics: boolean;
}

const DEFAULT_CONFIG: NetworkStatusConfig = {
  enableSlowConnectionDetection: true,
  slowConnectionThreshold: 2000, // 2 seconds RTT
  autoSaveOnReconnect: true,
  trackDetailedMetrics: true,
};

/**
 * Advanced network status hook for auto-save optimization
 */
export function useNetworkStatus(config: Partial<NetworkStatusConfig> = {}): NetworkStatus {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    saveWhenOnline: fullConfig.autoSaveOnReconnect,
  }));

  // Get network connection info if available
  const getConnectionInfo = useCallback(() => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (!connection || !fullConfig.trackDetailedMetrics) {
      return {};
    }

    return {
      connectionType: connection.type,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
    };
  }, [fullConfig.trackDetailedMetrics]);

  // Determine if connection is slow
  const isSlowConnection = useCallback((connectionInfo: any) => {
    if (!fullConfig.enableSlowConnectionDetection) return false;
    
    // Check RTT if available
    if (connectionInfo.rtt && connectionInfo.rtt > fullConfig.slowConnectionThreshold) {
      return true;
    }
    
    // Check effective type
    if (connectionInfo.effectiveType === 'slow-2g' || connectionInfo.effectiveType === '2g') {
      return true;
    }
    
    // Check downlink speed (< 0.5 Mbps considered slow)
    if (connectionInfo.downlink && connectionInfo.downlink < 0.5) {
      return true;
    }
    
    return false;
  }, [fullConfig.enableSlowConnectionDetection, fullConfig.slowConnectionThreshold]);

  // Update network status
  const updateNetworkStatus = useCallback(() => {
    const connectionInfo = getConnectionInfo();
    const slow = isSlowConnection(connectionInfo);
    
    setStatus(prevStatus => ({
      ...prevStatus,
      isOnline: navigator.onLine,
      isSlowConnection: slow,
      lastOnlineAt: navigator.onLine ? new Date() : prevStatus.lastOnlineAt,
      ...connectionInfo,
    }));
  }, [getConnectionInfo, isSlowConnection]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      updateNetworkStatus();
    };

    const handleOffline = () => {
      setStatus(prevStatus => ({
        ...prevStatus,
        isOnline: false,
      }));
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection changes if available
    const connection = (navigator as any).connection;
    if (connection && fullConfig.trackDetailedMetrics) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Initial status check
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection && fullConfig.trackDetailedMetrics) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [updateNetworkStatus, fullConfig.trackDetailedMetrics]);

  return status;
}

/**
 * Simple hook for basic online/offline detection
 */
export function useOnlineStatus(): boolean {
  const { isOnline } = useNetworkStatus({ 
    enableSlowConnectionDetection: false,
    trackDetailedMetrics: false 
  });
  return isOnline;
}

/**
 * Hook to get network quality information
 */
export function useNetworkQuality(): {
  isOnline: boolean;
  isSlowConnection: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
} {
  const { isOnline, isSlowConnection, effectiveType, rtt } = useNetworkStatus();
  
  const quality = (() => {
    if (!isOnline) return 'offline';
    if (isSlowConnection) return 'poor';
    if (effectiveType === '4g' && rtt && rtt < 300) return 'excellent';
    if (effectiveType === '4g' || effectiveType === '3g') return 'good';
    return 'fair';
  })();

  return { isOnline, isSlowConnection, quality };
} 
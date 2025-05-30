import React, { useState, useCallback } from 'react';

export interface ErrorRecoveryPanelProps {
  errors: {
    moduleId: string;
    error: string;
    timestamp: Date;
    retryCount: number;
    maxRetries: number;
    canRetry: boolean;
    errorType: 'network' | 'validation' | 'server' | 'conflict' | 'permission';
  }[];
  onRetry: (moduleId: string) => Promise<void>;
  onRetryAll: () => Promise<void>;
  onClearErrors: () => void;
  onViewDetails: (moduleId: string) => void;
  isRetrying?: boolean;
  className?: string;
}

export function ErrorRecoveryPanel({
  errors,
  onRetry,
  onRetryAll,
  onClearErrors,
  onViewDetails,
  isRetrying = false,
  className = '',
}: ErrorRecoveryPanelProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [retryingModules, setRetryingModules] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((moduleId: string) => {
    setExpandedErrors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  }, []);

  const handleRetry = useCallback(async (moduleId: string) => {
    setRetryingModules(prev => new Set([...prev, moduleId]));
    try {
      await onRetry(moduleId);
    } finally {
      setRetryingModules(prev => {
        const newSet = new Set(prev);
        newSet.delete(moduleId);
        return newSet;
      });
    }
  }, [onRetry]);

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'network': return '🌐';
      case 'validation': return '⚠️';
      case 'server': return '🔧';
      case 'conflict': return '🔄';
      case 'permission': return '🔒';
      default: return '❌';
    }
  };

  const getErrorColor = (errorType: string) => {
    switch (errorType) {
      case 'network': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'validation': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'server': return 'text-red-600 bg-red-50 border-red-200';
      case 'conflict': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'permission': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRetryStrategy = (error: ErrorRecoveryPanelProps['errors'][0]) => {
    if (!error.canRetry) return 'Cannot retry';
    if (error.retryCount >= error.maxRetries) return 'Max retries reached';
    if (error.errorType === 'network') return 'Will retry when online';
    if (error.errorType === 'conflict') return 'Requires manual resolution';
    return `${error.maxRetries - error.retryCount} retries remaining`;
  };

  if (errors.length === 0) return null;

  return (
    <div className={`error-recovery-panel border rounded-lg ${className}`}>
      {/* Header */}
      <div className="bg-red-50 border-b border-red-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚨</span>
            <h3 className="text-lg font-semibold text-red-800">
              Save Errors ({errors.length})
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onRetryAll}
              disabled={isRetrying || !errors.some(e => e.canRetry)}
              className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? 'Retrying...' : 'Retry All'}
            </button>
            <button
              onClick={onClearErrors}
              disabled={isRetrying}
              className="px-3 py-1 text-sm font-medium text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Error List */}
      <div className="max-h-96 overflow-y-auto">
        {errors.map((error) => {
          const isExpanded = expandedErrors.has(error.moduleId);
          const isRetryingThis = retryingModules.has(error.moduleId);
          
          return (
            <div 
              key={error.moduleId}
              className="border-b border-gray-200 last:border-b-0"
            >
              {/* Error Summary */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-lg mt-1">
                      {getErrorIcon(error.errorType)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          Module: {error.moduleId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getErrorColor(error.errorType)}`}>
                          {error.errorType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {error.error}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {error.timestamp.toLocaleTimeString()}
                        </span>
                        <span>
                          {getRetryStrategy(error)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleExpanded(error.moduleId)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                    >
                      <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    
                    {error.canRetry && error.retryCount < error.maxRetries && (
                      <button
                        onClick={() => handleRetry(error.moduleId)}
                        disabled={isRetryingThis || isRetrying}
                        className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRetryingThis ? (
                          <div className="flex items-center gap-1">
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            <span>Retrying</span>
                          </div>
                        ) : (
                          'Retry'
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => onViewDetails(error.moduleId)}
                      className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 bg-gray-50">
                  <div className="text-sm space-y-2">
                    <div>
                      <strong>Error Type:</strong> {error.errorType}
                    </div>
                    <div>
                      <strong>Module ID:</strong> <code className="bg-white px-1 py-0.5 rounded text-xs">{error.moduleId}</code>
                    </div>
                    <div>
                      <strong>Retry Count:</strong> {error.retryCount} / {error.maxRetries}
                    </div>
                    <div>
                      <strong>Timestamp:</strong> {error.timestamp.toLocaleString()}
                    </div>
                    <div>
                      <strong>Full Error:</strong>
                      <pre className="bg-white p-2 rounded text-xs overflow-x-auto mt-1 border">
                        {error.error}
                      </pre>
                    </div>
                    
                    {/* Recovery Suggestions */}
                    <div>
                      <strong>Recovery Suggestions:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                        {error.errorType === 'network' && (
                          <>
                            <li>Check your internet connection</li>
                            <li>Try refreshing the page</li>
                            <li>Changes will be saved automatically when connection is restored</li>
                          </>
                        )}
                        {error.errorType === 'validation' && (
                          <>
                            <li>Check that all required fields are filled</li>
                            <li>Verify field formats (dates, numbers, etc.)</li>
                            <li>Look for validation error messages in the form</li>
                          </>
                        )}
                        {error.errorType === 'server' && (
                          <>
                            <li>Wait a moment and try again</li>
                            <li>Contact support if the problem persists</li>
                            <li>Your data is preserved locally</li>
                          </>
                        )}
                        {error.errorType === 'conflict' && (
                          <>
                            <li>Another user has modified this form</li>
                            <li>Review the conflicting changes</li>
                            <li>Choose to keep your changes or accept the server version</li>
                          </>
                        )}
                        {error.errorType === 'permission' && (
                          <>
                            <li>You may not have permission to modify this form</li>
                            <li>Contact your administrator</li>
                            <li>Try refreshing your session</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Hook to manage error recovery
export function useErrorRecovery() {
  const [errors, setErrors] = useState<ErrorRecoveryPanelProps['errors']>([]);

  const addError = useCallback((error: Omit<ErrorRecoveryPanelProps['errors'][0], 'timestamp'>) => {
    setErrors(prev => [
      ...prev.filter(e => e.moduleId !== error.moduleId), // Remove existing error for this module
      { ...error, timestamp: new Date() }
    ]);
  }, []);

  const removeError = useCallback((moduleId: string) => {
    setErrors(prev => prev.filter(e => e.moduleId !== moduleId));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const incrementRetryCount = useCallback((moduleId: string) => {
    setErrors(prev => prev.map(error => 
      error.moduleId === moduleId 
        ? { ...error, retryCount: error.retryCount + 1 }
        : error
    ));
  }, []);

  return {
    errors,
    addError,
    removeError,
    clearAllErrors,
    incrementRetryCount,
  };
}

export default ErrorRecoveryPanel; 
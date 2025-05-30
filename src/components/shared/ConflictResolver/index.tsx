import React, { useState, useMemo } from 'react';
import { ConflictInfo } from '../../../types/formStateTypes';

export interface ConflictResolverProps {
  conflict: ConflictInfo;
  onResolve: (resolution: ConflictInfo['resolution'], mergedData?: Record<string, unknown>) => void;
  onCancel?: () => void;
  className?: string;
}

export function ConflictResolver({
  conflict,
  onResolve,
  onCancel,
  className = '',
}: ConflictResolverProps) {
  const [selectedResolution, setSelectedResolution] = useState<ConflictInfo['resolution']>('merge_manual');
  const [mergedData, setMergedData] = useState<Record<string, unknown>>(conflict.clientData);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'merge'>('overview');

  // Compare client and server data to find differences
  const differences = useMemo(() => {
    const diffs: Array<{
      field: string;
      clientValue: unknown;
      serverValue: unknown;
      hasConflict: boolean;
    }> = [];

    const allFields = new Set([
      ...Object.keys(conflict.clientData),
      ...Object.keys(conflict.serverData),
    ]);

    allFields.forEach(field => {
      const clientValue = conflict.clientData[field];
      const serverValue = conflict.serverData[field];
      const hasConflict = conflict.conflictedFields.includes(field);

      diffs.push({
        field,
        clientValue,
        serverValue,
        hasConflict,
      });
    });

    return diffs.sort((a, b) => {
      // Sort conflicted fields first
      if (a.hasConflict && !b.hasConflict) return -1;
      if (!a.hasConflict && b.hasConflict) return 1;
      return a.field.localeCompare(b.field);
    });
  }, [conflict.clientData, conflict.serverData, conflict.conflictedFields]);

  const formatValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const handleFieldChange = (field: string, value: unknown) => {
    setMergedData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuickResolve = (resolution: 'accept_server' | 'accept_client') => {
    setSelectedResolution(resolution);
    onResolve(resolution);
  };

  const handleManualResolve = () => {
    onResolve('merge_manual', mergedData);
  };

  const getConflictTypeDescription = () => {
    switch (conflict.conflictType) {
      case 'version_mismatch':
        return 'The data was modified by another user or session. Server version is newer.';
      case 'concurrent_edit':
        return 'This module was being edited simultaneously by multiple users.';
      case 'data_changed':
        return 'The server data has changed since you last loaded this module.';
      default:
        return 'A data conflict has been detected.';
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-orange-50 border-b border-orange-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h2 className="text-lg font-semibold text-orange-800">
              Data Conflict Detected
            </h2>
            <p className="text-sm text-orange-600 mt-1">
              {getConflictTypeDescription()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Conflict resolution tabs">
          {[
            { id: 'overview', label: 'Overview', count: conflict.conflictedFields.length },
            { id: 'details', label: 'Field Details', count: differences.length },
            { id: 'merge', label: 'Manual Merge', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Conflict Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Conflict Summary</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Module:</strong> {conflict.moduleId}</p>
                <p><strong>Detected:</strong> {conflict.detectedAt.toLocaleString()}</p>
                <p><strong>Conflicted Fields:</strong> {conflict.conflictedFields.join(', ')}</p>
                <p><strong>Server Version:</strong> {conflict.serverVersion}</p>
                <p><strong>Your Version:</strong> {conflict.clientVersion}</p>
              </div>
            </div>

            {/* Quick Resolution Options */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Quick Resolution</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleQuickResolve('accept_server')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📥</span>
                    <div>
                      <div className="font-medium text-gray-900">Accept Server Version</div>
                      <div className="text-sm text-gray-600">
                        Discard your changes and use the server data
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickResolve('accept_client')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📤</span>
                    <div>
                      <div className="font-medium text-gray-900">Keep Your Version</div>
                      <div className="text-sm text-gray-600">
                        Override server data with your changes
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setActiveTab('merge')}
                className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔀</span>
                  <div>
                    <div className="font-medium text-gray-900">Manual Merge</div>
                    <div className="text-sm text-gray-600">
                      Review and merge changes field by field
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Field Comparison</h3>
            
            <div className="space-y-3">
              {differences.map(({ field, clientValue, serverValue, hasConflict }) => (
                <div
                  key={field}
                  className={`
                    border rounded-lg p-4
                    ${hasConflict 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-gray-200 bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">{field}</span>
                    {hasConflict && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        CONFLICT
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Your Value</div>
                      <pre className="text-xs bg-white border border-gray-200 rounded p-2 overflow-auto max-h-20">
                        {formatValue(clientValue)}
                      </pre>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Server Value</div>
                      <pre className="text-xs bg-white border border-gray-200 rounded p-2 overflow-auto max-h-20">
                        {formatValue(serverValue)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'merge' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Manual Merge</h3>
            <p className="text-sm text-gray-600">
              Choose the value you want to keep for each field. Conflicted fields are highlighted.
            </p>
            
            <div className="space-y-3">
              {differences.map(({ field, clientValue, serverValue, hasConflict }) => (
                <div
                  key={field}
                  className={`
                    border rounded-lg p-4
                    ${hasConflict 
                      ? 'border-orange-200 bg-orange-50' 
                      : 'border-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-medium text-gray-900">{field}</span>
                    {hasConflict && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        CONFLICT
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-start gap-3">
                      <input
                        type="radio"
                        name={`merge-${field}`}
                        checked={mergedData[field] === clientValue}
                        onChange={() => handleFieldChange(field, clientValue)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">Your Value</div>
                        <pre className="text-xs bg-white border border-gray-200 rounded p-2 mt-1 overflow-auto max-h-16">
                          {formatValue(clientValue)}
                        </pre>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3">
                      <input
                        type="radio"
                        name={`merge-${field}`}
                        checked={mergedData[field] === serverValue}
                        onChange={() => handleFieldChange(field, serverValue)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">Server Value</div>
                        <pre className="text-xs bg-white border border-gray-200 rounded p-2 mt-1 overflow-auto max-h-16">
                          {formatValue(serverValue)}
                        </pre>
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        
        <div className="flex gap-2">
          {activeTab === 'merge' && (
            <button
              onClick={handleManualResolve}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700"
            >
              Apply Merge
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConflictResolver; 
import React from 'react';
import { ConflictInfo } from '../../../types/formStateTypes';

export interface FormStateIndicatorProps {
  moduleId: string;
  isDirty?: boolean;
  isSaving?: boolean;
  hasErrors?: boolean;
  lastSaved?: Date;
  hasConflict?: boolean;
  conflict?: ConflictInfo | null;
  className?: string;
  isAutoSaving?: boolean;
  autoSaveEnabled?: boolean;
  autoSavePaused?: boolean;
  pauseReason?: 'conflict' | 'offline' | 'manual' | 'error';
  nextSaveIn?: number;
  queuedSaves?: number;
  showAutoSaveStatus?: boolean;
}

export function FormStateIndicator({
  moduleId,
  isDirty = false,
  isSaving = false,
  hasErrors = false,
  lastSaved,
  hasConflict = false,
  conflict,
  className = '',
  isAutoSaving = false,
  autoSaveEnabled = false,
  autoSavePaused = false,
  pauseReason,
  nextSaveIn,
  queuedSaves = 0,
  showAutoSaveStatus = true,
}: FormStateIndicatorProps) {
  
  // Determine the primary state to display
  const getStateInfo = () => {
    if (hasConflict && conflict) {
      return {
        status: 'conflict' as const,
        label: 'Conflict Detected',
        description: `Data conflict with server. ${conflict.conflictedFields.length} field(s) affected.`,
        icon: '⚠️',
        className: 'text-orange-600 bg-orange-50 border-orange-200',
      };
    }
    
    if (hasErrors) {
      return {
        status: 'error' as const,
        label: 'Has Errors',
        description: 'Please fix validation errors before saving',
        icon: '❌',
        className: 'text-red-600 bg-red-50 border-red-200',
      };
    }
    
    // 🔄 NEW: Auto-save specific states
    if (isAutoSaving) {
      return {
        status: 'auto-saving' as const,
        label: 'Auto-saving...',
        description: 'Changes are being automatically saved',
        icon: '🔄',
        className: 'text-blue-600 bg-blue-50 border-blue-200 animate-spin',
      };
    }

    if (isSaving) {
      return {
        status: 'saving' as const,
        label: 'Saving...',
        description: 'Changes are being saved to server',
        icon: '💾',
        className: 'text-blue-600 bg-blue-50 border-blue-200 animate-pulse',
      };
    }

    // 🔄 NEW: Auto-save paused states
    if (autoSavePaused && showAutoSaveStatus) {
      const pauseMessages = {
        conflict: 'Auto-save paused due to conflict',
        offline: 'Auto-save paused - offline',
        manual: 'Auto-save manually paused',
        error: 'Auto-save paused due to error',
      };
      
      return {
        status: 'paused' as const,
        label: 'Auto-save Paused',
        description: pauseMessages[pauseReason || 'manual'],
        icon: '⏸️',
        className: 'text-gray-600 bg-gray-50 border-gray-200',
      };
    }
    
    if (isDirty) {
      return {
        status: 'dirty' as const,
        label: 'Unsaved Changes',
        description: 'You have unsaved changes in this module',
        icon: '✏️',
        className: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      };
    }
    
    if (lastSaved) {
      const timeSince = Date.now() - lastSaved.getTime();
      const minutesAgo = Math.floor(timeSince / (1000 * 60));
      const timeText = minutesAgo < 1 ? 'just now' : 
                     minutesAgo === 1 ? '1 minute ago' : 
                     minutesAgo < 60 ? `${minutesAgo} minutes ago` : 
                     lastSaved.toLocaleTimeString();
      
      return {
        status: 'saved' as const,
        label: 'Saved',
        description: `Last saved ${timeText}`,
        icon: '✅',
        className: 'text-green-600 bg-green-50 border-green-200',
      };
    }
    
    return {
      status: 'unknown' as const,
      label: 'Ready',
      description: 'Module is ready for editing',
      icon: '📝',
      className: 'text-gray-600 bg-gray-50 border-gray-200',
    };
  };

  const stateInfo = getStateInfo();

  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-3 py-1 rounded-md border text-sm font-medium
        ${stateInfo.className} ${className}
      `}
      title={stateInfo.description}
      role="status"
      aria-label={`Module ${moduleId} state: ${stateInfo.label}`}
    >
      <span 
        className="text-xs" 
        role="img" 
        aria-label={stateInfo.status}
      >
        {stateInfo.icon}
      </span>
      <span>{stateInfo.label}</span>
    </div>
  );
}

// Compact version for smaller spaces
export interface CompactFormStateIndicatorProps extends Omit<FormStateIndicatorProps, 'className'> {
  size?: 'sm' | 'xs';
  showLabel?: boolean;
}

export function CompactFormStateIndicator({
  size = 'sm',
  showLabel = false,
  ...props
}: CompactFormStateIndicatorProps) {
  const sizeClasses = {
    xs: 'w-3 h-3 text-xs',
    sm: 'w-4 h-4 text-sm',
  };

  const stateInfo = React.useMemo(() => {
    if (props.hasConflict) return { icon: '⚠️', color: 'text-orange-500' };
    if (props.hasErrors) return { icon: '❌', color: 'text-red-500' };
    if (props.isSaving) return { icon: '💾', color: 'text-blue-500 animate-pulse' };
    if (props.isDirty) return { icon: '✏️', color: 'text-yellow-500' };
    if (props.lastSaved) return { icon: '✅', color: 'text-green-500' };
    return { icon: '📝', color: 'text-gray-400' };
  }, [props.hasConflict, props.hasErrors, props.isSaving, props.isDirty, props.lastSaved]);

  if (showLabel) {
    return <FormStateIndicator {...props} className="text-xs px-2 py-0.5" />;
  }

  return (
    <span 
      className={`inline-block ${sizeClasses[size]} ${stateInfo.color}`}
      title={`Module ${props.moduleId} state`}
      role="img"
      aria-label={`Module state indicator`}
    >
      {stateInfo.icon}
    </span>
  );
}

// Hook to connect with form state
export function useFormStateIndicator(moduleId: string, formState: any) {
  return React.useMemo(() => ({
    moduleId,
    isDirty: formState?.selectors?.isModuleDirty?.(moduleId) || false,
    isSaving: formState?.selectors?.isModuleSaving?.(moduleId) || false,
    hasErrors: formState?.selectors?.getModuleErrors?.(moduleId)?.length > 0 || false,
    lastSaved: formState?.formData?.lastSaved?.[moduleId],
    hasConflict: formState?.selectors?.hasModuleConflict?.(moduleId) || false,
    conflict: formState?.selectors?.getModuleConflict?.(moduleId),
  }), [moduleId, formState]);
}

export default FormStateIndicator; 
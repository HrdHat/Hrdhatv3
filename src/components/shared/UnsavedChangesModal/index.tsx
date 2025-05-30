import React, { useEffect } from 'react';

export interface UnsavedChangesModalProps {
  isOpen: boolean;
  hasUnsavedChanges: boolean;
  dirtyModules?: string[];
  onSave: () => Promise<void> | void;
  onDiscard: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  className?: string;
}

export function UnsavedChangesModal({
  isOpen,
  hasUnsavedChanges,
  dirtyModules = [],
  onSave,
  onDiscard,
  onCancel,
  isSaving = false,
  className = '',
}: UnsavedChangesModalProps) {
  
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onSave]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onCancel}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={`
            bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto
            ${className}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-changes-title"
          aria-describedby="unsaved-changes-description"
        >
          {/* Header */}
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h2 
                  id="unsaved-changes-title"
                  className="text-lg font-semibold text-yellow-800"
                >
                  Unsaved Changes
                </h2>
                <p 
                  id="unsaved-changes-description"
                  className="text-sm text-yellow-600 mt-1"
                >
                  You have unsaved changes that will be lost if you continue.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {hasUnsavedChanges && dirtyModules.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Modules with unsaved changes:
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {dirtyModules.map((moduleId, index) => (
                    <li key={moduleId} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />
                      <span className="truncate">
                        {/* Format module ID for display - could be enhanced with module names */}
                        {moduleId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">What would you like to do?</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">💾</span>
                  <div>
                    <strong>Save:</strong> Save your changes before continuing
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">🗑️</span>
                  <div>
                    <strong>Discard:</strong> Lose your changes and continue
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-600 mt-0.5">↩️</span>
                  <div>
                    <strong>Cancel:</strong> Stay on this page to keep editing
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={onDiscard}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Discard Changes
              </button>
              
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && (
                  <svg 
                    className="animate-spin h-4 w-4" 
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {isSaving ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook to manage unsaved changes warning
export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  onSave?: () => Promise<void> | void
) {
  const [showModal, setShowModal] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<(() => void) | null>(null);

  // Browser navigation warning
  React.useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ''; // Chrome requires this
      return ''; // Some browsers require a return value
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const warnBeforeNavigation = React.useCallback((navigationFn: () => void) => {
    if (!hasUnsavedChanges) {
      navigationFn();
      return;
    }

    setPendingNavigation(() => navigationFn);
    setShowModal(true);
  }, [hasUnsavedChanges]);

  const handleSave = React.useCallback(async () => {
    if (onSave) {
      await onSave();
    }
    setShowModal(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [onSave, pendingNavigation]);

  const handleDiscard = React.useCallback(() => {
    setShowModal(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  const handleCancel = React.useCallback(() => {
    setShowModal(false);
    setPendingNavigation(null);
  }, []);

  return {
    showModal,
    warnBeforeNavigation,
    handleSave,
    handleDiscard,
    handleCancel,
  };
}

export default UnsavedChangesModal; 
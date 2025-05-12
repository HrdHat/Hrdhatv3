import React, { useState, useCallback, useEffect, useMemo } from "react";
import { ModuleWithRenderer } from "./rendererRegistry";
import { FileStorageService, UploadResult } from "../services/fileStorage";
import type {
  TaskHazardData,
  HazardState,
  ValidationState,
  ValidationResult,
  ModuleField,
} from "../types/formModules";

interface TaskHazardModuleProps {
  module: ModuleWithRenderer;
  className?: string;
  onDataChange?: (data: TaskHazardData) => void | Promise<string>;
  onValidationChange?: (result: ValidationResult) => void;
  userId?: string;
  formId?: string;
  moduleId?: string;
}

const INITIAL_RISK_LEVEL = 10;

export const TaskHazardModule: React.FC<TaskHazardModuleProps> = ({
  module,
  className = "",
  onDataChange,
  onValidationChange,
  userId,
  formId,
  moduleId,
}) => {
  // Initialize state with all fields
  const [task, setTask] = useState("");
  const [hazards, setHazards] = useState<HazardState[]>(() =>
    initializeHazards(module.fields)
  );
  const [validation, setValidation] = useState<ValidationState>(() =>
    initializeValidation(module.fields)
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parentError, setParentError] = useState<string | null>(null);

  // Rehydrate hazards when module.fields changes
  useEffect(() => {
    setHazards(initializeHazards(module.fields));
    setValidation(initializeValidation(module.fields));
  }, [module.fields]);

  // Validate on changes
  useEffect(() => {
    const validationResult = validateForm(task, hazards, validation);
    setValidation(validationResult.validationState);
    onValidationChange?.(validationResult);
  }, [task, hazards, validation.hazards, onValidationChange]);

  // Memoize groupedHazards and extract field once per hazard
  const groupedHazards = useMemo(() => {
    const acc: {
      [key: string]: { hazard: HazardState; field: ModuleField | undefined }[];
    } = {};
    for (const hazard of hazards) {
      const field = module.fields.find((f: ModuleField) => f.id === hazard.id);
      const category = field?.options?.category || "General";
      if (!acc[category]) acc[category] = [];
      acc[category].push({ hazard, field });
    }
    return acc;
  }, [hazards, module.fields]);

  // Helper to handle both sync and async onDataChange
  function handleMaybePromise(
    fn: () => void | Promise<string>,
    cb: (result: string | void) => void
  ) {
    const result = fn();
    if (result && typeof (result as Promise<string>).then === "function") {
      (result as Promise<string>).then(cb);
    } else {
      cb(result as string | void);
    }
  }

  // Replace all onDataChange?.({...}).then(...) with handleMaybePromise
  const handleTaskChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newTask = e.target.value;
      setTask(newTask);
      if (onDataChange) {
        handleMaybePromise(
          () => onDataChange({ task: newTask, hazards, validation }),
          (result: string | void) => {
            if (typeof result === "string") setParentError(result);
            else setParentError(null);
          }
        );
      }
    },
    [hazards, validation, onDataChange]
  );

  const handleHazardChange = useCallback(
    (hazardId: string, acknowledged: boolean) => {
      setHazards((prev) => {
        const newHazards = prev.map((hazard) =>
          hazard.id === hazardId ? { ...hazard, acknowledged } : hazard
        );
        if (onDataChange) {
          handleMaybePromise(
            () => onDataChange({ task, hazards: newHazards, validation }),
            (result: string | void) => {
              if (typeof result === "string") setParentError(result);
              else setParentError(null);
            }
          );
        }
        return newHazards;
      });
    },
    [task, validation, onDataChange]
  );

  const handleControlChange = useCallback(
    (hazardId: string, control: string) => {
      setHazards((prev) => {
        const newHazards = prev.map((hazard) =>
          hazard.id === hazardId ? { ...hazard, control } : hazard
        );
        if (onDataChange) {
          handleMaybePromise(
            () => onDataChange({ task, hazards: newHazards, validation }),
            (result: string | void) => {
              if (typeof result === "string") setParentError(result);
              else setParentError(null);
            }
          );
        }
        return newHazards;
      });
    },
    [task, validation, onDataChange]
  );

  const handleRiskLevelChange = useCallback(
    (hazardId: string, riskLevelAfter: number) => {
      setHazards((prev) => {
        const newHazards = prev.map((hazard) =>
          hazard.id === hazardId ? { ...hazard, riskLevelAfter } : hazard
        );
        if (onDataChange) {
          handleMaybePromise(
            () => onDataChange({ task, hazards: newHazards, validation }),
            (result: string | void) => {
              if (typeof result === "string") setParentError(result);
              else setParentError(null);
            }
          );
        }
        return newHazards;
      });
    },
    [task, validation, onDataChange]
  );

  // Upload deduplication and form/module ID validation
  const handleFileUpload = useCallback(
    async (files: FileList) => {
      setIsUploading(true);
      setUploadError(null);
      setParentError(null);
      if (!formId || !moduleId) {
        setUploadError("Missing form or module ID");
        setIsUploading(false);
        return;
      }
      try {
        const newFiles = Array.from(files).filter(
          (file) =>
            !uploadedFiles.some(
              (f) =>
                f.metadata.originalName === file.name &&
                f.metadata.size === file.size
            )
        );
        if (newFiles.length === 0) {
          setUploadError("Duplicate file(s) detected");
          setIsUploading(false);
          return;
        }
        const uploadPromises = newFiles.map((file) =>
          FileStorageService.uploadFile(file, userId)
        );
        const results = await Promise.all(uploadPromises);
        setUploadedFiles((prev) => [...prev, ...results]);
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Failed to upload files"
        );
      } finally {
        setIsUploading(false);
      }
    },
    [userId, uploadedFiles, formId, moduleId]
  );

  const handleFileDelete = useCallback(async (storagePath: string) => {
    try {
      await FileStorageService.deleteFile(storagePath);
      setUploadedFiles((prev) =>
        prev.filter((file) => file.storagePath !== storagePath)
      );
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to delete file"
      );
    }
  }, []);

  return (
    <div className={className} role="form" aria-label="Task Hazard Assessment">
      <h3 id={`module-title-${module.id}`}>{module.label}</h3>
      {parentError && (
        <div role="alert" aria-live="polite" style={{ color: "red" }}>
          {parentError}
        </div>
      )}
      {/* Task Description */}
      <div>
        <label htmlFor={`task-${module.id}`}>
          Task Description
          <span aria-hidden="true">*</span>
        </label>
        <textarea
          id={`task-${module.id}`}
          value={task}
          onChange={handleTaskChange}
          required
          aria-required="true"
          rows={4}
          aria-invalid={!validation.task}
          aria-describedby={`task-error-${module.id}`}
          tabIndex={0}
        />
        {!validation.task && (
          <div id={`task-error-${module.id}`} role="alert" aria-live="polite">
            Task description is required
          </div>
        )}
      </div>
      {/* Hazards */}
      <div role="group" aria-labelledby={`module-title-${module.id}`}>
        <h4>Hazards</h4>
        {Object.entries(groupedHazards).map(([category, categoryHazards]) => (
          <div key={category} role="group" aria-label={`${category} Hazards`}>
            <h5>{category}</h5>
            {categoryHazards.map(({ hazard, field }) => {
              const isRequired = field?.required || false;
              return (
                <div
                  key={hazard.id}
                  role="group"
                  aria-label={`Hazard: ${hazard.hazard}`}
                >
                  <label htmlFor={`hazard-${hazard.id}`}>
                    <input
                      id={`hazard-${hazard.id}`}
                      type="checkbox"
                      checked={hazard.acknowledged}
                      onChange={(e) =>
                        handleHazardChange(hazard.id, e.target.checked)
                      }
                      required={isRequired}
                      aria-required={isRequired}
                      aria-invalid={isRequired && !hazard.acknowledged}
                      aria-describedby={`hazard-error-${hazard.id}`}
                      tabIndex={0}
                    />
                    {hazard.hazard}
                    {isRequired && <span aria-hidden="true">*</span>}
                    {field?.options?.severity && (
                      <span className={`severity-${field.options.severity}`}>
                        ({field.options.severity})
                      </span>
                    )}
                  </label>
                  {hazard.acknowledged && (
                    <div
                      role="group"
                      aria-label={`Controls for ${hazard.hazard}`}
                    >
                      <div>
                        <label htmlFor={`control-${hazard.id}`}>
                          Control Measure
                          <span aria-hidden="true">*</span>
                        </label>
                        <textarea
                          id={`control-${hazard.id}`}
                          value={hazard.control}
                          onChange={(e) =>
                            handleControlChange(hazard.id, e.target.value)
                          }
                          required
                          aria-required="true"
                          rows={2}
                          aria-invalid={!hazard.control.trim()}
                          aria-describedby={`control-error-${hazard.id}`}
                          tabIndex={0}
                        />
                        {!hazard.control.trim() && (
                          <div
                            id={`control-error-${hazard.id}`}
                            role="alert"
                            aria-live="polite"
                          >
                            Control measure is required
                          </div>
                        )}
                      </div>
                      <div>
                        <label htmlFor={`risk-level-${hazard.id}`}>
                          Risk Level After Control
                          <span aria-hidden="true">*</span>
                        </label>
                        <input
                          id={`risk-level-${hazard.id}`}
                          type="number"
                          min="1"
                          max="10"
                          value={hazard.riskLevelAfter}
                          onChange={(e) =>
                            handleRiskLevelChange(
                              hazard.id,
                              parseInt(e.target.value)
                            )
                          }
                          required
                          aria-required="true"
                          aria-invalid={
                            hazard.riskLevelAfter === INITIAL_RISK_LEVEL
                          }
                          aria-describedby={`risk-level-error-${hazard.id}`}
                          tabIndex={0}
                        />
                        {hazard.riskLevelAfter === INITIAL_RISK_LEVEL && (
                          <div
                            id={`risk-level-error-${hazard.id}`}
                            role="alert"
                            aria-live="polite"
                          >
                            Risk level must be reassessed
                          </div>
                        )}
                      </div>
                      <div>
                        <small>
                          Initial Risk Level: {hazard.riskLevelBefore}
                        </small>
                      </div>
                    </div>
                  )}
                  {isRequired && !hazard.acknowledged && (
                    <div
                      id={`hazard-error-${hazard.id}`}
                      role="alert"
                      aria-live="polite"
                    >
                      This hazard must be acknowledged
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* File Upload Section */}
      <div role="group" aria-label="File Upload">
        <h4>Supporting Documents</h4>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          disabled={isUploading}
          aria-describedby="upload-status"
        />
        {isUploading && (
          <div id="upload-status" role="status" aria-live="polite">
            Uploading files...
          </div>
        )}
        {uploadError && (
          <div role="alert" aria-live="polite">
            {uploadError}
          </div>
        )}
        {uploadedFiles.length > 0 && (
          <div>
            <h5>Uploaded Files</h5>
            <ul>
              {uploadedFiles.map((file) => (
                <li key={file.storagePath}>
                  <a
                    href={file.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {file.metadata.originalName}
                  </a>
                  <button
                    onClick={() => handleFileDelete(file.storagePath)}
                    aria-label={`Delete ${file.metadata.originalName}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
function initializeHazards(fields: ModuleField[]): HazardState[] {
  return fields
    .filter((field) => field.type === "boolean")
    .map((field) => ({
      id: field.id,
      hazard: field.label,
      riskLevelBefore: INITIAL_RISK_LEVEL,
      control: "",
      riskLevelAfter: INITIAL_RISK_LEVEL,
      acknowledged: false,
    }));
}

function initializeValidation(fields: ModuleField[]): ValidationState {
  const initialValidation: ValidationState = {
    task: false,
    hazards: {},
  };
  fields
    .filter((field) => field.type === "boolean" && field.required)
    .forEach((field) => {
      initialValidation.hazards[field.id] = {
        hazard: true,
        control: false,
        riskLevelAfter: false,
      };
    });
  return initialValidation;
}

function validateForm(
  task: string,
  hazards: HazardState[],
  currentValidation: ValidationState
): ValidationResult {
  const isTaskValid = task.trim().length > 0;
  const errors: ValidationResult["errors"] = {
    task: isTaskValid ? undefined : "Task description is required",
    hazards: {},
  };

  const newValidation: ValidationState = {
    task: isTaskValid,
    hazards: { ...currentValidation.hazards },
  };

  let isValid = isTaskValid;

  Object.entries(currentValidation.hazards).forEach(
    ([hazardId, validations]) => {
      const hazard = hazards.find((h) => h.id === hazardId);
      if (!hazard) return;

      const hazardErrors: Record<string, string> = {};
      let hazardValid = validations.hazard;

      if (hazard.acknowledged) {
        const controlValid = hazard.control.trim().length > 0;
        const riskLevelValid = hazard.riskLevelAfter !== INITIAL_RISK_LEVEL;

        hazardValid = hazardValid && controlValid && riskLevelValid;

        if (!controlValid) {
          hazardErrors.control = "Control measure is required";
        }
        if (!riskLevelValid) {
          hazardErrors.riskLevelAfter = "Risk level must be reassessed";
        }
      }

      if (!hazardValid) {
        isValid = false;
        errors.hazards![hazardId] = hazardErrors;
      }

      newValidation.hazards[hazardId] = {
        hazard: validations.hazard,
        control: hazard.acknowledged ? hazard.control.trim().length > 0 : true,
        riskLevelAfter: hazard.acknowledged
          ? hazard.riskLevelAfter !== INITIAL_RISK_LEVEL
          : true,
      };
    }
  );

  return {
    isValid,
    validationState: newValidation,
    errors,
  };
}

export default TaskHazardModule;

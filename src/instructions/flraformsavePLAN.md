# FLRA Form Save Logic Refactor Implementation Guide

## 1. Type Definitions

```typescript
// src/types/formTypes.ts
import { z } from "zod";

// Module Key Types
export type ModuleKey =
  | "generalInfo"
  | "preJobChecklist"
  | "ppeChecklist"
  | "header";

export const MODULE_KEY_MAP = {
  "General Information": "generalInfo",
  "Pre-Job Checklist": "preJobChecklist",
  "PPE and Platform Inspection": "ppeChecklist",
  Header: "header",
} as const;

// Zod Schema for Runtime Validation
export const moduleKeySchema = z.enum([
  "generalInfo",
  "preJobChecklist",
  "ppeChecklist",
  "header",
]);

// Type-safe Module Key Helper
export function getModuleKey(moduleType: string): ModuleKey {
  const key = MODULE_KEY_MAP[moduleType];
  if (!key) {
    throw new Error(`Invalid module type: ${moduleType}`);
  }
  return key;
}

// Type-safe Module Data Types
export interface ModuleData {
  generalInfo: GeneralInfoPayload;
  preJobChecklist: PreJobChecklistPayload;
  ppeChecklist: PpeChecklistPayload;
  header: HeaderPayload;
}

// Type-safe Save Params
export interface SaveFieldsParams<T extends ModuleKey> {
  formId: string;
  moduleKey: T;
  data: ModuleData[T];
  version?: number;
}

export interface FieldDefinition {
  type: "text" | "boolean" | "date" | "time" | "number" | "textarea";
  required: boolean;
  label: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface ModulePayload {
  generalInfo: GeneralInfoPayload;
  preJobChecklist: PreJobChecklistPayload;
  ppeChecklist: PpeChecklistPayload;
}

export interface GeneralInfoPayload {
  projectName: string;
  projectAddress: string;
  taskLocation: string;
  supervisorName: string;
  supervisorContact: string;
  date: string;
  crewMembersCount: number;
  taskDescription: string;
  startTime: string;
  endTime: string;
}

export interface PreJobChecklistPayload {
  isFitForDuty: boolean;
  reviewedWorkAreaForHazards: boolean;
  requiredPpeForToday: boolean;
  equipmentInspectionUpToDate: boolean;
  completedFlraHazardAssessment: boolean;
}

export interface PpeChecklistPayload {
  ppeHardhat: boolean;
  ppeSafetyVest: boolean;
  ppeSafetyGlasses: boolean;
  ppeFallProtection: boolean;
  ppeCoveralls: boolean;
  ppeGloves: boolean;
  ppeMask: boolean;
  ppeRespirator: boolean;
}

export interface SaveFieldsParams<T extends keyof ModulePayload> {
  formId: string;
  moduleKey: T;
  data: ModulePayload[T];
  version?: number;
}
```

### 1.1 Runtime Validation Helper

```typescript
// src/utils/validation.ts
import { z } from "zod";
import { moduleKeySchema, ModuleKey, ModuleData } from "../types/formTypes";

export function validateModuleData<T extends ModuleKey>(
  moduleKey: T,
  data: unknown
): ModuleData[T] {
  const schema = z.object({
    // Add validation rules based on module type
    generalInfo: z.object({
      projectName: z.string().min(1),
      projectAddress: z.string().min(1),
      // ... other fields
    }),
    preJobChecklist: z.object({
      isFitForDuty: z.boolean(),
      reviewedWorkAreaForHazards: z.boolean(),
      // ... other fields
    }),
    ppeChecklist: z.object({
      ppeHardhat: z.boolean(),
      ppeSafetyVest: z.boolean(),
      // ... other fields
    }),
    header: z.object({
      // ... header fields
    }),
  });

  const result = schema.shape[moduleKey].safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid data for module ${moduleKey}: ${result.error.message}`
    );
  }

  return result.data as ModuleData[T];
}
```

### 1.2 Enhanced Save Service

```typescript
// src/services/forms/saveFields.ts
import {
  SaveFieldsParams,
  ModuleKey,
  validateModuleData,
} from "../../types/formTypes";
import { getFunctionUrl } from "../../utils/supabase";

export async function saveFields<T extends ModuleKey>(
  params: SaveFieldsParams<T>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate module key
    if (!Object.values(MODULE_KEY_MAP).includes(params.moduleKey)) {
      throw new Error(`Invalid module key: ${params.moduleKey}`);
    }

    // Validate data
    validateModuleData(params.moduleKey, params.data);

    const response = await fetch(getFunctionUrl("saveFields"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to save fields: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Save fields error:", error);
    throw error;
  }
}
```

### 1.3 Auto-generation from Supabase

```typescript
// scripts/generateModuleTypes.ts
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { join } from "path";

async function generateModuleTypes() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );

  // Fetch module types from Supabase
  const { data: modules } = await supabase
    .from("form_modules")
    .select("id, name, type");

  // Generate type definitions
  const typeDefinitions = `
    // Auto-generated module types
    export type ModuleKey = ${modules.map((m) => `"${m.type}"`).join(" | ")};

    export const MODULE_KEY_MAP = {
      ${modules.map((m) => `"${m.name}": "${m.type}"`).join(",\n      ")}
    } as const;
  `;

  // Write to file
  writeFileSync(
    join(__dirname, "../src/types/generated/moduleTypes.ts"),
    typeDefinitions
  );
}

generateModuleTypes().catch(console.error);
```

## 2. Field Module Implementation

### 2.1 General Info Fields (src/modules/fields/generalInfo.ts)

```typescript
import { FieldDefinition } from "../../types/formTypes";

export const generalInfoFields: Record<
  keyof GeneralInfoPayload,
  FieldDefinition
> = {
  projectName: {
    type: "text",
    required: true,
    label: "Project Name",
    validation: {
      minLength: 2,
      maxLength: 100,
    },
  },
  projectAddress: {
    type: "text",
    required: true,
    label: "Project Address",
  },
  taskLocation: {
    type: "text",
    required: true,
    label: "Task Location",
  },
  supervisorName: {
    type: "text",
    required: true,
    label: "Supervisor Name",
  },
  supervisorContact: {
    type: "text",
    required: true,
    label: "Supervisor Contact",
  },
  date: {
    type: "date",
    required: true,
    label: "Date",
  },
  crewMembersCount: {
    type: "number",
    required: true,
    label: "Number of Crew Members",
    validation: {
      min: 1,
      max: 100,
    },
  },
  taskDescription: {
    type: "textarea",
    required: true,
    label: "Task Description",
  },
  startTime: {
    type: "time",
    required: true,
    label: "Start Time",
  },
  endTime: {
    type: "time",
    required: true,
    label: "End Time",
  },
};
```

### 2.2 PPE Checklist Fields (src/modules/fields/ppe.ts)

```typescript
import { FieldDefinition } from "../../types/formTypes";

export const ppeFields: Record<keyof PpeChecklistPayload, FieldDefinition> = {
  ppeHardhat: {
    type: "boolean",
    required: true,
    label: "Hard Hat",
  },
  ppeSafetyVest: {
    type: "boolean",
    required: true,
    label: "Safety Vest",
  },
  ppeSafetyGlasses: {
    type: "boolean",
    required: true,
    label: "Safety Glasses",
  },
  ppeFallProtection: {
    type: "boolean",
    required: true,
    label: "Fall Protection",
  },
  ppeCoveralls: {
    type: "boolean",
    required: true,
    label: "Coveralls",
  },
  ppeGloves: {
    type: "boolean",
    required: true,
    label: "Gloves",
  },
  ppeMask: {
    type: "boolean",
    required: true,
    label: "Mask",
  },
  ppeRespirator: {
    type: "boolean",
    required: true,
    label: "Respirator",
  },
};
```

### 2.3 Pre-Job Checklist Fields (src/modules/fields/preJob.ts)

```typescript
import { FieldDefinition } from "../../types/formTypes";

export const preJobFields: Record<
  keyof PreJobChecklistPayload,
  FieldDefinition
> = {
  isFitForDuty: {
    type: "boolean",
    required: true,
    label: "Fit for Duty",
  },
  reviewedWorkAreaForHazards: {
    type: "boolean",
    required: true,
    label: "Work Area Hazards Reviewed",
  },
  requiredPpeForToday: {
    type: "boolean",
    required: true,
    label: "Required PPE Identified",
  },
  equipmentInspectionUpToDate: {
    type: "boolean",
    required: true,
    label: "Equipment Inspection Current",
  },
  completedFlraHazardAssessment: {
    type: "boolean",
    required: true,
    label: "FLRA Hazard Assessment Completed",
  },
  // ... other fields
};
```

## 3. Save Logic Implementation

### 3.1 Module Key Helper (src/services/forms/getModuleKey.ts)

```typescript
const MODULE_KEY_MAP = {
  GENERAL_INFO: "generalInfo",
  PRE_JOB_CHECKLIST: "preJobChecklist",
  PPE_CHECKLIST: "ppeChecklist",
  PPE_PLATFORM: "ppeChecklist",
} as const;

export type ModuleKey = keyof typeof MODULE_KEY_MAP;

export function getModuleKey(moduleType: string): ModuleKey {
  return MODULE_KEY_MAP[moduleType.toUpperCase()] || moduleType;
}
```

### 3.2 Central Save Service (src/services/forms/saveFields.ts)

```typescript
import { SaveFieldsParams, ModulePayload } from "../../types/formTypes";
import { getFunctionUrl } from "../../utils/supabase";

export async function saveFields<T extends keyof ModulePayload>(
  params: SaveFieldsParams<T>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(getFunctionUrl("saveFields"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to save fields: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Save fields error:", error);
    throw error;
  }
}
```

### 3.3 Enhanced Debounced Save Hook (src/hooks/useDebouncedSave.ts)

```typescript
import { useRef, useState, useCallback } from "react";
import { debounce } from "lodash";
import { saveFields, SaveFieldsParams } from "../services/forms/saveFields";
import { useToast } from "../hooks/useToast";

interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
}

export function useDebouncedSave<T extends keyof ModulePayload>(
  delay: number = 300
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    isSaving: false,
    lastSaved: null,
    error: null,
  });
  const { showToast } = useToast();
  const saveQueue = useRef<Map<string, SaveFieldsParams<T>>>(new Map());

  const processSaveQueue = useCallback(async () => {
    if (saveQueue.current.size === 0) return;

    setSaveStatus((prev) => ({ ...prev, isSaving: true }));

    for (const [moduleId, params] of saveQueue.current) {
      try {
        await saveFields(params);
        saveQueue.current.delete(moduleId);
        setSaveStatus((prev) => ({
          ...prev,
          lastSaved: new Date(),
          error: null,
        }));
      } catch (error) {
        setSaveStatus((prev) => ({
          ...prev,
          error: error as Error,
        }));
        showToast({
          type: "error",
          message: "Failed to save changes. Will retry automatically.",
        });
      }
    }

    setSaveStatus((prev) => ({ ...prev, isSaving: false }));
  }, [showToast]);

  const debouncedSave = useRef(
    debounce((params: SaveFieldsParams<T>) => {
      saveQueue.current.set(params.moduleKey, params);
      processSaveQueue();
    }, delay)
  );

  return {
    save: debouncedSave.current,
    status: saveStatus,
    retry: processSaveQueue,
  };
}
```

### 3.4 Enhanced Edge Function (supabase/functions/v1/saveFields.ts)

```typescript
import { createClient } from "@supabase/supabase-js";
import { TABLES } from "../../constants/database";
import { SaveFieldsParams, ModulePayload } from "../../types/formTypes";

export async function saveFields(req: Request) {
  const { formId, moduleKey, data, version } =
    (await req.json()) as SaveFieldsParams<keyof ModulePayload>;

  // Validate request payload
  if (!formId || !moduleKey || !data) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing required fields",
      }),
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );

  try {
    // Check for concurrent modifications
    if (version) {
      const { data: currentData } = await supabase
        .from(TABLES.formInstances)
        .select("version")
        .eq("id", formId)
        .single();

      if (currentData?.version !== version) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Form was modified by another user",
          }),
          { status: 409 }
        );
      }
    }

    // Determine target table
    const tableMap = {
      generalInfo: TABLES.formInstanceGeneralInfo,
      preJobChecklist: TABLES.formInstancePreJobChecklist,
      ppeChecklist: TABLES.formInstancePpePlatform,
    };

    const table = tableMap[moduleKey];
    if (!table) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid module key",
        }),
        { status: 400 }
      );
    }

    // Prepare row data with form reference and version
    const rowData = {
      ...data,
      form_instance_id: formId,
      version: (version || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from(table).upsert(rowData);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        version: rowData.version,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Save fields error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
```

## 4. Form Integration

### 4.1 FlraFormPage Updates

```typescript
import { useDebouncedSave } from "../hooks/useDebouncedSave";
import { useToast } from "../hooks/useToast";
import { ModulePayload } from "../types/formTypes";

export function FlraFormPage() {
  const { save, status, retry } = useDebouncedSave();
  const { showToast } = useToast();
  const [formVersion, setFormVersion] = useState<number>(0);

  const handleModuleChange = async <T extends keyof ModulePayload>(
    moduleId: T,
    value: ModulePayload[T]
  ) => {
    try {
      const result = await save({
        formId,
        moduleKey: moduleId,
        data: value,
        version: formVersion,
      });

      if (result.success) {
        setFormVersion(result.version);
      }
    } catch (error) {
      showToast({
        type: "error",
        message: "Failed to save changes. Will retry automatically.",
      });
    }
  };

  return (
    <div>
      {/* Form content */}
      {status.isSaving && <SaveIndicator />}
      {status.error && <RetryButton onClick={retry}>Retry Save</RetryButton>}
    </div>
  );
}
```

## 5. Testing Checklist

### 5.1 Type Safety Tests

- [ ] Verify all payloads match their type definitions
- [ ] Check that module keys are correctly typed
- [ ] Ensure field definitions match payload types

### 5.2 Save Functionality Tests

- [ ] Test concurrent saves from multiple tabs
- [ ] Verify version tracking prevents conflicts
- [ ] Check retry mechanism works
- [ ] Validate error handling and user feedback

### 5.3 Data Consistency Tests

- [ ] Verify all fields save to correct tables
- [ ] Check form version increments correctly
- [ ] Validate timestamps are updated
- [ ] Test recovery from network failures

### 5.4 Performance Tests

- [ ] Measure save response times
- [ ] Check debounce effectiveness
- [ ] Verify UI remains responsive
- [ ] Test with large payloads

## 6. Implementation Order

1. [ ] Add type definitions
2. [ ] Update field modules with new types
3. [ ] Implement enhanced save service
4. [ ] Add version tracking
5. [ ] Implement retry mechanism
6. [ ] Add user feedback
7. [ ] Update form integration
8. [ ] Run test suite
9. [ ] Deploy edge function
10. [ ] Monitor performance

## 7. Error Recovery Strategy

### 7.1 Client-Side Error Handling

```typescript
// src/hooks/useSaveWithRetry.ts
interface SaveRetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export function useSaveWithRetry(
  config: SaveRetryConfig = {
    maxRetries: 3,
    baseDelay: 500,
    maxDelay: 5000,
  }
) {
  const [isDirty, setIsDirty] = useState(false);
  const [failedSaves, setFailedSaves] = useState<Set<string>>(new Set());
  const saveQueue = useRef<Map<string, SaveFieldsParams>>(new Map());
  const { showToast } = useToast();

  const saveWithRetry = async (params: SaveFieldsParams) => {
    setIsDirty(true);
    saveQueue.current.set(params.moduleKey, params);

    for (let i = 0; i < config.maxRetries; i++) {
      try {
        if (!navigator.onLine) {
          throw new Error("Offline");
        }

        const result = await saveFields(params);
        if (result.success) {
          setIsDirty(false);
          setFailedSaves((prev) => {
            const next = new Set(prev);
            next.delete(params.moduleKey);
            return next;
          });
          saveQueue.current.delete(params.moduleKey);
          return result;
        }
      } catch (error) {
        if (i === config.maxRetries - 1) {
          setFailedSaves((prev) => new Set(prev).add(params.moduleKey));
          showToast({
            type: "error",
            message: "Failed to save changes. Will retry automatically.",
            action: {
              label: "Retry Now",
              onClick: () => saveWithRetry(params),
            },
          });
          throw error;
        }
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            Math.min(config.baseDelay * Math.pow(2, i), config.maxDelay)
          )
        );
      }
    }
  };

  const flushQueue = async () => {
    if (!navigator.onLine) return;

    for (const [moduleKey, params] of saveQueue.current) {
      await saveWithRetry(params);
    }
  };

  // Listen for online status
  useEffect(() => {
    const handleOnline = () => {
      flushQueue();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return {
    saveWithRetry,
    isDirty,
    failedSaves,
    flushQueue,
  };
}
```

### 7.2 Enhanced Edge Function Error Handling

```typescript
// src/functions/v1/saveFields.ts
enum ErrorType {
  VALIDATION = "VALIDATION",
  CONCURRENT = "CONCURRENT",
  PERMISSION = "PERMISSION",
  NETWORK = "NETWORK",
  UNKNOWN = "UNKNOWN",
}

interface ErrorResponse {
  type: ErrorType;
  message: string;
  details?: any;
  retryable: boolean;
}

function handleError(error: any): ErrorResponse {
  // Log error to monitoring service
  console.error("Save fields error:", {
    error,
    timestamp: new Date().toISOString(),
    stack: error.stack,
  });

  if (error.message?.includes("permission")) {
    return {
      type: ErrorType.PERMISSION,
      message: "Unauthorized to save form data",
      retryable: false,
    };
  }

  if (error.message?.includes("version")) {
    return {
      type: ErrorType.CONCURRENT,
      message: "Form was modified by another user",
      retryable: true,
    };
  }

  if (error.message?.includes("network")) {
    return {
      type: ErrorType.NETWORK,
      message: "Network error occurred",
      retryable: true,
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: "An unexpected error occurred",
    retryable: false,
  };
}

export async function saveFields(req: Request) {
  try {
    // ... existing validation and setup ...

    const { error } = await supabase.from(table).upsert(rowData);
    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        version: rowData.version,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    const errorResponse = handleError(error);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorResponse,
      }),
      {
        status:
          errorResponse.type === ErrorType.PERMISSION
            ? 403
            : errorResponse.type === ErrorType.CONCURRENT
            ? 409
            : errorResponse.type === ErrorType.VALIDATION
            ? 400
            : 500,
      }
    );
  }
}
```

### 7.3 UI Components for Error States

```typescript
// src/components/FormStatus.tsx
interface FormStatusProps {
  isDirty: boolean;
  failedSaves: Set<string>;
  onRetry: () => void;
}

export function FormStatus({ isDirty, failedSaves, onRetry }: FormStatusProps) {
  return (
    <div className="form-status">
      {isDirty && (
        <div className="unsaved-changes">
          <Icon type="warning" />
          <span>Unsaved changes</span>
        </div>
      )}
      {failedSaves.size > 0 && (
        <div className="save-errors">
          <Icon type="error" />
          <span>{failedSaves.size} sections failed to save</span>
          <button onClick={onRetry}>Retry All</button>
        </div>
      )}
    </div>
  );
}

// src/components/ModuleHeader.tsx
interface ModuleHeaderProps {
  title: string;
  hasError: boolean;
  onRetry: () => void;
}

export function ModuleHeader({ title, hasError, onRetry }: ModuleHeaderProps) {
  return (
    <div className={`module-header ${hasError ? "has-error" : ""}`}>
      <h3>{title}</h3>
      {hasError && (
        <button onClick={onRetry} className="retry-button">
          <Icon type="retry" />
          Retry Save
        </button>
      )}
    </div>
  );
}
```

### 7.4 Integration with Form Page

```typescript
// src/pages/FlraFormPage.tsx
export function FlraFormPage() {
  const { saveWithRetry, isDirty, failedSaves, flushQueue } =
    useSaveWithRetry();

  const handleModuleChange = async <T extends keyof ModulePayload>(
    moduleId: T,
    value: ModulePayload[T]
  ) => {
    try {
      await saveWithRetry({
        formId,
        moduleKey: moduleId,
        data: value,
        version: formVersion,
      });
    } catch (error) {
      // Error is handled by useSaveWithRetry
    }
  };

  return (
    <div>
      <FormStatus
        isDirty={isDirty}
        failedSaves={failedSaves}
        onRetry={flushQueue}
      />

      {modules.map((module) => (
        <div key={module.id}>
          <ModuleHeader
            title={module.title}
            hasError={failedSaves.has(module.id)}
            onRetry={() =>
              saveWithRetry({
                formId,
                moduleKey: module.id,
                data: formValues[module.id],
                version: formVersion,
              })
            }
          />
          <ModuleContent
            value={formValues[module.id]}
            onChange={(value) => handleModuleChange(module.id, value)}
          />
        </div>
      ))}
    </div>
  );
}
```

## 8. Testing Error Recovery

### 8.1 Client-Side Tests

```typescript
describe("Error Recovery", () => {
  it("should retry failed saves with exponential backoff", async () => {
    // Test retry logic
  });

  it("should queue saves when offline", async () => {
    // Test offline behavior
  });

  it("should flush queue when back online", async () => {
    // Test online recovery
  });

  it("should show appropriate UI for failed saves", async () => {
    // Test error UI
  });
});
```

### 8.2 Server-Side Tests

```typescript
describe("Edge Function Error Handling", () => {
  it("should handle permission errors", async () => {
    // Test 403 responses
  });

  it("should handle concurrent modification", async () => {
    // Test 409 responses
  });

  it("should handle validation errors", async () => {
    // Test 400 responses
  });

  it("should handle network errors", async () => {
    // Test 500 responses
  });
});
```

## 9. Implementation Checklist

### 9.1 Error Recovery

- [ ] Implement useSaveWithRetry hook
- [ ] Add offline detection and queue
- [ ] Create error UI components
- [ ] Add retry buttons and status indicators
- [ ] Implement exponential backoff
- [ ] Add error logging and monitoring

### 9.2 Edge Function

- [ ] Add error classification
- [ ] Implement structured error responses
- [ ] Add error logging
- [ ] Add retryable flag
- [ ] Add proper status codes

### 9.3 UI/UX

- [ ] Add unsaved changes indicator
- [ ] Add error state styling
- [ ] Add retry buttons
- [ ] Add toast notifications
- [ ] Add offline indicator

## Notes

- Implement retry with exponential backoff
- Queue saves when offline
- Show clear error states in UI
- Log errors for monitoring
- Handle all error types appropriately
- Maintain data consistency
- Provide clear user feedback

## 10. Shared Form Context Implementation

### 10.1 Form Context Definition

```typescript
// src/contexts/FlraFormContext.tsx
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import { ModuleKey } from "../types/formTypes";

interface FlraFormState {
  formId: string;
  formVersion: number;
  moduleStates: Record<
    ModuleKey,
    {
      isDirty: boolean;
      isSaving: boolean;
      lastSavedAt: string | null;
      hasError: boolean;
      error: string | null;
    }
  >;
  sharedFields: Record<string, any>;
}

type FlraFormAction =
  | { type: "SET_FORM_VERSION"; version: number }
  | {
      type: "UPDATE_MODULE_STATE";
      moduleKey: ModuleKey;
      state: Partial<FlraFormState["moduleStates"][ModuleKey]>;
    }
  | { type: "UPDATE_SHARED_FIELD"; key: string; value: any }
  | { type: "RESET_FORM" };

const initialState: FlraFormState = {
  formId: "",
  formVersion: 0,
  moduleStates: {},
  sharedFields: {},
};

function formReducer(
  state: FlraFormState,
  action: FlraFormAction
): FlraFormState {
  switch (action.type) {
    case "SET_FORM_VERSION":
      return { ...state, formVersion: action.version };
    case "UPDATE_MODULE_STATE":
      return {
        ...state,
        moduleStates: {
          ...state.moduleStates,
          [action.moduleKey]: {
            ...state.moduleStates[action.moduleKey],
            ...action.state,
          },
        },
      };
    case "UPDATE_SHARED_FIELD":
      return {
        ...state,
        sharedFields: {
          ...state.sharedFields,
          [action.key]: action.value,
        },
      };
    case "RESET_FORM":
      return initialState;
    default:
      return state;
  }
}

const FlraFormContext = createContext<{
  state: FlraFormState;
  dispatch: React.Dispatch<FlraFormAction>;
  actions: {
    setFormVersion: (version: number) => void;
    updateModuleState: (
      moduleKey: ModuleKey,
      state: Partial<FlraFormState["moduleStates"][ModuleKey]>
    ) => void;
    updateSharedField: (key: string, value: any) => void;
    resetForm: () => void;
  };
} | null>(null);

export function FlraFormProvider({
  children,
  initialFormId,
}: {
  children: React.ReactNode;
  initialFormId: string;
}) {
  const [state, dispatch] = useReducer(formReducer, {
    ...initialState,
    formId: initialFormId,
  });

  const actions = {
    setFormVersion: useCallback((version: number) => {
      dispatch({ type: "SET_FORM_VERSION", version });
    }, []),
    updateModuleState: useCallback(
      (
        moduleKey: ModuleKey,
        state: Partial<FlraFormState["moduleStates"][ModuleKey]>
      ) => {
        dispatch({ type: "UPDATE_MODULE_STATE", moduleKey, state });
      },
      []
    ),
    updateSharedField: useCallback((key: string, value: any) => {
      dispatch({ type: "UPDATE_SHARED_FIELD", key, value });
    }, []),
    resetForm: useCallback(() => {
      dispatch({ type: "RESET_FORM" });
    }, []),
  };

  return (
    <FlraFormContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </FlraFormContext.Provider>
  );
}

export function useFlraForm() {
  const context = useContext(FlraFormContext);
  if (!context) {
    throw new Error("useFlraForm must be used within a FlraFormProvider");
  }
  return context;
}
```

### 10.2 Integration with Save System

```typescript
// src/hooks/useDebouncedSave.ts
import { useFlraForm } from "../contexts/FlraFormContext";

export function useDebouncedSave<T extends ModuleKey>(
  moduleKey: T,
  delay = 1000
) {
  const { state, actions } = useFlraForm();
  const { save, retry } = useDebouncedSaveCore(delay);

  const saveWithContext = useCallback(
    (data: any) => {
      actions.updateModuleState(moduleKey, { isDirty: true, isSaving: true });

      return save({
        formId: state.formId,
        moduleKey,
        data,
        version: state.formVersion,
      }).then((result) => {
        if (result.success) {
          actions.setFormVersion(result.version);
          actions.updateModuleState(moduleKey, {
            isDirty: false,
            isSaving: false,
            lastSavedAt: result.updated_at,
            hasError: false,
            error: null,
          });
        } else {
          actions.updateModuleState(moduleKey, {
            isSaving: false,
            hasError: true,
            error: result.error,
          });
        }
        return result;
      });
    },
    [state.formId, state.formVersion, moduleKey, actions, save]
  );

  return {
    save: saveWithContext,
    retry,
    moduleState: state.moduleStates[moduleKey],
  };
}
```

### 10.3 Usage in Form Components

```typescript
// src/components/FlraForm.tsx
export function FlraForm({ formId }: { formId: string }) {
  return (
    <FlraFormProvider initialFormId={formId}>
      <FormContent />
    </FlraFormProvider>
  );
}

// src/components/FormContent.tsx
function FormContent() {
  const { state } = useFlraForm();

  return (
    <div>
      <FormHeader version={state.formVersion} />
      <FormModules />
      <SaveQueueStatus />
    </div>
  );
}

// src/components/FormModule.tsx
function FormModule({ moduleKey }: { moduleKey: ModuleKey }) {
  const { save, moduleState } = useDebouncedSave(moduleKey);

  return (
    <div>
      <ModuleHeader>
        <ModuleStateIndicator state={moduleState} />
      </ModuleHeader>
      <ModuleContent
        onChange={(data) => save(data)}
        disabled={moduleState.isSaving}
      />
    </div>
  );
}
```

### 10.4 Benefits of Shared Context

1. **Centralized State Management**

   - Single source of truth for form state
   - Consistent version tracking
   - Shared field access across modules

2. **Improved Performance**

   - Reduced prop drilling
   - Optimized re-renders
   - Shared save queue management

3. **Better Error Handling**

   - Centralized error tracking
   - Consistent error recovery
   - Unified retry mechanism

4. **Enhanced Developer Experience**
   - Type-safe context access
   - Simplified module integration
   - Clear state management patterns

### 10.5 Implementation Checklist

- [ ] Create FlraFormContext
- [ ] Implement form reducer
- [ ] Add provider component
- [ ] Create useFlraForm hook
- [ ] Update save system integration
- [ ] Add shared field support
- [ ] Implement version tracking
- [ ] Add error handling
- [ ] Update form components
- [ ] Add performance optimizations

## 11. Schema Generation and Type Safety

### 11.1 Schema Definition

```yaml
# src/schemas/form-schema.yaml
modules:
  generalInfo:
    table: form_instance_general_info
    fields:
      projectName:
        type: string
        required: true
        validation:
          minLength: 2
          maxLength: 100
      projectAddress:
        type: string
        required: true
      taskLocation:
        type: string
        required: true
      supervisorName:
        type: string
        required: true
      supervisorContact:
        type: string
        required: true
      date:
        type: date
        required: true
      crewMembersCount:
        type: number
        required: true
        validation:
          min: 1
          max: 100
      taskDescription:
        type: text
        required: true
      startTime:
        type: time
        required: true
      endTime:
        type: time
        required: true

  preJobChecklist:
    table: form_instance_pre_job_checklist
    fields:
      isFitForDuty:
        type: boolean
        required: true
      reviewedWorkAreaForHazards:
        type: boolean
        required: true
      requiredPpeForToday:
        type: boolean
        required: true
      equipmentInspectionUpToDate:
        type: boolean
        required: true
      completedFlraHazardAssessment:
        type: boolean
        required: true

  ppeChecklist:
    table: form_instance_ppe_platform
    fields:
      ppeHardhat:
        type: boolean
        required: true
      ppeSafetyVest:
        type: boolean
        required: true
      ppeSafetyGlasses:
        type: boolean
        required: true
      ppeFallProtection:
        type: boolean
        required: true
      ppeCoveralls:
        type: boolean
        required: true
      ppeGloves:
        type: boolean
        required: true
      ppeMask:
        type: boolean
        required: true
      ppeRespirator:
        type: boolean
        required: true
```

### 11.2 Schema Generator

```typescript
// scripts/generateTypes.ts
import { parse } from "yaml";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

interface SchemaField {
  type: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

interface ModuleSchema {
  table: string;
  fields: Record<string, SchemaField>;
}

interface FormSchema {
  modules: Record<string, ModuleSchema>;
}

async function generateTypes() {
  // Load schema definition
  const schemaYaml = readFileSync(
    join(__dirname, "../src/schemas/form-schema.yaml"),
    "utf8"
  );
  const schema = parse(schemaYaml) as FormSchema;

  // Connect to Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );

  // Generate TypeScript types
  const typeDefinitions = [
    "// Auto-generated types - DO NOT EDIT",
    "import { z } from 'zod';",
    "",
    "// Module Keys",
    `export type ModuleKey = ${Object.keys(schema.modules)
      .map((key) => `"${key}"`)
      .join(" | ")};`,
    "",
    "// Module Data Types",
    "export interface ModuleData {",
    ...Object.entries(schema.modules).map(
      ([key, module]) => `  ${key}: ${key}Payload;`
    ),
    "}",
    "",
    "// Payload Types",
    ...Object.entries(schema.modules).map(([key, module]) => {
      return [
        `export interface ${key}Payload {`,
        ...Object.entries(module.fields).map(
          ([field, config]) =>
            `  ${field}: ${getTypeScriptType(config.type)}${
              config.required ? "" : " | null"
            };`
        ),
        "}",
      ].join("\n");
    }),
    "",
    "// Zod Schemas",
    ...Object.entries(schema.modules).map(([key, module]) => {
      return [
        `export const ${key}Schema = z.object({`,
        ...Object.entries(module.fields).map(([field, config]) => {
          const zodType = getZodType(config.type);
          const validations = config.validation
            ? Object.entries(config.validation)
                .map(([k, v]) => `.${k}(${v})`)
                .join("")
            : "";
          return `  ${field}: ${zodType}${validations}${
            config.required ? "" : ".nullable()"
          },`;
        }),
        "});",
      ].join("\n");
    }),
  ].join("\n");

  // Write generated types
  writeFileSync(
    join(__dirname, "../src/types/generated/formTypes.ts"),
    typeDefinitions
  );

  // Generate database types
  const { data: tables } = await supabase
    .from("information_schema.tables")
    .select("*");

  const dbTypes = [
    "// Auto-generated database types - DO NOT EDIT",
    "",
    "export interface Database {",
    "  public: {",
    "    Tables: {",
    ...tables?.map(
      (table) =>
        `      ${table.table_name}: {
        Row: ${table.table_name}Row;
        Insert: ${table.table_name}Insert;
        Update: ${table.table_name}Update;
      }`
    ),
    "    }",
    "  }",
    "}",
  ].join("\n");

  writeFileSync(
    join(__dirname, "../src/types/generated/database.types.ts"),
    dbTypes
  );
}

function getTypeScriptType(type: string): string {
  switch (type) {
    case "string":
    case "text":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
    case "time":
      return "string";
    default:
      return "unknown";
  }
}

function getZodType(type: string): string {
  switch (type) {
    case "string":
    case "text":
      return "z.string()";
    case "number":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case "date":
      return "z.string().datetime()";
    case "time":
      return "z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)";
    default:
      return "z.unknown()";
  }
}

generateTypes().catch(console.error);
```

### 11.3 Integration with Build Process

```json
// package.json
{
  "scripts": {
    "generate-types": "ts-node scripts/generateTypes.ts",
    "prebuild": "npm run generate-types",
    "predev": "npm run generate-types"
  }
}
```

### 11.4 Schema Validation

```typescript
// src/utils/schemaValidation.ts
import { z } from "zod";
import { ModuleKey, ModuleData } from "../types/generated/formTypes";

const schemaMap = {
  generalInfo: generalInfoSchema,
  preJobChecklist: preJobChecklistSchema,
  ppeChecklist: ppeChecklistSchema,
} as const;

export function validateModuleData<T extends ModuleKey>(
  moduleKey: T,
  data: unknown
): ModuleData[T] {
  const schema = schemaMap[moduleKey];
  if (!schema) {
    throw new Error(`Invalid module key: ${moduleKey}`);
  }

  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid data for module ${moduleKey}: ${result.error.message}`
    );
  }

  return result.data as ModuleData[T];
}
```

### 11.5 Benefits of Schema Generation

1. **Type Safety**

   - Automatic type generation from schema
   - Runtime validation using Zod
   - TypeScript type inference
   - Catch schema mismatches at build time

2. **Maintainability**

   - Single source of truth for schema
   - Automatic updates when schema changes
   - Consistent validation rules
   - Clear documentation of data structure

3. **Developer Experience**

   - Autocomplete support
   - Type checking in IDE
   - Clear error messages
   - Easy schema updates

4. **Performance**
   - Optimized validation
   - Tree-shakeable types
   - No runtime overhead
   - Efficient type checking

### 11.6 Implementation Checklist

- [ ] Create schema definition file
- [ ] Implement type generator
- [ ] Add build process integration
- [ ] Set up schema validation
- [ ] Update existing components
- [ ] Add type checking
- [ ] Implement error handling
- [ ] Add documentation
- [ ] Set up CI/CD checks
- [ ] Monitor schema changes

## 12. Version Conflict Handling

### 12.1 Enhanced Save Hook

```typescript
// src/hooks/useDebouncedSave.ts
import { useCallback, useRef, useState } from "react";
import { useFlraForm } from "../contexts/FlraFormContext";
import { useToast } from "../hooks/useToast";
import { ModuleKey, ModuleData } from "../types/generated/formTypes";

interface SaveState<T extends ModuleKey> {
  isSaving: boolean;
  lastSavedAt: string | null;
  error: Error | null;
  version: number;
  pendingChanges: ModuleData[T] | null;
}

export function useDebouncedSave<T extends ModuleKey>(
  moduleKey: T,
  delay = 1000
) {
  const { state, actions } = useFlraForm();
  const { showToast } = useToast();
  const [saveState, setSaveState] = useState<SaveState<T>>({
    isSaving: false,
    lastSavedAt: null,
    error: null,
    version: state.formVersion,
    pendingChanges: null,
  });

  const saveQueue = useRef<Map<string, SaveFieldsParams<T>>>(new Map());

  const fetchLatestVersion = useCallback(async () => {
    try {
      const response = await fetch(`/api/forms/${state.formId}/version`);
      const { version, data } = await response.json();

      actions.setFormVersion(version);
      setSaveState((prev) => ({
        ...prev,
        version,
        pendingChanges: data[moduleKey] as ModuleData[T],
      }));

      return { version, data };
    } catch (error) {
      console.error("Failed to fetch latest version:", error);
      throw error;
    }
  }, [state.formId, moduleKey, actions]);

  const handleVersionConflict = useCallback(async () => {
    const { version, data } = await fetchLatestVersion();

    showToast({
      type: "warning",
      message:
        "This section was modified elsewhere. Your changes were not saved.",
      action: {
        label: "View Changes",
        onClick: () => {
          // Show diff modal or navigate to changes
          console.log("Show changes:", {
            current: saveState.pendingChanges,
            latest: data[moduleKey],
          });
        },
      },
    });

    return { version, data };
  }, [fetchLatestVersion, showToast, moduleKey, saveState.pendingChanges]);

  const save = useCallback(
    async (data: ModuleData[T]) => {
      setSaveState((prev) => ({
        ...prev,
        isSaving: true,
        error: null,
        pendingChanges: data,
      }));

      try {
        const response = await fetch("/api/forms/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: state.formId,
            moduleKey,
            data,
            version: saveState.version,
          }),
        });

        if (response.status === 409) {
          const { version, data: latestData } = await handleVersionConflict();
          return { success: false, version, data: latestData };
        }

        if (!response.ok) {
          throw new Error(`Failed to save: ${response.statusText}`);
        }

        const result = await response.json();

        setSaveState((prev) => ({
          ...prev,
          isSaving: false,
          lastSavedAt: new Date().toISOString(),
          version: result.version,
          pendingChanges: null,
        }));

        actions.setFormVersion(result.version);
        return { success: true, version: result.version };
      } catch (error) {
        setSaveState((prev) => ({
          ...prev,
          isSaving: false,
          error: error as Error,
        }));

        showToast({
          type: "error",
          message: "Failed to save changes. Will retry automatically.",
        });

        throw error;
      }
    },
    [
      state.formId,
      moduleKey,
      saveState.version,
      actions,
      showToast,
      handleVersionConflict,
    ]
  );

  return {
    save,
    saveState,
    fetchLatestVersion,
  };
}
```

### 12.2 Version Conflict UI

```typescript
// src/components/VersionConflictModal.tsx
import React from "react";
import { diff } from "deep-object-diff";

interface VersionConflictModalProps {
  current: any;
  latest: any;
  onResolve: (resolution: "keep" | "overwrite" | "merge") => void;
  onClose: () => void;
}

export function VersionConflictModal({
  current,
  latest,
  onResolve,
  onClose,
}: VersionConflictModalProps) {
  const changes = diff(current, latest);

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Version Conflict Detected</h2>
        <p>
          This section was modified elsewhere. Choose how to resolve the
          conflict:
        </p>

        <div className="changes">
          <h3>Changes Made Elsewhere:</h3>
          <pre>{JSON.stringify(changes, null, 2)}</pre>
        </div>

        <div className="actions">
          <button onClick={() => onResolve("keep")}>Keep My Changes</button>
          <button onClick={() => onResolve("overwrite")}>
            Use Their Changes
          </button>
          <button onClick={() => onResolve("merge")}>Merge Changes</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
```

### 12.3 Version Check Service

```typescript
// src/services/forms/checkVersion.ts
import { createClient } from "@supabase/supabase-js";
import { TABLES } from "../../constants/database";

export async function checkVersion(formId: string): Promise<{
  version: number;
  data: Record<string, any>;
}> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );

  const { data, error } = await supabase
    .from(TABLES.formInstances)
    .select(
      `
      version,
      general_info (*),
      pre_job_checklist (*),
      ppe_checklist (*)
    `
    )
    .eq("id", formId)
    .single();

  if (error) throw error;

  return {
    version: data.version,
    data: {
      generalInfo: data.general_info,
      preJobChecklist: data.pre_job_checklist,
      ppeChecklist: data.ppe_checklist,
    },
  };
}
```

### 12.4 Benefits of Version Conflict Handling

1. **Data Consistency**

   - Prevents lost updates
   - Maintains data integrity
   - Handles concurrent modifications
   - Provides clear conflict resolution

2. **User Experience**

   - Clear conflict notifications
   - Visual diff of changes
   - Multiple resolution options
   - Automatic state synchronization

3. **Error Prevention**

   - Proactive version checking
   - Automatic conflict detection
   - Graceful error handling
   - Clear error messages

4. **Developer Experience**
   - Type-safe version handling
   - Reusable conflict resolution
   - Clear error boundaries
   - Easy to test

### 12.5 Implementation Checklist

- [ ] Implement version checking
- [ ] Add conflict detection
- [ ] Create conflict UI
- [ ] Add state synchronization
- [ ] Implement resolution options
- [ ] Add error handling
- [ ] Create version service
- [ ] Add tests
- [ ] Update documentation
- [ ] Monitor conflicts

## 13. Persistent Save Queue

### 13.1 Enhanced Save Queue Hook

```typescript
// src/hooks/useSaveQueue.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "./useToast";
import { ModuleKey, ModuleData } from "../types/generated/formTypes";

interface QueuedSave<T extends ModuleKey> {
  id: string;
  timestamp: string;
  params: {
    formId: string;
    moduleKey: T;
    data: ModuleData[T];
    version: number;
  };
  retryCount: number;
  lastError?: string;
}

interface SaveQueueState {
  isProcessing: boolean;
  queueLength: number;
  failedSaves: Set<string>;
  lastProcessed: string | null;
}

const STORAGE_KEY = "flra_save_queue";
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

export function useSaveQueue<T extends ModuleKey>() {
  const [state, setState] = useState<SaveQueueState>({
    isProcessing: false,
    queueLength: 0,
    failedSaves: new Set(),
    lastProcessed: null,
  });

  const queue = useRef<Map<string, QueuedSave<T>>>(new Map());
  const { showToast } = useToast();

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const persisted = localStorage.getItem(STORAGE_KEY);
      if (persisted) {
        const savedQueue = new Map(JSON.parse(persisted));
        queue.current = savedQueue;
        setState((prev) => ({
          ...prev,
          queueLength: savedQueue.size,
        }));
      }
    } catch (error) {
      console.error("Failed to load save queue:", error);
      showToast({
        type: "error",
        message: "Failed to restore saved changes. Some data may be lost.",
      });
    }
  }, [showToast]);

  // Persist queue to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...queue.current.entries()])
      );
    } catch (error) {
      console.error("Failed to persist save queue:", error);
    }
  }, [state.queueLength]);

  const processQueue = useCallback(async () => {
    if (state.isProcessing || queue.current.size === 0) return;

    setState((prev) => ({ ...prev, isProcessing: true }));

    for (const [id, save] of queue.current) {
      try {
        if (!navigator.onLine) {
          throw new Error("Offline");
        }

        const response = await fetch("/api/forms/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(save.params),
        });

        if (response.status === 409) {
          // Handle version conflict
          const { version, data } = await response.json();
          showToast({
            type: "warning",
            message:
              "Form was modified elsewhere. Retrying with latest version.",
          });
          save.params.version = version;
          continue;
        }

        if (!response.ok) {
          throw new Error(`Failed to save: ${response.statusText}`);
        }

        // Success - remove from queue
        queue.current.delete(id);
        setState((prev) => ({
          ...prev,
          queueLength: queue.current.size,
          lastProcessed: id,
          failedSaves: new Set(
            [...prev.failedSaves].filter((key) => key !== id)
          ),
        }));
      } catch (error) {
        console.error("Save failed:", error);

        // Update retry count
        save.retryCount++;
        save.lastError = (error as Error).message;

        if (save.retryCount >= MAX_RETRIES) {
          setState((prev) => ({
            ...prev,
            failedSaves: new Set([...prev.failedSaves, id]),
          }));
          showToast({
            type: "error",
            message: "Failed to save changes after multiple attempts.",
            action: {
              label: "Retry",
              onClick: () => processQueue(),
            },
          });
        } else {
          // Schedule retry
          setTimeout(() => processQueue(), RETRY_DELAY);
        }
      }
    }

    setState((prev) => ({ ...prev, isProcessing: false }));
  }, [state.isProcessing, showToast]);

  const addToQueue = useCallback(
    (params: QueuedSave<T>["params"]) => {
      const id = `${params.moduleKey}_${Date.now()}`;
      queue.current.set(id, {
        id,
        timestamp: new Date().toISOString(),
        params,
        retryCount: 0,
      });

      setState((prev) => ({
        ...prev,
        queueLength: queue.current.size,
      }));

      // Start processing if not already
      if (!state.isProcessing) {
        processQueue();
      }
    },
    [state.isProcessing, processQueue]
  );

  const clearQueue = useCallback(() => {
    queue.current.clear();
    localStorage.removeItem(STORAGE_KEY);
    setState({
      isProcessing: false,
      queueLength: 0,
      failedSaves: new Set(),
      lastProcessed: null,
    });
  }, []);

  // Listen for online status
  useEffect(() => {
    const handleOnline = () => {
      if (queue.current.size > 0) {
        processQueue();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [processQueue]);

  return {
    addToQueue,
    clearQueue,
    processQueue,
    state,
  };
}
```

### 13.2 Queue Status Component

```typescript
// src/components/SaveQueueStatus.tsx
import React from "react";
import { useSaveQueue } from "../hooks/useSaveQueue";

export function SaveQueueStatus() {
  const { state, processQueue, clearQueue } = useSaveQueue();

  if (state.queueLength === 0) return null;

  return (
    <div className="save-queue-status">
      {!navigator.onLine && (
        <div className="offline-warning">
          <span>
            You are offline. Changes will be saved when you're back online.
          </span>
        </div>
      )}

      {state.queueLength > 0 && (
        <div className="queue-info">
          <span>{state.queueLength} changes pending</span>
          {state.isProcessing && <span className="processing">Saving...</span>}
        </div>
      )}

      {state.failedSaves.size > 0 && (
        <div className="failed-saves">
          <span>{state.failedSaves.size} saves failed</span>
          <button onClick={processQueue}>Retry Failed Saves</button>
        </div>
      )}

      <button onClick={clearQueue} className="clear-queue">
        Clear Queue
      </button>
    </div>
  );
}
```

### 13.3 Benefits of Persistent Queue

1. **Data Safety**

   - Survives page reloads
   - Handles offline scenarios
   - Prevents data loss
   - Maintains save order

2. **User Experience**

   - Clear queue status
   - Offline indicators
   - Retry options
   - Progress feedback

3. **Error Handling**

   - Automatic retries
   - Error persistence
   - Clear error messages
   - Recovery options

4. **Performance**
   - Efficient storage
   - Batch processing
   - Optimized retries
   - Minimal overhead

### 13.4 Implementation Checklist

- [ ] Implement persistent queue
- [ ] Add queue status UI
- [ ] Handle offline scenarios
- [ ] Add retry mechanism
- [ ] Implement error handling
- [ ] Add queue management
- [ ] Create status component
- [ ] Add tests
- [ ] Update documentation
- [ ] Monitor queue performance

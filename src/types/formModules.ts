export interface ModuleField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: {
    severity?: "low" | "medium" | "high";
    category?: string;
  };
}

export interface TaskHazardData {
  task: string;
  hazards: HazardState[];
  validation: ValidationState;
}

export interface HazardState {
  id: string;
  hazard: string;
  riskLevelBefore: number;
  control: string;
  riskLevelAfter: number;
  acknowledged: boolean;
}

export interface ValidationState {
  task: boolean;
  hazards: {
    [key: string]: {
      hazard: boolean;
      control: boolean;
      riskLevelAfter: boolean;
    };
  };
}

export interface ValidationResult {
  isValid: boolean;
  validationState: ValidationState;
  errors: {
    task?: string;
    hazards?: {
      [key: string]: {
        hazard?: string;
        control?: string;
        riskLevelAfter?: string;
      };
    };
  };
}

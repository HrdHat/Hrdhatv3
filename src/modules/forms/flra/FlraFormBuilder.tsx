/**
 * FLRA Form Builder Component
 *
 * This is the main component for creating and editing FLRA (Field Level Risk Assessment) forms.
 * It manages the form state and coordinates between different form modules.
 *
 * Key Features:
 * - Generates and maintains stable form IDs for the session
 * - Creates database records for new forms
 * - Manages form state across multiple modules
 * - Handles photo uploads with proper form association
 * - Coordinates user signatures
 *
 * Form Modules:
 * - Header (form metadata)
 * - General Information
 * - Pre-Job Task Checklist
 * - PPE Equipment Checklist
 * - Task Hazard Control
 * - Photos
 * - Signatures
 */

import React, { useState, useEffect } from "react";
import FlraHeaderModule from "../../formmodules/FlraHeaderModule";
import GeneralInformationModule from "../../formmodules/GeneralInformationModule";
import PreJobTaskChecklistModule from "../../formmodules/PreJobTaskChecklistModule";
import PpeEquipmentChecklistModule from "../../formmodules/PpeEquipmentChecklistModule";
import TaskHazardControlModule from "../../formmodules/TaskHazardControlModule";
import FlraPhotosModule from "../../formmodules/FlraPhotosModule";
import SignaturesModule from "../../formmodules/SignaturesModule";
import { FlraFormState } from "../../../types/formTypes";
import { useAuth } from "../../../session/AuthProvider";
import { ensureFormRowExists } from "../../../services/forms/createOrUpdateForm";
import { moduleMap } from "./moduleMap";

// TEMPORARY: Bridge solution until full form saving is implemented
// This function generates a stable form ID that will be used to organize photos
// during the current form creation session. It will be replaced by proper database IDs
// when the full form saving functionality is implemented.
const generateFormId = () => {
  return `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const initialState: FlraFormState = {
  header: {},
  general: {},
  preJobChecklist: {},
  ppeChecklist: {},
  taskHazards: [],
  photos: [],
  signatures: [],
  status: "draft",
  // TEMPORARY: Bridge solution IDs
  // These IDs ensure photos stay organized during form creation
  // They will be replaced by proper database IDs when saving is implemented
  formId: generateFormId(),
  photosModuleId: `photos_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`,
};

type ModuleKey = keyof typeof moduleMap;

const moduleOrder: ModuleKey[] = [
  "header",
  "general",
  "preJobChecklist",
  "ppeChecklist",
  "taskHazards",
  "photos",
  "signatures",
];

const FlraFormBuilder: React.FC = () => {
  const [formState, setFormState] = useState<FlraFormState>(initialState);
  const { user } = useAuth();

  // Add this useEffect to create the form row when the component mounts
  useEffect(() => {
    if (user?.id && formState.formId) {
      ensureFormRowExists(formState.formId, user.id);
    }
  }, [user?.id, formState.formId]);

  // TEMPORARY: Using formId from state instead of generating it on each render
  // This ensures photos stay connected to the same form during the session
  // Will be replaced by proper database IDs when saving is implemented
  if (!formState.formId || !formState.photosModuleId) {
    throw new Error("FormBuilder missing stable ID. Something is wrong.");
  }

  // These IDs will be replaced by Supabase UUIDs when saving is implemented
  const formId = formState.formId;
  const photosModuleId = formState.photosModuleId;

  return (
    <div>
      <h1>Create New FLRA</h1>
      {moduleOrder.map((key) => {
        const ModuleComponent = moduleMap[key];
        if (!ModuleComponent) return null;
        const props: any = {};
        switch (key) {
          case "header":
            props.value = formState.header;
            props.onChange = (header: any) => setFormState((s) => ({ ...s, header }));
            break;
          case "general":
            props.value = formState.general;
            props.onChange = (general: any) => setFormState((s) => ({ ...s, general }));
            break;
          case "preJobChecklist":
            props.value = formState.preJobChecklist;
            props.onChange = (preJobChecklist: any) => setFormState((s) => ({ ...s, preJobChecklist }));
            break;
          case "ppeChecklist":
            props.value = formState.ppeChecklist;
            props.onChange = (ppeChecklist: any) => setFormState((s) => ({ ...s, ppeChecklist }));
            break;
          case "taskHazards":
            props.value = formState.taskHazards;
            props.onChange = (taskHazards: any) => setFormState((s) => ({ ...s, taskHazards }));
            break;
          case "photos":
            props.value = formState.photos;
            props.onChange = (photos: any) => setFormState((s) => ({ ...s, photos }));
            props.formId = formId;
            props.formModuleId = photosModuleId;
            props.uploadedBy = user?.id || "";
            break;
          case "signatures":
            props.value = formState.signatures;
            props.onChange = (signatures: any) => setFormState((s) => ({ ...s, signatures }));
            props.formId = formId;
            break;
          default:
            // Only access keys that exist on formState
            if (key in formState) {
              props.value = (formState as any)[key];
              props.onChange = (val: any) => setFormState((s) => ({ ...s, [key]: val }));
            }
        }
        return <ModuleComponent key={key} {...props} />;
      })}
    </div>
  );
};

export default FlraFormBuilder;

import React, { useState, useEffect, useRef } from "react";
import FlraHeaderModule from "../../formmodules/FlraHeaderModule";
import GeneralInformationModule from "../../formmodules/GeneralInformationModule";
import PreJobTaskChecklistModule from "../../formmodules/PreJobTaskChecklistModule";
import PpeEquipmentChecklistModule from "../../formmodules/PpeEquipmentChecklistModule";
import TaskHazardControlModule from "../../formmodules/TaskHazardControlModule";
import FlraPhotosModule from "../../formmodules/FlraPhotosModule";
import SignaturesModule from "../../formmodules/SignaturesModule";
import { FlraFormState } from "../../../types/formTypes";

const LOCAL_STORAGE_KEY = "flra_draft";

const initialState: FlraFormState = {
  header: {},
  general: {},
  preJobChecklist: {},
  ppeChecklist: {},
  taskHazards: [],
  photos: [],
  signatures: [],
  status: "draft",
};

const FlraFormBuilder: React.FC = () => {
  const [formState, setFormState] = useState<FlraFormState>(initialState);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormState(parsed);
        // console.log("Loaded FLRA draft from localStorage:", parsed);
      } catch (e) {
        // console.log("Failed to parse FLRA draft from localStorage");
      }
    }
  }, []);

  // Autosave to localStorage on state change (debounced)
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formState));
      // console.log("Saved FLRA draft to localStorage:", formState);
    }, 500);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [formState]);

  // Uncomment for debugging
  // console.log("FLRA Form State:", formState);

  return (
    <div>
      <h1>Create New FLRA</h1>
      {/* Pass state and setters as needed to each module */}
      <FlraHeaderModule
        value={formState.header}
        onChange={header => setFormState(s => ({ ...s, header }))}
      />
      <GeneralInformationModule
        value={formState.general}
        onChange={general => setFormState(s => ({ ...s, general }))}
      />
      <PreJobTaskChecklistModule
        value={formState.preJobChecklist}
        onChange={preJobChecklist => setFormState(s => ({ ...s, preJobChecklist }))}
      />
      <PpeEquipmentChecklistModule
        value={formState.ppeChecklist}
        onChange={ppeChecklist => setFormState(s => ({ ...s, ppeChecklist }))}
      />
      <TaskHazardControlModule
        value={formState.taskHazards}
        onChange={taskHazards => setFormState(s => ({ ...s, taskHazards }))}
      />
      <FlraPhotosModule
        value={formState.photos}
        onChange={photos => setFormState(s => ({ ...s, photos }))}
      />
      <SignaturesModule
        value={formState.signatures}
        onChange={signatures => setFormState(s => ({ ...s, signatures }))}
      />
    </div>
  );
};

export default FlraFormBuilder; 
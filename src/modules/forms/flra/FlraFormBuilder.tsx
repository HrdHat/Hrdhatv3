import React, { useState } from "react";
import FlraHeaderModule from "../../formmodules/FlraHeaderModule";
import GeneralInformationModule from "../../formmodules/GeneralInformationModule";
import PreJobTaskChecklistModule from "../../formmodules/PreJobTaskChecklistModule";
import PpeEquipmentChecklistModule from "../../formmodules/PpeEquipmentChecklistModule";
import TaskHazardControlModule from "../../formmodules/TaskHazardControlModule";
import FlraPhotosModule from "../../formmodules/FlraPhotosModule";
import SignaturesModule from "../../formmodules/SignaturesModule";
import { FlraFormState } from "../../../types/formTypes";

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
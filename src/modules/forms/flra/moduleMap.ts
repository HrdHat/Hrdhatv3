import FlraHeaderModule from "../../formmodules/FlraHeaderModule";
import GeneralInformationModule from "../../formmodules/GeneralInformationModule";
import PreJobTaskChecklistModule from "../../formmodules/PreJobTaskChecklistModule";
import PpeEquipmentChecklistModule from "../../formmodules/PpeEquipmentChecklistModule";
import TaskHazardControlModule from "../../formmodules/TaskHazardControlModule";
import FlraPhotosModule from "../../formmodules/FlraPhotosModule";
import SignaturesModule from "../../formmodules/SignaturesModule";

export const moduleMap = {
  header: FlraHeaderModule,
  general: GeneralInformationModule,
  preJobChecklist: PreJobTaskChecklistModule,
  ppeChecklist: PpeEquipmentChecklistModule,
  taskHazards: TaskHazardControlModule,
  photos: FlraPhotosModule,
  signatures: SignaturesModule,
}; 
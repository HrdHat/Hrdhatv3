import React from "react";
import { PreJobTaskChecklist } from "../../../types/formTypes";

type Props = {
  value: PreJobTaskChecklist;
  onChange: (checklist: PreJobTaskChecklist) => void;
};

const checklistItems = [
  { key: "is_fit_for_duty", label: "Is fit for duty" },
  { key: "reviewed_work_area_for_hazards", label: "Reviewed work area for hazards" },
  { key: "required_ppe_for_today", label: "Required PPE for today" },
  { key: "equipment_inspection_up_to_date", label: "Equipment inspection up to date" },
  { key: "completed_flra_hazard_assessment", label: "Completed FLRA hazard assessment" },
  { key: "safety_signage_installed_and_checked", label: "Safety signage installed and checked" },
  { key: "working_alone_today", label: "Working alone today" },
  { key: "required_permits_for_tasks", label: "Required permits for tasks" },
  { key: "barricades_signage_barriers_installed_good", label: "Barricades/signage/barriers installed and good" },
  { key: "clear_access_to_emergency_exits", label: "Clear access to emergency exits" },
  { key: "trained_and_competent_for_tasks", label: "Trained and competent for tasks" },
  { key: "inspected_tools_and_equipment", label: "Inspected tools and equipment" },
  { key: "reviewed_control_measures_needed", label: "Reviewed control measures needed" },
  { key: "reviewed_emergency_procedures", label: "Reviewed emergency procedures" },
  { key: "all_required_permits_in_place", label: "All required permits in place" },
  { key: "communicated_with_crew_about_plan", label: "Communicated with crew about plan" },
  { key: "need_for_spotters_barricades_special_controls", label: "Need for spotters/barricades/special controls" },
  { key: "weather_suitable_for_work", label: "Weather suitable for work" },
  { key: "know_designated_first_aid_attendant", label: "Know designated first aid attendant" },
  { key: "aware_of_site_notices_or_bulletins", label: "Aware of site notices or bulletins" },
];

const PreJobTaskChecklistModule: React.FC<Props> = ({ value, onChange }) => {
  // console.log("PreJobTaskChecklistModule value:", value);
  const handleChange = (key: string) => {
    onChange({ ...value, [key]: !value[key as keyof PreJobTaskChecklist] });
  };

  return (
    <section>
      <h2>Pre Job/Task Checklist</h2>
      <div>
        {checklistItems.map(item => (
          <label key={item.key}>
            <input
              type="checkbox"
              checked={!!value[item.key as keyof PreJobTaskChecklist]}
              onChange={() => handleChange(item.key)}
            />
            {item.label}
          </label>
        ))}
      </div>
    </section>
  );
};

export default PreJobTaskChecklistModule; 
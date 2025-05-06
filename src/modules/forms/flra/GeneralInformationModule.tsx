import React from "react";
import { GeneralInformation } from "../../../types/formTypes";

type Props = {
  value: GeneralInformation;
  onChange: (general: GeneralInformation) => void;
};

const GeneralInformationModule: React.FC<Props> = ({ value, onChange }) => {
  // console.log("GeneralInformationModule value:", value);
  return (
    <section>
      <h2>General Information</h2>
      <div>
        <label>
          Project Name:
          <input
            type="text"
            value={value.project_name || ""}
            onChange={e => onChange({ ...value, project_name: e.target.value })}
          />
        </label>
        <label>
          Project Address:
          <input
            type="text"
            value={value.project_address || ""}
            onChange={e => onChange({ ...value, project_address: e.target.value })}
          />
        </label>
        <label>
          Task Location:
          <input
            type="text"
            value={value.task_location || ""}
            onChange={e => onChange({ ...value, task_location: e.target.value })}
          />
        </label>
        <label>
          Supervisor Name:
          <input
            type="text"
            value={value.supervisor_name || ""}
            onChange={e => onChange({ ...value, supervisor_name: e.target.value })}
          />
        </label>
        <label>
          Supervisor Contact:
          <input
            type="text"
            value={value.supervisor_contact || ""}
            onChange={e => onChange({ ...value, supervisor_contact: e.target.value })}
          />
        </label>
        <label>
          Date:
          <input
            type="date"
            value={value.date || ""}
            onChange={e => onChange({ ...value, date: e.target.value })}
          />
        </label>
        <label>
          Crew Members Count:
          <input
            type="number"
            value={value.crew_members_count ?? ""}
            onChange={e => onChange({ ...value, crew_members_count: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </label>
        <label>
          Task Description:
          <textarea
            value={value.task_description || ""}
            onChange={e => onChange({ ...value, task_description: e.target.value })}
          />
        </label>
        <label>
          Start Time:
          <input
            type="time"
            value={value.start_time || ""}
            onChange={e => onChange({ ...value, start_time: e.target.value })}
          />
        </label>
        <label>
          End Time:
          <input
            type="time"
            value={value.end_time || ""}
            onChange={e => onChange({ ...value, end_time: e.target.value })}
          />
        </label>
      </div>
    </section>
  );
};

export default GeneralInformationModule; 
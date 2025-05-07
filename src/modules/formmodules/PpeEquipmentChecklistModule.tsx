import React from "react";
import { PpeEquipmentChecklist } from "../../types/formTypes";

type Props = {
  value: PpeEquipmentChecklist;
  onChange: (ppe: PpeEquipmentChecklist) => void;
};

const ppeItems = [
  { key: "ppe_hardhat", label: "Hardhat" },
  { key: "ppe_safety_vest", label: "Safety Vest" },
  { key: "ppe_safety_glasses", label: "Safety Glasses" },
  { key: "ppe_fall_protection", label: "Fall Protection" },
  { key: "ppe_coveralls", label: "Coveralls" },
  { key: "ppe_gloves", label: "Gloves" },
  { key: "ppe_mask", label: "Mask" },
  { key: "ppe_respirator", label: "Respirator" },
  { key: "platform_ladder", label: "Ladder" },
  { key: "platform_step_bench", label: "Step Bench" },
  { key: "platform_sawhorses", label: "Sawhorses" },
  { key: "platform_baker_scaffold", label: "Baker Scaffold" },
  { key: "platform_scaffold", label: "Scaffold" },
  { key: "platform_scissor_lift", label: "Scissor Lift" },
  { key: "platform_boom_lift", label: "Boom Lift" },
  { key: "platform_swing_stage", label: "Swing Stage" },
  { key: "platform_hydro_lift", label: "Hydro Lift" },
];

const PpeEquipmentChecklistModule: React.FC<Props> = ({ value, onChange }) => {
  // console.log("PpeEquipmentChecklistModule value:", value);
  const handleChange = (key: string) => {
    onChange({ ...value, [key]: !value[key as keyof PpeEquipmentChecklist] });
  };

  return (
    <section>
      <h2>PPE & Equipment Checklist</h2>
      <div>
        {ppeItems.map(item => (
          <label key={item.key}>
            <input
              type="checkbox"
              checked={!!value[item.key as keyof PpeEquipmentChecklist]}
              onChange={() => handleChange(item.key)}
            />
            {item.label}
          </label>
        ))}
      </div>
    </section>
  );
};

export default PpeEquipmentChecklistModule; 
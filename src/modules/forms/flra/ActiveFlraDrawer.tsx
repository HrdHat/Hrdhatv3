import React, { useState } from "react";
import CloseDrawerButton from "../../../components/shared/CloseDrawerButton";

// Dummy data for scaffold; replace with real data from Supabase/service
const DUMMY_FLRAS = [
  { id: "1", name: "FLRA #1", isActive: true },
  { id: "2", name: "FLRA #2", isActive: false },
  { id: "3", name: "FLRA #3", isActive: false },
];

interface ActiveFlraDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActiveFlraDrawer: React.FC<ActiveFlraDrawerProps> = ({ isOpen, onClose }) => {
  const [flras, setFlras] = useState(DUMMY_FLRAS);
  const [openFormId, setOpenFormId] = useState("1"); // Assume "1" is open
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingSwitchId, setPendingSwitchId] = useState<string | null>(null);

  // Delete handler with confirmation
  const handleDelete = (id: string) => {
    // console.log(`Prompting delete for FLRA id: ${id}`);
    setPendingDeleteId(id);
  };
  const confirmDelete = () => {
    // console.log(`Confirmed delete for FLRA id: ${pendingDeleteId}`);
    setFlras(flras.filter(f => f.id !== pendingDeleteId));
    setPendingDeleteId(null);
    // TODO: Call service to delete from DB
  };
  const cancelDelete = () => {
    // console.log('Cancelled delete');
    setPendingDeleteId(null);
  };

  // Switch handler with confirmation if a form is already open
  const handleSwitch = (id: string) => {
    // console.log(`Attempting to switch to FLRA id: ${id}`);
    if (openFormId && openFormId !== id) {
      // console.log('Prompting switch confirmation');
      setPendingSwitchId(id);
    } else {
      // console.log(`Switched to FLRA id: ${id}`);
      setOpenFormId(id);
      // TODO: Save as active in DB/local storage
    }
  };
  const confirmSwitch = () => {
    // console.log(`Confirmed switch to FLRA id: ${pendingSwitchId}`);
    if (pendingSwitchId) {
      // TODO: Save current form as active in DB/local storage
      setOpenFormId(pendingSwitchId);
      setPendingSwitchId(null);
    }
  };
  const cancelSwitch = () => {
    // console.log('Cancelled switch');
    setPendingSwitchId(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside>
      <div>
        <h3>Active FLRAs</h3>
        <CloseDrawerButton onClick={onClose} />
      </div>
      <ul>
        {flras.map(flra => (
          <li key={flra.id}>
            <span>
              {flra.name}
              {flra.id === openFormId && " (Open)"}
            </span>
            <button onClick={() => handleSwitch(flra.id)} disabled={flra.id === openFormId}>
              {flra.id === openFormId ? "Active" : "Switch"}
            </button>
            <button onClick={() => handleDelete(flra.id)}>Delete</button>
          </li>
        ))}
      </ul>

      {/* Delete confirmation prompt */}
      {pendingDeleteId && (
        <div>
          <p>Are you sure you want to delete this FLRA?</p>
          <button onClick={confirmDelete}>Yes, Delete</button>
          <button onClick={cancelDelete}>Cancel</button>
        </div>
      )}

      {/* Switch confirmation prompt */}
      {pendingSwitchId && (
        <div>
          <p>
            You have a form already open. Do you want to switch? (Current form will be saved as active.)
          </p>
          <button onClick={confirmSwitch}>Yes, Switch</button>
          <button onClick={cancelSwitch}>Cancel</button>
        </div>
      )}
    </aside>
  );
};

export default ActiveFlraDrawer; 
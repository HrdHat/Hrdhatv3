import React from "react";

interface CloseDrawerButtonProps {
  onClick: () => void;
  label?: string; // For accessibility
}

const CloseDrawerButton: React.FC<CloseDrawerButtonProps> = ({ onClick, label = "Close" }) => (
  <button type="button" onClick={onClick} aria-label={label}>
    X
  </button>
);

export default CloseDrawerButton; 
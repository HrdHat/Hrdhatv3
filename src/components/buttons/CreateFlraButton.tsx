import React from "react";

interface CreateFlraButtonProps {
  children?: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
}

const CreateFlraButton: React.FC<CreateFlraButtonProps> = ({
  children,
  onClick,
  loading = false,
}) => {
  return (
    <button onClick={onClick} disabled={loading}>
      {loading ? "Creating..." : children || "Create New FLRA"}
    </button>
  );
};

export default CreateFlraButton;

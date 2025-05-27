import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CloseDrawerButton from "../../../components/shared/CloseDrawerButton";
import { useActiveForms } from "../../../hooks/useActiveForms";
import toast from "react-hot-toast";

interface ActiveFlraDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActiveFormInstanceDrawer: React.FC<ActiveFlraDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { forms, isLoading, error, refresh, deleteForm, createForm } =
    useActiveForms();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Refresh forms list whenever drawer opens
  React.useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, refresh]);

  // Delete handler with confirmation
  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    setIsDeleting(true);
    try {
      const result = await deleteForm(pendingDeleteId);

      if (result.success) {
        toast.success("Form deleted successfully!");
      } else {
        toast.error(result.error || "Failed to delete form");
      }
    } catch (err) {
      toast.error("Failed to delete form");
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
  };

  // Create new form handler
  const handleCreateForm = async () => {
    if (forms.length >= 5) {
      toast.error(
        "Maximum of 5 active forms allowed. Please delete a form first."
      );
      return;
    }

    setIsCreating(true);
    try {
      const result = await createForm(
        "New FLRA",
        "Created from Active Forms drawer"
      );

      if (result.success && result.form) {
        toast.success("Form created successfully!");
        navigate(`/forms/${result.form.id}`);
        onClose();
      } else {
        toast.error(result.error || "Failed to create form");
      }
    } catch (err) {
      toast.error("Failed to create form");
    } finally {
      setIsCreating(false);
    }
  };

  // Open form handler
  const handleOpenForm = (formId: string) => {
    navigate(`/forms/${formId}`);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside>
      <div>
        <h3>Active FLRAs ({forms.length}/5)</h3>
        <CloseDrawerButton onClick={onClose} />
      </div>

      {/* New Form Button */}
      <div style={{ padding: "1rem", borderBottom: "1px solid #eee" }}>
        <button
          onClick={handleCreateForm}
          disabled={forms.length >= 5 || isCreating || isLoading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: forms.length >= 5 ? "#6c757d" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: forms.length >= 5 ? "not-allowed" : "pointer",
            fontSize: "1rem",
          }}
        >
          {isCreating
            ? "Creating..."
            : forms.length >= 5
            ? "Max Forms Reached (5/5)"
            : "Create New FLRA"}
        </button>
        {forms.length >= 5 && (
          <small
            style={{ color: "#dc3545", display: "block", marginTop: "0.5rem" }}
          >
            Delete a form to create a new one
          </small>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ padding: "1rem", textAlign: "center" }}>
          Loading forms...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ padding: "1rem", color: "red" }}>
          Error: {error}
          <button onClick={refresh} style={{ marginLeft: "0.5rem" }}>
            Retry
          </button>
        </div>
      )}

      {/* Forms List */}
      {!isLoading && !error && (
        <>
          {forms.length === 0 ? (
            <div
              style={{ padding: "1rem", textAlign: "center", color: "#666" }}
            >
              No active forms. Create your first FLRA!
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {forms.map((form) => (
                <li
                  key={form.id}
                  style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}
                >
                  <div style={{ marginBottom: "0.5rem" }}>
                    <strong>{form.title}</strong>
                    <br />
                    <small>
                      {form.form_number} • {form.status} •{" "}
                      {new Date(form.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <div>
                    <button
                      onClick={() => handleOpenForm(form.id)}
                      style={{
                        marginRight: "0.5rem",
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                      }}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleDelete(form.id)}
                      disabled={isDeleting}
                      style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Delete confirmation prompt */}
      {pendingDeleteId && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            zIndex: 1000,
          }}
        >
          <p>Are you sure you want to delete this FLRA?</p>
          <div>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              style={{
                marginRight: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
              }}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </button>
            <button
              onClick={cancelDelete}
              disabled={isDeleting}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ActiveFormInstanceDrawer;

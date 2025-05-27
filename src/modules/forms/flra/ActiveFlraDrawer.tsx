import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CloseDrawerButton from "../../../components/shared/CloseDrawerButton";
import { useActiveForms } from "./useActiveForms";
import toast from "react-hot-toast";

interface ActiveFlraDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActiveFormInstanceDrawer: React.FC<ActiveFlraDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { forms, isLoading, error, refresh, deleteForm } =
    useActiveForms();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract the current open formId from the route, e.g. /flra/:formId
  const match = location.pathname.match(/\/flra\/([^/]+)/);
  const currentOpenFormId = match ? match[1] : null;

  // Refresh forms list whenever drawer opens
  React.useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, refresh]);

  // Also refresh when the drawer is open and the window regains focus
  React.useEffect(() => {
    if (!isOpen) return;
    const handleFocus = () => {
      refresh();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isOpen, refresh]);

  // Delete handler with confirmation
  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    const isOpenForm = pendingDeleteId === currentOpenFormId;
    let confirmed = true;

    if (isOpenForm) {
      confirmed = window.confirm(
        "This form is currently open. Are you sure you want to delete it? It will be closed."
      );
      if (!confirmed) {
        setPendingDeleteId(null);
        return;
      }
    }

    setIsDeleting(true);
    try {
      const result = await deleteForm(pendingDeleteId);

      if (result.success) {
        toast.success("Form deleted successfully!");
        // After deletion, if it was open, navigate away
        if (isOpenForm) {
          navigate("/home"); // Navigate to home page instead of root
        }
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

  // Open form handler
  const handleOpenForm = (formId: string) => {
    navigate(`/flra/${formId}`);
    onClose();
  };

  // Memoize the forms list rendering
  const formsList = useMemo(() => {
    if (isLoading || error) return null;
    if (forms.length === 0) {
      return (
        <div
          style={{ padding: "1rem", textAlign: "center", color: "#666" }}
        >
          No active forms. Create your first FLRA using the sidebar button!
        </div>
      );
    }
    return (
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
                {form.form_number} • {form.status} • {new Date(form.created_at).toLocaleDateString()}
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
    );
  }, [forms, isLoading, error, isDeleting]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside>
      <div>
        <h3>Active FLRAs ({forms.length}/5)</h3>
        <CloseDrawerButton onClick={onClose} />
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
      {formsList}

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

export default React.memo(ActiveFormInstanceDrawer);

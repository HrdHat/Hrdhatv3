import React from "react";
import { useActiveForms } from "../hooks/useActiveForms";

const TestActiveForms: React.FC = () => {
  const { forms, isLoading, error, refresh, createForm, deleteForm } =
    useActiveForms();

  const handleCreateTest = async () => {
    const result = await createForm(
      "Test FLRA Form",
      "Created for testing purposes"
    );
    if (result.success) {
      alert("Form created successfully!");
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDeleteTest = async (formId: string) => {
    if (confirm("Are you sure you want to delete this form?")) {
      const result = await deleteForm(formId);
      if (result.success) {
        alert("Form deleted successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Active Forms Test Page</h1>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleCreateTest} disabled={forms.length >= 5}>
          Create Test Form ({forms.length}/5)
        </button>
        <button onClick={refresh} style={{ marginLeft: "0.5rem" }}>
          Refresh
        </button>
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <div>
        <h2>Active Forms ({forms.length})</h2>
        {forms.length === 0 ? (
          <p>No active forms found.</p>
        ) : (
          <ul>
            {forms.map((form) => (
              <li
                key={form.id}
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  border: "1px solid #ccc",
                }}
              >
                <h3>{form.title}</h3>
                <p>
                  <strong>Form Number:</strong> {form.form_number}
                </p>
                <p>
                  <strong>Status:</strong> {form.status}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(form.created_at).toLocaleString()}
                </p>
                {form.description && (
                  <p>
                    <strong>Description:</strong> {form.description}
                  </p>
                )}
                <button
                  onClick={() => handleDeleteTest(form.id)}
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    padding: "0.5rem",
                    border: "none",
                    borderRadius: "3px",
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TestActiveForms;

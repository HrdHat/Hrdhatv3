import { useState, useEffect } from "react";
import { useAuth } from "../session/AuthProvider";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../components/shared/AuthForm";
import ActiveFlraDrawer from "../modules/forms/flra/ActiveFlraDrawer";
import {
  handleSignIn,
  handleSignUp,
  handleGoogleSignIn,
  handleAppleSignIn,
  checkPreviousSession,
  AuthFormData,
} from "../util/authUtils";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import CreateFlraButton from "../components/buttons/CreateFlraButton";
import { useCreateFlraForm } from "../hooks/useCreateFlraForm";

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const [hasPreviousSession, setHasPreviousSession] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { createNewFlra, loading: createLoading } = useCreateFlraForm();

  useEffect(() => {
    const initSession = async () => {
      try {
        const hasSession = await checkPreviousSession();
        setHasPreviousSession(hasSession);
      } catch (err) {
        console.error("Error checking session:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initSession();
  }, []);

  const handleAuthModeToggle = () => {
    setAuthMode((prev) => (prev === "signin" ? "signup" : "signin"));
    setError(null);
  };

  const handleSubmit = async (formData: AuthFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      if (authMode === "signin") {
        await handleSignIn(formData);
      } else {
        await handleSignUp(formData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewFlra = () => {
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    try {
      await createNewFlra();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create new FLRA");
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <aside>
      <nav>
        <ul>
          {isLoading ? (
            <li>Loading...</li>
          ) : user ? (
            <>
              <li>
                <CreateFlraButton
                  onClick={handleCreateNewFlra}
                  loading={createLoading}
                >
                  Create New FLRA
                </CreateFlraButton>
              </li>
              <li>
                <button type="button" onClick={() => setDrawerOpen(true)}>
                  Active FLRA
                </button>
              </li>
              <li>
                <Link to="/flra/archive">Archive</Link>
              </li>
              <li>
                <Link to="/forms/new">Create Other Forms</Link>
              </li>
              <li>
                <Link to="/settings">Account Settings</Link>
              </li>
              <li>
                <button onClick={signOut}>Logout</button>
              </li>
            </>
          ) : (
            <>
              <li>{hasPreviousSession ? "Welcome Back!" : "Welcome!"}</li>
              <li>
                <AuthForm
                  mode={authMode}
                  onModeToggle={handleAuthModeToggle}
                  onSubmit={handleSubmit}
                  onGoogleSignIn={handleGoogleSignIn}
                  onAppleSignIn={handleAppleSignIn}
                  isLoading={isLoading}
                  error={error}
                />
              </li>
            </>
          )}
        </ul>
      </nav>
      <ActiveFlraDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <ConfirmDialog
        open={showConfirm}
        message="Are you sure you want to start a new FLRA? Unsaved changes will be lost."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </aside>
  );
};

export default Sidebar;

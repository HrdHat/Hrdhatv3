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

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const [hasPreviousSession, setHasPreviousSession] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

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

  const handleConfirm = () => {
    setShowConfirm(false);
    navigate("/flra/new");
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  // Style for button-as-link
  const buttonLinkStyle = {
    background: "none",
    border: "none",
    color: "blue",
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
    font: "inherit"
  } as React.CSSProperties;

  return (
    <aside>
      <nav>
        <ul>
          {isLoading ? (
            <li>Loading...</li>
          ) : user ? (
            <>
              <li>
                <button style={buttonLinkStyle} onClick={handleCreateNewFlra}>
                  Create New FLRA
                </button>
              </li>
              <li>
                <button style={buttonLinkStyle} type="button" onClick={() => setDrawerOpen(true)}>
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
                <button style={buttonLinkStyle} onClick={signOut}>Logout</button>
              </li>
            </>
          ) : (
            <>
              <li className="welcome-message">
                {hasPreviousSession ? "Welcome Back!" : "Welcome!"}
              </li>
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
      <ActiveFlraDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
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

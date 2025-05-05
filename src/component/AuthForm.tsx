import { useState } from "react";
import {
  AuthFormData,
  initialFormData,
  validateForm,
  ValidationErrors,
} from "../util/authUtils";

interface AuthFormProps {
  mode: "signin" | "signup";
  onModeToggle: () => void;
  onSubmit: (formData: AuthFormData) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onAppleSignIn: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthForm = ({
  mode,
  onModeToggle,
  onSubmit,
  onGoogleSignIn,
  onAppleSignIn,
  isLoading,
  error,
}: AuthFormProps) => {
  const [formData, setFormData] = useState<AuthFormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData, mode);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    await onSubmit(formData);
  };

  const renderField = (
    name: keyof AuthFormData,
    type: string,
    placeholder: string,
    required: boolean = false
  ) => (
    <div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={type === "checkbox" ? undefined : (formData[name] as string)}
        checked={type === "checkbox" ? (formData[name] as boolean) : undefined}
        onChange={handleChange}
        required={required}
        disabled={isLoading}
      />
      {fieldErrors[name] && (
        <div style={{ color: "red", fontSize: "0.8em", marginTop: "4px" }}>
          {fieldErrors[name]}
        </div>
      )}
    </div>
  );

  return (
    <>
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            {renderField("full_name", "text", "Full Name *", true)}
            {renderField("phone_number", "tel", "Phone Number")}
            {renderField("company", "text", "Company")}
            {renderField("position_title", "text", "Position Title")}
          </>
        )}

        {renderField("email", "email", "Email *", true)}
        {renderField("password", "password", "Password *", true)}

        {mode === "signup" &&
          renderField(
            "confirmPassword",
            "password",
            "Confirm Password *",
            true
          )}

        <div>
          <label>
            <input
              type="checkbox"
              name="savePassword"
              checked={formData.savePassword}
              onChange={handleChange}
              disabled={isLoading}
            />
            Save Password
          </label>
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading
            ? mode === "signin"
              ? "Signing In..."
              : "Creating Account..."
            : mode === "signin"
            ? "Sign In"
            : "Create Account"}
        </button>
      </form>

      <button onClick={onGoogleSignIn} disabled={isLoading}>
        {isLoading ? "Loading..." : "Login with Google"}
      </button>

      <button onClick={onAppleSignIn} disabled={isLoading}>
        {isLoading ? "Loading..." : "Login with Apple"}
      </button>

      <button
        onClick={onModeToggle}
        disabled={isLoading}
        style={{
          background: "none",
          border: "none",
          color: "blue",
          cursor: "pointer",
        }}
      >
        {mode === "signin"
          ? "Need an account? Sign Up"
          : "Already have an account? Sign In"}
      </button>
    </>
  );
};

export default AuthForm;

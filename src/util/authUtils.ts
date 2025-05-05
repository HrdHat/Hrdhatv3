import { supabase } from "../db/supabaseClient";

export interface AuthFormData {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone_number: string;
  company: string;
  position_title: string;
  savePassword: boolean;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const initialFormData: AuthFormData = {
  full_name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone_number: "",
  company: "",
  position_title: "",
  savePassword: false,
};

const getFriendlyErrorMessage = (error: any): string => {
  if (!error?.message) return "An unknown error occurred";

  const message = error.message.toLowerCase();
  if (
    message.includes("already registered") ||
    message.includes("already exists")
  ) {
    return "This email is already in use.";
  }
  if (message.includes("password")) {
    return "Password does not meet requirements.";
  }
  return error.message;
};

export const validateForm = (
  formData: AuthFormData,
  mode: "signin" | "signup"
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Email validation
  if (!formData.email) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Please enter a valid email address";
  }

  // Password validation
  if (!formData.password) {
    errors.password = "Password is required";
  } else if (formData.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  // Additional validations for signup mode
  if (mode === "signup") {
    // Full name validation
    if (!formData.full_name.trim()) {
      errors.full_name = "Full name is required";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
  }

  return errors;
};

export const handleSignIn = async (formData: AuthFormData) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password");
      }
      throw new Error(getFriendlyErrorMessage(error));
    }

    if (formData.savePassword) {
      await supabase.auth.updateUser({
        data: { save_password: true },
      });
    }
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
};

export const handleSignUp = async (formData: AuthFormData) => {
  const { error: signUpError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        company: formData.company,
        position_title: formData.position_title,
        save_password: formData.savePassword,
      },
    },
  });

  if (signUpError) throw new Error(getFriendlyErrorMessage(signUpError));

  // Automatically sign in after successful signup
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (signInError) throw new Error(getFriendlyErrorMessage(signInError));
};

export const handleGoogleSignIn = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
  });
  if (error) throw new Error(getFriendlyErrorMessage(error));
};

export const handleAppleSignIn = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
  });
  if (error) throw new Error(getFriendlyErrorMessage(error));
};

export const checkPreviousSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
};

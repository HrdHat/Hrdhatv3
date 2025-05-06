import { useAuth } from "../session/AuthProvider";

const LoginHomePage = () => {
  const { user } = useAuth();

  if (!user) {
    return null; // This page should only be shown to logged-in users
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome, {user.user_metadata?.full_name || "User"}!</h1>
      <p>You're successfully logged in.</p>
    </div>
  );
};

export default LoginHomePage;

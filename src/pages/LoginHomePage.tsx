import { useAuth } from "../session/AuthProvider";
import { Link } from "react-router-dom";

const LoginHomePage = () => {
  const { user } = useAuth();

  if (!user) {
    return null; // This page should only be shown to logged-in users
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome, {user.user_metadata?.full_name || "User"}!</h1>
      <p>You're successfully logged in. Here are some quick actions:</p>

      <div style={{ marginTop: "20px" }}>
        <Link
          to="/flra/new"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            textDecoration: "none",
            borderRadius: "5px",
            marginRight: "10px",
          }}
        >
          Create New FLRA
        </Link>

        <Link
          to="/flra/active"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "white",
            textDecoration: "none",
            borderRadius: "5px",
          }}
        >
          View Active FLRAs
        </Link>
      </div>
    </div>
  );
};

export default LoginHomePage;

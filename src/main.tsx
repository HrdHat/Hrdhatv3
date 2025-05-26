import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Import and run startup validation
import { runStartupValidation } from "./utils/startupValidation";

// Run validation before starting the app
runStartupValidation();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

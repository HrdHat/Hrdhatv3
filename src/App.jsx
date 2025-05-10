import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { AuthProvider, useAuth } from "./session/AuthProvider";
import { useScreenSize } from "./hooks/useScreenSize";
import AppShellDesktop from "./layout/AppShellDesktop";
import AppShellTablet from "./layout/AppShellTablet";
import AppShellMobile from "./layout/AppShellMobile";
import LoginHomePage from "./pages/LoginHomePage";
import LandingPage from "./pages/LandingPage";
import FlraFormPage from "./pages/FlraFormPage";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};

function AppContent() {
  const screen = useScreenSize();
  const { user } = useAuth();

  let AppShell;
  if (screen === "mobile") AppShell = AppShellMobile;
  else if (screen === "tablet") AppShell = AppShellTablet;
  else AppShell = AppShellDesktop;

  return (
    <AppShell>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/home" /> : <LandingPage />}
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <LoginHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flra/:formId"
          element={
            <ProtectedRoute>
              <FlraFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flra/active"
          element={
            <ProtectedRoute>
              <div>Active FLRA Page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/flra/archive"
          element={
            <ProtectedRoute>
              <div>Archive Page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <div>Settings Page</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AppShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

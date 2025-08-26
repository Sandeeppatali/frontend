import React from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ResetPassword from "./pages/ResetPassword.jsx"; // Add this import
import "./index.css";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const nav = useNavigate();
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(atob(token.split(".")[1])) : null;

  return (
    <div>
      <header>
        <h2>Smartboard Booking</h2>
        {token ? (
          <>
            <span style={{ marginLeft: "auto", marginRight: "12px" }}>
              {user?.name} — {user?.role.toUpperCase()}
            </span>
            <button onClick={() => { localStorage.clear(); nav("/login"); }}>
              Logout
            </button>
          </>
        ) : (
          <nav style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
            <Link to="/login" style={{ color: "white", textDecoration: "none" }}>Login</Link>
            <Link to="/register" style={{ color: "white", textDecoration: "none" }}>Register</Link>
          </nav>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} /> {/* Add this route */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                {user?.role === "admin" ? <AdminDashboard /> : <Dashboard />}
              </PrivateRoute>
            }
          />
          <Route path="*" element={<div style={{ padding: "24px", textAlign: "center" }}>Not found</div>} />
        </Routes>
      </main>
    </div>
  );
}
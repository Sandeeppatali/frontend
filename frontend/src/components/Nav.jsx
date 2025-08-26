import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="nav">
      <div className="brand">Smartboard</div>
      <div className="spacer" />
      <Link className="link" to="/">Dashboard</Link>
      {user?.role === "admin" && <Link className="link" to="/admin">Admin</Link>}
      {!user && <Link className="link" to="/login">Login</Link>}
      {user && (
        <button
          className="btn"
          style={{ marginLeft: 12 }}
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      )}
    </div>
  );
}

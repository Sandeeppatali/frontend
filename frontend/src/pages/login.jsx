import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/auth/login", { email, password });

      // ✅ Save JWT token
      localStorage.setItem("token", res.data.token);

      // App.jsx will decode user from token
      navigate("/dashboard");
    } catch (err) {
      alert("Login failed: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      
      {/* Reset Password link at the top */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <Link 
          to="/reset-password" 
          style={{ 
            color: "#007bff", 
            textDecoration: "none", 
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          Forgot your password? Reset it here
        </Link>
      </div>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
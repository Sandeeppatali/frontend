// frontend/src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { loginUser, registerUser } from "../api";

import React, { useEffect, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load session on mount
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    setUser(res.user);
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));
    return res.user;
  };

  const register = async (payload) => {
    return await registerUser(payload);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

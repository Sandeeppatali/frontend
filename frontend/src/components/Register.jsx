// frontend/src/components/Register.jsx
import React, { useState } from "react";

import api from "../api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    facultyId: "", name: "", branch: "", email: "", phone: "", password: "", role: ""
  });
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/faculty/register", form);
      setMsg({ type: "success", text: data.message });
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || err.message });
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 720, margin: "30px auto" }}>
        <h2>Register</h2>
        <form onSubmit={submit}>
          <div className="row">
            <div>
              <label>Faculty ID</label>
              <input className="input" name="facultyId" value={form.facultyId} onChange={handleChange} required />
            </div>
            <div>
              <label>Name</label>
              <input className="input" name="name" value={form.name} onChange={handleChange} required />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Branch</label>
              <input className="input" name="branch" value={form.branch} onChange={handleChange} required />
            </div>
            <div>
              <label>Email</label>
              <input className="input" name="email" type="email" value={form.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Phone</label>
              <input className="input" name="phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div>
              <label>Password</label>
              <input className="input" name="password" type="password" value={form.password} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Role (optional)</label>
            <select className="input" name="role" value={form.role} onChange={handleChange}>
              <option value="">Faculty (default)</option>
              <option value="admin">Admin</option>
            </select>
            <small style={{ color: "#64748b" }}>If you register Shamanth Rai (shamanth.cs@sahyadri.edu.in) you can select Admin or it will be auto-assigned.</small>
          </div>

          <div style={{ marginTop: 12 }}>
            <button className="btn" type="submit">Register</button>
          </div>

          {msg && <div className={`alert ${msg.type === "success" ? "success" : "error"}`}>{msg.text}</div>}
        </form>
      </div>
    </div>
  );
}

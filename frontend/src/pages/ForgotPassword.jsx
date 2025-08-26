import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setMsg("If this email exists, a reset link will be sent (not implemented).");
  };

  return (
    <div className="container" style={{ maxWidth: 420, margin: "48px auto" }}>
      <h2>Forgot Password</h2>
      {msg && <div className="card" style={{ background: "#efe", padding: 12, marginBottom: 12 }}>{msg}</div>}
      <form onSubmit={submit} className="card" style={{ padding: 16 }}>
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <button className="btn" style={{ marginTop: 12 }}>Send reset link</button>
      </form>
      <div style={{ marginTop: 12 }}>
        <Link to="/">Back to login</Link>
      </div>
    </div>
  );
}

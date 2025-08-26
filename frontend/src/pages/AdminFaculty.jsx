import React, { useEffect, useState } from "react";
import api from "../api";

export default function AdminFaculty() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", department: "" });

  const load = async () => setRows((await api.get("/admin/faculty")).data);
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.post("/admin/faculty", form);
    setForm({ name: "", email: "", department: "" });
    load();
  };

  const del = async (id) => { await api.delete(`/admin/faculty/${id}`); load(); };

  return (
    <div className="card">
      <h2>Faculty</h2>
      <form onSubmit={save} className="form row">
        <input placeholder="Name" value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={e=>setForm({ ...form, email: e.target.value })} />
        <input placeholder="Department (CSE...)" value={form.department} onChange={e=>setForm({ ...form, department: e.target.value })} />
        <button className="btn btn-primary">Add</button>
      </form>

      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Dept</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id}>
              <td>{r.name}</td><td>{r.email}</td><td>{r.department}</td>
              <td><button className="btn btn-danger" onClick={()=>del(r._id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">New faculty get a user account with default password <code>ChangeMe@123</code> and must reset on first login.</p>
    </div>
  );
}

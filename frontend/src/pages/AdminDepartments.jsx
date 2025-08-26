import React, { useEffect, useState } from "react";
import api from "../api";

export default function AdminDepartments() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ code: "", name: "" });

  const load = async () => setRows((await api.get("/admin/departments")).data);
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.post("/admin/departments", form);
    setForm({ code: "", name: "" });
    load();
  };

  const del = async (id) => {
    await api.delete(`/admin/departments/${id}`);
    load();
  };

  return (
    <div className="card">
      <h2>Departments</h2>
      <form onSubmit={save} className="form row">
        <input placeholder="Code (CSE)" value={form.code} onChange={e=>setForm({ ...form, code: e.target.value })} />
        <input placeholder="Name" value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} />
        <button className="btn btn-primary">Add</button>
      </form>

      <table className="table">
        <thead><tr><th>Code</th><th>Name</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id}>
              <td>{r.code}</td>
              <td>{r.name}</td>
              <td><button className="btn btn-danger" onClick={()=>del(r._id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

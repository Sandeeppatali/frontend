import React, { useEffect, useState } from "react";
import api from "../api";

export default function AdminClassrooms() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: "", room: "", department: "" });

  const load = async () => setRows((await api.get("/admin/smartboards")).data);
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.post("/admin/smartboards", form);
    setForm({ name: "", room: "", department: "" });
    load();
  };

  const del = async (id) => { await api.delete(`/admin/smartboards/${id}`); load(); };

  return (
    <div className="card">
      <h2>Classrooms / Smartboards</h2>
      <form onSubmit={save} className="form row">
        <input placeholder="Name (SB-CSE-01)" value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} />
        <input placeholder="Room (CS-101)" value={form.room} onChange={e=>setForm({ ...form, room: e.target.value })} />
        <input placeholder="Department (CSE...)" value={form.department} onChange={e=>setForm({ ...form, department: e.target.value })} />
        <button className="btn btn-primary">Add</button>
      </form>

      <table className="table">
        <thead><tr><th>Dept</th><th>Room</th><th>Name</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id}>
              <td>{r.department}</td><td>{r.room}</td><td>{r.name}</td>
              <td><button className="btn btn-danger" onClick={()=>del(r._id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

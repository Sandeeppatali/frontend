import React, { useEffect, useMemo, useState } from "react";
import api from "../api"; // 👈 default import (was `{ api }`)

export default function Smartboards() {
  const [boards, setBoards] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/smartboards");
        setBoards(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return boards;
    return boards.filter(b =>
      [b.name, b.department, b.room, b.location]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(term))
    );
  }, [boards, q]);

  if (loading) return <div className="card">Loading…</div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <input
          placeholder="Search by name, dept, room…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div className="grid">
        {filtered.map(b => (
          <div key={b._id} className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="badge">{b.department}</div>
                <h3 style={{ margin: "8px 0" }}>{b.name}</h3>
                <div style={{ color: "#6b7280" }}>{b.location || b.room}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Capacity</div>
                <div style={{ fontWeight: 600 }}>{b.capacity ?? "-"}</div>
              </div>
            </div>

            {!!(b.features?.length) && (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {b.features.map((f, i) => (
                  <span key={i} className="chip">{f}</span>
                ))}
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary" disabled>Book</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

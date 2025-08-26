// frontend/src/components/SlotGrid.jsx
import React from "react";

export default function SlotGrid({ bookings = [] }) {
  return (
    <div className="card" style={{ marginTop: 16, padding: 16 }}>
      <h3>Today’s Bookings</h3>
      <table className="table" style={{ width: "100%", marginTop: 8 }}>
        <thead>
          <tr>
            <th>Smartboard</th>
            <th>Room</th>
            <th>Faculty</th>
            <th>Start</th>
            <th>End</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: "center", padding: 12 }}>No bookings today</td></tr>
          ) : bookings.map(b => (
            <tr key={b._id}>
              <td>{b.smartboard?.name || "-"}</td>
              <td>{b.smartboard?.room || "-"}</td>
              <td>{b.faculty?.name || "-"}</td>
              <td>{b.startISO ? new Date(b.startISO).toLocaleTimeString() : `${b.date} ${b.startTime}`}</td>
              <td>{b.endISO ? new Date(b.endISO).toLocaleTimeString() : `${b.date} ${b.endTime}`}</td>
              <td>{b.purpose || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import api from "../api";

export default function BookingForm() {
  const [date, setDate] = useState("");
  const [classroom, setClassroom] = useState(""); 
  const [time, setTime] = useState("");
  const [classrooms, setClassrooms] = useState([]);
  const [message, setMessage] = useState("");

  // Fetch classrooms on mount
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await api.get("/api/classrooms", {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        });
        setClassrooms(res.data);
      } catch (err) {
        console.error("Failed to fetch classrooms", err);
      }
    };
    fetchClassrooms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Split classroom string into number + smartboard
      const [number, sbPart] = classroom.split(" (");
      const classroomNumber = number.trim();
      const smartboardNumber = sbPart ? sbPart.replace(/\D/g, "") : "";

      // Date is already YYYY-MM-DD from date picker
      const isoDate = date;

      await api.post(
        "/api/bookings",
        {
          date: isoDate,
          time,               // ✅ send full slot string like "08:30-09:30"
          classroom: classroomNumber,
          smartboardNumber
        },
        { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
      );

      setMessage(`Booked: ${isoDate} ${classroom} ${time}`);
    } catch (err) {
      setMessage("Booking failed ❌ " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div>
      <h3>Book a 1-hour slot</h3>
      <form onSubmit={handleSubmit}>
        {/* Native date picker ensures YYYY-MM-DD */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <select value={classroom} onChange={(e) => setClassroom(e.target.value)} required>
          <option value="">Select classroom</option>
          {classrooms.map((c) => (
            <option key={c._id} value={c.Classroom}>
              {c.Classroom}
            </option>
          ))}
        </select>

        <select value={time} onChange={(e) => setTime(e.target.value)} required>
          <option value="">Select time</option>
          <option value="08:30-09:30">08:30-09:30</option>
          <option value="09:30-10:30">09:30-10:30</option>
          <option value="10:45-11:45">10:45-11:45</option>
          <option value="11:45-12:45">11:45-12:45</option>
          <option value="13:30-14:30">13:30-14:30</option>
          <option value="14:30-15:30">14:30-15:30</option>
          <option value="15:30-16:30">15:30-16:30</option>
          <option value="16:30-17:30">16:30-17:30</option>
        </select>

        <button type="submit">Book</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

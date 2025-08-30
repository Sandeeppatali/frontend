import React, { useEffect, useState } from "react";
import api from "../api";

function timeOptions() {
  return [
    "08:30-09:30",
    "09:30-10:30",
    "10:45-11:45",
    "11:45-12:45",
    "13:30-14:30",
    "14:30-15:30",
    "15:30-16:30",
    "16:30-17:30"
  ];
}
// const API_URL = import.meta.env.VITE_API_URL;

// useEffect(() => {
//   fetch(`${API_URL}/api/bookings`)
//     .then(res => res.json())
//     .then(data => setBookings(data));
// }, []);


export default function Dashboard() {
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(atob(token.split(".")[1])) : null;

  const [rooms, setRooms] = useState([]);
  const [mine, setMine] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(timeOptions()[0]);
  const [classroom, setClassroom] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Remove background image when dashboard loads
  useEffect(() => {
    document.body.classList.add('no-background');
    
    return () => {
      document.body.classList.remove('no-background');
    };
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const r = await api.get(`/api/classrooms/${user.branch}`);
        setRooms(r.data);

        if (r.data[0]) {
          setClassroom(r.data[0].Classroom);
        }

        const b = await api.get("/api/bookings/mine", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMine(Array.isArray(b.data) ? b.data : []);
      } catch (error) {
        console.error("Error loading data:", error);
        setErr("Failed to load data. Please refresh the page.");
      }
    }
    
    if (user?.branch) {
      load();
    }
  }, [user?.branch, token]);

  async function book(e) {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);

    if (!date || !classroom || !time) {
      setErr("Please fill in all fields");
      setLoading(false);
      return;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setErr("Cannot book for past dates");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post(
        "/api/bookings",
        {
          date,
          classroom,
          time
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMsg(`Successfully booked: ${new Date(date).toLocaleDateString()} at ${time} in ${classroom}`);

      const b = await api.get("/api/bookings/mine", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMine(Array.isArray(b.data) ? b.data : []);

      const idx = timeOptions().indexOf(time);
      if (idx !== -1 && idx < timeOptions().length - 1) {
        setTime(timeOptions()[idx + 1]);
      }

      setShowBookingForm(false);

    } catch (error) {
      console.error("Booking error:", error);
      const errorMsg = error.response?.data?.error || "Booking failed";
      const errorDetails = error.response?.data?.details;
      setErr(errorDetails ? `${errorMsg}: ${errorDetails}` : errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(bookingId) {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setCancelLoading(bookingId);
    setMsg("");
    setErr("");

    try {
      await api.delete(`/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg("Booking cancelled successfully");

      const b = await api.get("/api/bookings/mine", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMine(Array.isArray(b.data) ? b.data : []);

    } catch (error) {
      console.error("Cancel error:", error);
      const errorMsg = error.response?.data?.error || "Failed to cancel booking";
      setErr(errorMsg);
    } finally {
      setCancelLoading(null);
    }
  }

  if (!user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    },
    
    contentWrapper: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '30px',
      paddingTop: '20px'
    },

    welcomeCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '40px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    },

    welcomeCard_before: {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
      animation: 'shimmer 3s infinite'
    },

    welcomeTitle: {
      fontSize: '2.5rem',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '10px'
    },

    welcomeSubtitle: {
      fontSize: '1.1rem',
      color: '#666',
      marginBottom: '30px'
    },

    quickActions: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      flexWrap: 'wrap'
    },

    actionButton: {
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      padding: '15px 30px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: 'translateY(0)',
      boxShadow: '0 8px 25px rgba(79, 70, 229, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },

    dashboardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '30px',
      alignItems: 'start'
    },

    bookingCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '30px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease',
      transform: showBookingForm ? 'scale(1.02)' : 'scale(1)'
    },

    sectionTitle: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: '#333',
      marginBottom: '25px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },

    formGroup: {
      marginBottom: '20px'
    },

    label: {
      display: 'block',
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#555',
      marginBottom: '8px'
    },

    input: {
      width: '100%',
      padding: '14px 18px',
      border: '2px solid #e1e5e9',
      borderRadius: '12px',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      backgroundColor: '#fafbfc',
      outline: 'none'
    },

    select: {
      width: '100%',
      padding: '14px 18px',
      border: '2px solid #e1e5e9',
      borderRadius: '12px',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      backgroundColor: '#fafbfc',
      outline: 'none',
      cursor: 'pointer'
    },

    submitButton: {
      width: '100%',
      padding: '16px',
      background: loading ? '#ccc' : 'linear-gradient(135deg, #10b981, #059669)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    },

    bookingsCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '30px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },

    bookingItem: {
      background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '15px',
      border: '1px solid rgba(148, 163, 184, 0.2)',
      transition: 'all 0.3s ease',
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 2fr 1fr',
      gap: '15px',
      alignItems: 'center'
    },

    bookingDetail: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },

    bookingLabel: {
      fontSize: '0.8rem',
      fontWeight: '600',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },

    bookingValue: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#334155'
    },

    cancelButton: {
      padding: '8px 16px',
      background: cancelLoading ? '#ccc' : 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.9rem',
      fontWeight: '600',
      cursor: cancelLoading ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
    },

    alertSuccess: {
      background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
      color: '#065f46',
      padding: '16px 20px',
      borderRadius: '12px',
      marginTop: '20px',
      border: '1px solid #6ee7b7',
      fontSize: '0.95rem',
      fontWeight: '500'
    },

    alertError: {
      background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
      color: '#991b1b',
      padding: '16px 20px',
      borderRadius: '12px',
      marginTop: '20px',
      border: '1px solid #f87171',
      fontSize: '0.95rem',
      fontWeight: '500'
    },

    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#64748b'
    },

    emptyStateIcon: {
      fontSize: '4rem',
      marginBottom: '20px',
      opacity: 0.5
    },

    floatingBookButton: {
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      width: '70px',
      height: '70px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      color: 'white',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      boxShadow: '0 8px 25px rgba(79, 70, 229, 0.4)',
      transition: 'all 0.3s ease',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .floating-book:hover {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 12px 35px rgba(79, 70, 229, 0.6);
        }
        
        .action-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(79, 70, 229, 0.4);
        }
        
        .booking-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .input:focus, .select:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
          transform: translateY(-1px);
        }
        
        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
        }
        
        .cancel-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        }
      `}</style>

      <div style={styles.container}>
        <div style={styles.contentWrapper}>
          {/* Welcome Section */}
          <div style={styles.welcomeCard}>
            <h1 style={styles.welcomeTitle}>
              Welcome back, {user?.name}! 👋
            </h1>
            <p style={styles.welcomeSubtitle}>
              {user?.branch} Department • Ready to book your smartboard classroom?
            </p>
            <div style={styles.quickActions}>
              <button 
                style={styles.actionButton}
                className="action-button"
                onClick={() => setShowBookingForm(!showBookingForm)}
              >
                📅 {showBookingForm ? 'Hide Booking' : 'New Booking'}
              </button>
              <button 
                style={{...styles.actionButton, background: 'linear-gradient(135deg, #059669, #047857)'}}
                className="action-button"
                onClick={() => document.getElementById('my-bookings').scrollIntoView({behavior: 'smooth'})}
              >
                📋 My Bookings ({mine.length})
              </button>
            </div>
          </div>

          <div style={styles.dashboardGrid}>
            {/* Booking Form */}
            {showBookingForm && (
              <div style={styles.bookingCard}>
                <h3 style={styles.sectionTitle}>
                  🏫 Book a Smartboard Classroom
                </h3>
                
                <form onSubmit={book}>
                  <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="date">📅 Select Date</label>
                    <input
                      id="date"
                      type="date"
                      value={date}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDate(e.target.value)}
                      style={styles.input}
                      className="input"
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="classroom">🏛️ Classroom</label>
                    <select
                      id="classroom"
                      value={classroom}
                      onChange={(e) => setClassroom(e.target.value)}
                      style={styles.select}
                      className="select"
                      required
                    >
                      <option value="">-- Select Classroom --</option>
                      {rooms.map((r) => (
                        <option key={r._id || r.Classroom} value={r.Classroom}>
                          {r.Classroom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="time">⏰ Time Slot</label>
                    <select
                      id="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      style={styles.select}
                      className="select"
                      required
                    >
                      {timeOptions().map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    style={styles.submitButton}
                    className="submit-button"
                  >
                    {loading ? (
                      <>⏳ Booking...</>
                    ) : (
                      <>🎯 Book Now</>
                    )}
                  </button>
                </form>

                {msg && <div style={styles.alertSuccess}>{msg}</div>}
                {err && <div style={styles.alertError}>{err}</div>}
              </div>
            )}

            {/* My Bookings */}
            <div style={styles.bookingsCard} id="my-bookings">
              <h3 style={styles.sectionTitle}>
                📚 My Active Bookings
              </h3>
              
              {Array.isArray(mine) && mine.length > 0 ? (
                <div>
                  {mine.map((booking, i) => (
                    <div key={booking._id || i} style={styles.bookingItem} className="booking-item">
                      <div style={styles.bookingDetail}>
                        <span style={styles.bookingLabel}>Date</span>
                        <span style={styles.bookingValue}>
                          {new Date(booking.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div style={styles.bookingDetail}>
                        <span style={styles.bookingLabel}>Time</span>
                        <span style={styles.bookingValue}>{booking.time}</span>
                      </div>
                      
                      <div style={styles.bookingDetail}>
                        <span style={styles.bookingLabel}>Classroom</span>
                        <span style={styles.bookingValue}>{booking.classroom}</span>
                      </div>
                      
                      <button
                        onClick={() => cancelBooking(booking._id)}
                        disabled={cancelLoading === booking._id}
                        style={styles.cancelButton}
                        className="cancel-button"
                      >
                        {cancelLoading === booking._id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyStateIcon}>📅</div>
                  <h4>No bookings yet</h4>
                  <p>Click "New Booking" to reserve your first smartboard classroom!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        {!showBookingForm && (
          <button
            style={styles.floatingBookButton}
            className="floating-book"
            onClick={() => setShowBookingForm(true)}
            title="Quick Book"
          >
            ➕
          </button>
        )}
      </div>
    </>
  );
}
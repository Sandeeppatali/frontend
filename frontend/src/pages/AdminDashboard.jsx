import React, { useEffect, useState } from "react";
import api from "../api";

export default function AdminDashboard() {
  const [allRooms, setAllRooms] = useState([]);
  const [roomsByBranch, setRoomsByBranch] = useState({});
  const [allBookings, setAllBookings] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    classrooms: 0,
    bookings: 0,
    facultyMembers: 0
  });
  const [systemStatus, setSystemStatus] = useState({
    database: "Connecting...",
    api: "Checking...",
    features: "Loading..."
  });
  const [branch, setBranch] = useState("");
  const [number, setNumber] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

  // Define all branches/departments based on your data
  const branches = ["CSE", "ISE", "ECE", "ME", "AIML", "MBA", "Basic Science"];

  // Remove background image when admin dashboard loads
  useEffect(() => {
    document.body.classList.add('no-background');
    
    return () => {
      document.body.classList.remove('no-background');
    };
  }, []);

  async function load() {
    setLoading(true);
    setErr("");
    setMsg("");
    
    try {
      // Fetch dashboard statistics first
      console.log("Fetching dashboard stats...");
      try {
        const statsResponse = await api.get("/api/dashboard/stats");
        if (statsResponse.data.success) {
          setDashboardStats(statsResponse.data.data);
        }
      } catch (statsError) {
        console.warn("Stats fetch failed:", statsError.message);
      }

      // Fetch system status
      try {
        const statusResponse = await api.get("/api/system/status");
        if (statusResponse.data.success) {
          setSystemStatus(statusResponse.data.data);
        }
      } catch (statusError) {
        console.warn("Status fetch failed:", statusError.message);
      }

      // Fetch classrooms from all branches
      console.log("Fetching classrooms from all branches...");
      const branchRooms = {};
      let totalRooms = [];
      
      for (const branchName of branches) {
        try {
          // Try to get classrooms for each branch
          const classroomResponse = await api.get(`/api/classrooms/${branchName}`);
          const rooms = Array.isArray(classroomResponse.data) ? classroomResponse.data : [];
          
          // Transform the data to match expected structure if needed
          const formattedRooms = rooms.map(room => ({
            ...room,
            Branch: room.Branch || branchName,
            Classroom: room.Classroom || room.classroom || `${room.number || 'Unknown'}`
          }));
          
          branchRooms[branchName] = formattedRooms;
          totalRooms = [...totalRooms, ...formattedRooms];
        } catch (classroomError) {
          console.warn(`Failed to fetch ${branchName} classrooms:`, classroomError.message);
          branchRooms[branchName] = [];
        }
      }
      
      // If no rooms found through individual branch calls, try a general endpoint
      if (totalRooms.length === 0) {
        try {
          const allClassroomsResponse = await api.get("/api/admin/classrooms");
          const allRooms = Array.isArray(allClassroomsResponse.data) ? allClassroomsResponse.data : [];
          
          // Group rooms by branch
          allRooms.forEach(room => {
            const branch = room.Branch || 'Unknown';
            if (!branchRooms[branch]) {
              branchRooms[branch] = [];
            }
            branchRooms[branch].push(room);
          });
          
          totalRooms = allRooms;
        } catch (generalError) {
          console.warn("General classrooms fetch also failed:", generalError.message);
        }
      }
      
      setRoomsByBranch(branchRooms);
      setAllRooms(totalRooms);

      // Update stats with actual counts if API stats failed
      if (!dashboardStats.classrooms) {
        setDashboardStats(prev => ({
          ...prev,
          classrooms: totalRooms.length
        }));
      }

      // Fetch faculty data properly
      console.log("Fetching faculty...");
      try {
        // Try multiple endpoints to get faculty data
        let facultyData = [];
        try {
          const facultyResponse = await api.get("/api/faculty");
          facultyData = Array.isArray(facultyResponse.data) ? facultyResponse.data : [];
        } catch (firstTry) {
          try {
            const facultyResponse = await api.get("/api/faculties");
            facultyData = Array.isArray(facultyResponse.data) ? facultyResponse.data : [];
          } catch (secondTry) {
            // Try the branches endpoint as fallback
            const facultyResponse = await api.get("/api/faculties/branches");
            facultyData = Array.isArray(facultyResponse.data) ? facultyResponse.data : [];
          }
        }
        
        setFaculty(facultyData);
        
        if (!dashboardStats.facultyMembers) {
          setDashboardStats(prev => ({
            ...prev,
            facultyMembers: facultyData.length
          }));
        }
      } catch (facultyError) {
        console.warn("Faculty fetch failed:", facultyError.message);
        setFaculty([]);
      }

      // Fetch all bookings (admin should see all bookings, not just their own)
      console.log("Fetching bookings...");
      try {
        // Try to fetch all bookings first (this endpoint might need to be created)
        const allBookingsResponse = await api.get("/api/admin/bookings/all", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const bookings = Array.isArray(allBookingsResponse.data) ? allBookingsResponse.data : [];
        setAllBookings(bookings);
        
        if (!dashboardStats.bookings) {
          setDashboardStats(prev => ({
            ...prev,
            bookings: bookings.length
          }));
        }
      } catch (bookingError) {
        console.warn("All bookings fetch failed, trying personal bookings:", bookingError.message);
        try {
          const myBookingsResponse = await api.get("/api/bookings/mine", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const myBookings = Array.isArray(myBookingsResponse.data) ? myBookingsResponse.data : [];
          setAllBookings(myBookings);
        } catch (myBookingError) {
          console.warn("Personal bookings fetch also failed:", myBookingError.message);
        }
      }

    } catch (error) {
      console.error("Load error:", error);
      setErr("Failed to load some data: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    load();
  }, []);

  // Delete booking
  async function deleteBooking(id) {
    if (!window.confirm("Delete this booking?")) return;
    
    try {
      await api.delete(`/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg("Booking deleted successfully");
      setErr("");
      load();
    } catch (error) {
      setErr("Failed to delete booking: " + (error.response?.data?.error || error.message));
    }
  }

  // Delete classroom
  async function deleteClassroom(id) {
    if (!window.confirm("Delete this classroom?")) return;
    
    try {
      await api.delete(`/api/admin/classrooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg("Classroom deleted successfully");
      setErr("");
      load();
    } catch (error) {
      setErr("Failed to delete classroom: " + (error.response?.data?.error || error.message));
    }
  }

  // Delete faculty
  async function deleteFaculty(id) {
    if (!window.confirm("Delete this faculty member?")) return;
    
    try {
      await api.delete(`/api/admin/faculty/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg("Faculty member deleted successfully");
      setErr("");
      load();
    } catch (error) {
      setErr("Failed to delete faculty: " + (error.response?.data?.error || error.message));
    }
  }

  // Add classroom
  async function addClassroom(e) {
    e.preventDefault();
    if (!branch || !number) {
      setErr("Please fill in all fields");
      return;
    }
    
    try {
      await api.post("/api/admin/classrooms", {
        Branch: branch,
        Classroom: `${number} (${branch})`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBranch(""); 
      setNumber("");
      setMsg("Classroom added successfully");
      setErr("");
      load();
    } catch (error) {
      setErr("Failed to add classroom: " + (error.response?.data?.error || error.message));
    }
  }

  if (loading && activeTab === "overview") {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  const tabStyle = (isActive) => ({
    padding: '10px 20px',
    margin: '0 5px',
    backgroundColor: isActive ? '#007bff' : '#f8f9fa',
    color: isActive ? 'white' : '#333',
    border: '1px solid #dee2e6',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    display: 'inline-block'
  });

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      backgroundColor: 'white',
      minHeight: '100vh'
    }}>
      <section style={{ marginBottom: '30px' }}>
        <h3>Admin Dashboard</h3>
        <p>System-wide management for all departments and resources.</p>
        
        {msg && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#d4edda', 
            color: '#155724', 
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            {msg}
          </div>
        )}
        
        {err && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            {err}
          </div>
        )}

        {/* Stats Overview */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px', 
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
              {dashboardStats.classrooms || allRooms.length}
            </h4>
            <p style={{ margin: 0, color: '#666' }}>Total Classrooms</p>
          </div>
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px', 
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>
              {dashboardStats.bookings || allBookings.length}
            </h4>
            <p style={{ margin: 0, color: '#666' }}>Total Bookings</p>
          </div>
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px', 
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>
              {dashboardStats.facultyMembers || faculty.length}
            </h4>
            <p style={{ margin: 0, color: '#666' }}>Faculty Members</p>
          </div>
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px', 
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#6f42c1' }}>
              {Object.keys(roomsByBranch).length}
            </h4>
            <p style={{ margin: 0, color: '#666' }}>Departments</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #dee2e6' }}>
          <span 
            style={tabStyle(activeTab === 'overview')}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </span>
          <span 
            style={tabStyle(activeTab === 'classrooms')}
            onClick={() => setActiveTab('classrooms')}
          >
            Classrooms
          </span>
          <span 
            style={tabStyle(activeTab === 'bookings')}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </span>
          <span 
            style={tabStyle(activeTab === 'faculty')}
            onClick={() => setActiveTab('faculty')}
          >
            Faculty
          </span>
        </div>
      </section>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <section>
          <h4>System Overview</h4>
          
          {/* Department Summary Cards */}
          <div style={{ marginBottom: '30px' }}>
            <h5>Departments Overview</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {branches.map(branchName => (
                <div key={branchName} style={{ 
                  padding: '15px', 
                  border: '1px solid #dee2e6', 
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <h6 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{branchName}</h6>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    Classrooms: {roomsByBranch[branchName]?.length || 0}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    Smartboards: {roomsByBranch[branchName]?.reduce((total, room) => 
                      total + (room.Smartboards?.length || 0), 0) || 0}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '20px', border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <h5>Quick Stats</h5>
              <p>{dashboardStats.classrooms || allRooms.length} total classrooms</p>
              <p>{dashboardStats.bookings || allBookings.length} total bookings</p>
              <p>{dashboardStats.facultyMembers || faculty.length} faculty members</p>
              <p>{Object.keys(roomsByBranch).length} active departments</p>
            </div>
            <div style={{ padding: '20px', border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <h5>System Status</h5>
              <p>Database: {systemStatus.database}</p>
              <p>API: {systemStatus.api}</p>
              <p>Features: {systemStatus.features}</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'classrooms' && (
        <section>
          <h4>Add Classroom</h4>
          <form onSubmit={addClassroom} style={{ display: 'flex', gap: '10px', alignItems: 'end', maxWidth: '600px', marginBottom: '30px' }}>
            <div>
              <label>Department:</label>
              <select
                value={branch}
                onChange={e => setBranch(e.target.value)}
                style={{ padding: '8px', marginTop: '5px' }}
                required
              >
                <option value="">Select Department</option>
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Room Number:</label>
              <input
                placeholder="e.g., 207"
                value={number}
                onChange={e => setNumber(e.target.value)}
                style={{ padding: '8px', marginTop: '5px' }}
                required
              />
            </div>
            <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
              Add Classroom
            </button>
          </form>

          <h4>All Classrooms by Department</h4>
          {Object.entries(roomsByBranch).map(([branchName, rooms]) => (
            <div key={branchName} style={{ marginBottom: '30px' }}>
              <h5 style={{ 
                padding: '10px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                margin: '0 0 10px 0',
                borderRadius: '4px'
              }}>
                {branchName} Department ({rooms.length} classrooms)
              </h5>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Classroom</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Smartboards</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map(r => (
                      <tr key={r._id}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{r.Classroom}</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {r.Smartboards ? r.Smartboards.length : 0}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          <span style={{ 
                            padding: '4px 8px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            Active
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          <button
                            onClick={() => deleteClassroom(r._id)}
                            style={{ 
                              padding: '6px 12px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rooms.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#666', border: '1px solid #dee2e6' }}>
                          No classrooms found for {branchName}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'bookings' && (
        <section>
          <h4>All System Bookings ({allBookings.length})</h4>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {allBookings.length > 0 ? 'System-wide booking overview' : 'Currently showing limited booking data - admin booking endpoints need backend implementation'}
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Time</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Classroom</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Faculty</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.map((b) => (
                  <tr key={b._id}>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {new Date(b.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{b.time}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{b.classroom}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{b.facultyName || 'N/A'}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      <button
                        onClick={() => deleteBooking(b._id)}
                        style={{ 
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {allBookings.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666', border: '1px solid #dee2e6' }}>
                      No bookings found - check system connectivity
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'faculty' && (
        <section>
          <h4>All Faculty Members ({faculty.length})</h4>
          <p style={{ color: '#666', marginBottom: '20px' }}>Faculty management across all departments</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Department</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Employee ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map((f, index) => (
                  <tr key={f._id || f.facultyId || index}>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {f.name || f.Name || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {f.email || f.Email || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {f.branch || f.department || f.Department || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {f.facultyId || f.employeeId || f.EmployeeID || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      <button
                        onClick={() => deleteFaculty(f._id || f.facultyId)}
                        style={{ 
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {faculty.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666', border: '1px solid #dee2e6' }}>
                      No faculty members found - check backend faculty data or endpoints
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
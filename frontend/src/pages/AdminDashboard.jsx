import React, { useEffect, useState } from "react";
import api from "../api";

// const API_URL = import.meta.env.VITE_API_URL;

// useEffect(() => {
//   fetch(`${API_URL}/api/bookings`)
//     .then(res => res.json())
//     .then(data => setBookings(data));
// }, []);

export default function AdminDashboard() {
  const [allRooms, setAllRooms] = useState([]);
  const [roomsByBranch, setRoomsByBranch] = useState({});
  const [allBookings, setAllBookings] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
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

  // Helper function to safely extract faculty data
  function processFacultyData(responseData) {
    if (!responseData) return [];
    
    // Handle different response structures
    let facultyArray = [];
    
    if (Array.isArray(responseData)) {
      facultyArray = responseData;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      facultyArray = responseData.data;
    } else if (responseData.faculty && Array.isArray(responseData.faculty)) {
      facultyArray = responseData.faculty;
    } else if (typeof responseData === 'object') {
      // Handle grouped by branch data
      facultyArray = Object.values(responseData).flat();
    }

    // Normalize the faculty data structure
    return facultyArray.map(member => ({
      _id: member._id || member.id || member.facultyId,
      name: member.name || member.Name || member.facultyName || 'Unknown',
      branch: member.branch || member.department || member.Department || member.Branch || 'Unknown',
      email: member.email || member.Email || '',
      phone: member.phone || member.Phone || '',
      designation: member.designation || member.Designation || 'Faculty',
      experience: member.experience || member.Experience || 'N/A',
      qualification: member.qualification || member.Qualification || 'N/A',
      subjects: member.subjects || member.Subjects || [],
      joinDate: member.joinDate || member.JoinDate || 'N/A',
      employeeId: member.employeeId || member.EmployeeId || 'N/A'
    }));
  }

  // Function to view faculty details
  const viewFacultyDetails = async (facultyId) => {
    try {
      // Try to get detailed faculty info
      const response = await api.get(`/api/faculty/${facultyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const facultyDetails = processFacultyData([response.data])[0];
      setSelectedFaculty(facultyDetails);
      setShowFacultyModal(true);
    } catch (error) {
      // If detailed fetch fails, use the data we already have
      const facultyMember = faculty.find(f => f._id === facultyId);
      if (facultyMember) {
        setSelectedFaculty(facultyMember);
        setShowFacultyModal(true);
      } else {
        setErr("Failed to load faculty details: " + (error.response?.data?.error || error.message));
      }
    }
  };

  // Close faculty modal
  const closeFacultyModal = () => {
    setShowFacultyModal(false);
    setSelectedFaculty(null);
  };

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

      // Improved faculty data fetching
      console.log("Fetching faculty...");
      try {
        let facultyData = [];
        const endpoints = [
          "/api/faculty",
          "/api/faculties", 
          "/api/admin/faculty",
          "/api/faculties/branches",
          "/api/faculties/all"
        ];
        
        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            const facultyResponse = await api.get(endpoint);
            console.log(`${endpoint} response:`, facultyResponse.data);
            
            const processedData = processFacultyData(facultyResponse.data);
            if (processedData.length > 0) {
              facultyData = processedData;
              console.log(`Successfully fetched ${facultyData.length} faculty from ${endpoint}`);
              break;
            }
          } catch (endpointError) {
            console.warn(`${endpoint} failed:`, endpointError.message);
            continue;
          }
        }
        
        console.log("Final processed faculty data:", facultyData);
        setFaculty(facultyData);
        
        if (!dashboardStats.facultyMembers) {
          setDashboardStats(prev => ({
            ...prev,
            facultyMembers: facultyData.length
          }));
        }
      } catch (facultyError) {
        console.warn("All faculty endpoints failed:", facultyError.message);
        setFaculty([]);
      }

      // Fetch all bookings (admin should see all bookings, not just their own)
      console.log("Fetching bookings...");
      try {
        // Try to fetch all bookings first (this endpoint might need to be created)
        const allBookingsResponse = await api.get("/api/admin/bookings/all", {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("All bookings response:", allBookingsResponse.data);
        const bookings = Array.isArray(allBookingsResponse.data) ? allBookingsResponse.data : 
                        (allBookingsResponse.data.data ? allBookingsResponse.data.data : []);
        setAllBookings(bookings);
        
        if (!dashboardStats.bookings) {
          setDashboardStats(prev => ({
            ...prev,
            bookings: bookings.length
          }));
        }
      } catch (bookingError) {
        console.warn("All bookings fetch failed, trying alternative endpoints:", bookingError.message);
        try {
          // Try general bookings endpoint
          const bookingsResponse = await api.get("/api/bookings", {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("General bookings response:", bookingsResponse.data);
          const bookings = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : 
                          (bookingsResponse.data.data ? bookingsResponse.data.data : []);
          setAllBookings(bookings);
        } catch (secondTry) {
          try {
            const myBookingsResponse = await api.get("/api/bookings/mine", {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log("My bookings response:", myBookingsResponse.data);
            const myBookings = Array.isArray(myBookingsResponse.data) ? myBookingsResponse.data : 
                              (myBookingsResponse.data.data ? myBookingsResponse.data.data : []);
            setAllBookings(myBookings);
          } catch (myBookingError) {
            console.warn("All booking endpoints failed:", myBookingError.message);
          }
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

  // Group faculty by branch for better display
  const facultyByBranch = faculty.reduce((acc, member) => {
    const branchName = member.branch || 'Unknown';
    if (!acc[branchName]) {
      acc[branchName] = [];
    }
    acc[branchName].push(member);
    return acc;
  }, {});

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

  const buttonStyle = {
    padding: '6px 12px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  };

  const viewButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white'
  };

  const deleteButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
    color: 'white'
  };

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

      {/* Faculty Details Modal */}
      {showFacultyModal && selectedFaculty && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={closeFacultyModal}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
            
            <h3 style={{ marginBottom: '20px', color: '#007bff' }}>Faculty Details</h3>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <strong>Name:</strong>
                  <p style={{ margin: '5px 0', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {selectedFaculty.name}
                  </p>
                </div>
                <div>
                  <strong>Employee ID:</strong>
                  <p style={{ margin: '5px 0', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {selectedFaculty.employeeId}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <strong>Department:</strong>
                  <p style={{ margin: '5px 0', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {selectedFaculty.branch}
                  </p>
                </div>
                <div>
                  <strong>Designation:</strong>
                  <p style={{ margin: '5px 0', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {selectedFaculty.designation}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <strong>Email:</strong>
                  <p style={{ margin: '5px 0', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {selectedFaculty.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <strong>Phone:</strong>
                  <p style={{ margin: '5px 0', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {selectedFaculty.phone || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <strong>Experience:</strong>
                  <p style={{ margin: '5px 0', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {selectedFaculty.experience}
                  </p>
                </div>
                <div>
                  <strong>Join Date:</strong>
                  <p style={{ margin: '5px 0', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {selectedFaculty.joinDate}
                  </p>
                </div>
              </div>
              
              <div>
                <strong>Qualification:</strong>
                <p style={{ margin: '5px 0', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedFaculty.qualification}
                </p>
              </div>
              
              {selectedFaculty.subjects && selectedFaculty.subjects.length > 0 && (
                <div>
                  <strong>Subjects:</strong>
                  <div style={{ margin: '5px 0', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {Array.isArray(selectedFaculty.subjects) 
                      ? selectedFaculty.subjects.join(', ')
                      : selectedFaculty.subjects
                    }
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={closeFacultyModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                    Faculty: {facultyByBranch[branchName]?.length || 0}
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
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map(r => (
                      <tr key={r._id}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{r.Classroom}</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          <button
                            onClick={() => deleteClassroom(r._id)}
                            style={deleteButtonStyle}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rooms.length === 0 && (
                      <tr>
                        <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#666', border: '1px solid #dee2e6' }}>
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
                {allBookings.map((b, index) => {
                  // Extract faculty name from various possible fields
                  const facultyName = b.facultyName || 
                                     b.faculty || 
                                     b.bookedBy || 
                                     b.Faculty || 
                                     b.BookedBy || 
                                     b.facultyDetails?.name ||
                                     (b.user ? b.user.name : null) ||
                                     (b.userId ? `User ID: ${b.userId}` : null) ||
                                     'Unknown';
                  
                  return (
                    <tr key={b._id || index}>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {b.date ? new Date(b.date).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {b.time || b.timeSlot || b.Time || 'Unknown'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {b.classroom || b.classroomName || b.room || b.Classroom || 'Unknown'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {facultyName}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        <button
                          onClick={() => deleteBooking(b._id)}
                          style={deleteButtonStyle}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {allBookings.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666', border: '1px solid #dee2e6' }}>
                      No bookings found
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
          
          {Object.keys(facultyByBranch).length > 1 ? (
            // Display grouped by department if we have multiple departments
            Object.entries(facultyByBranch).map(([branchName, members]) => (
              <div key={branchName} style={{ marginBottom: '30px' }}>
                <h5 style={{ 
                  padding: '10px', 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  margin: '0 0 10px 0',
                  borderRadius: '4px'
                }}>
                  {branchName} Department ({members.length} members)
                </h5>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Email</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Phone</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((f, index) => (
                        <tr key={f._id || index}>
                          <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                            {f.name}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                            {f.email || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                            {f.phone || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                            <button
                              onClick={() => viewFacultyDetails(f._id)}
                              style={viewButtonStyle}
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => deleteFaculty(f._id)}
                              style={deleteButtonStyle}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            // Display as single table if all faculty are in one group or ungrouped
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Department</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Phone</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.map((f, index) => (
                    <tr key={f._id || index}>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {f.name}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {f.branch}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {f.email || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {f.phone || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        <button
                          onClick={() => viewFacultyDetails(f._id)}
                          style={viewButtonStyle}
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => deleteFaculty(f._id)}
                          style={deleteButtonStyle}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {faculty.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666', border: '1px solid #dee2e6' }}>
                        No faculty members found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
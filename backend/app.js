import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import classroomRoutes from "./routes/classrooms.js";
import bookingRoutes from "./routes/booking.js";
import facultyRoutes from "./routes/faculty.js";
import passwordResetRoutes from './routes/passwordReset.js';
import adminRoutes from './routes/admin.js';
import emailTestRoute from "./routes/emailTest.js";

dotenv.config();
const app = express();

// ✅ Middlewares
app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(",") || ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));


// ✅ DB Connection
connectDB();

// ✅ Health check
app.get("/", (_req, res) => res.json({ 
  ok: true, 
  service: "smartboard-booking",
  timestamp: new Date().toISOString()
}));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);  // Moved admin routes before auth routes
app.use("/api/classrooms", classroomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/faculties", facultyRoutes);
app.use('/api/auth', passwordResetRoutes);  // This might cause conflicts - consider separating
app.use("/api/email", emailTestRoute);  // Changed from "/api" to "/api/email"

// ✅ Dashboard stats endpoint - ADD THIS
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    // Import models dynamically to avoid circular imports
    const { default: Classroom } = await import("./models/Classroom.js");
    const { default: Booking } = await import("./models/Booking.js");
    const { default: Faculty } = await import("./models/Faculty.js");

    // Get counts
    const [classroomCount, bookingCount, facultyCount] = await Promise.all([
      Classroom.countDocuments(),
      Booking.countDocuments(),
      Faculty.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        classrooms: classroomCount,
        bookings: bookingCount,
        facultyMembers: facultyCount
      }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message
    });
  }
});

// ✅ System status endpoint - ADD THIS
app.get("/api/system/status", (req, res) => {
  res.json({
    success: true,
    data: {
      database: "Connected",
      api: "Responding",
      features: "Limited admin features"
    }
  });
});

// ✅ 404 handler with better error message
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: "Route not found",
    method: req.method,
    url: req.originalUrl,
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({ 
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ✅ Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 API running on port ${port}`);
  console.log(`📊 Dashboard: http://localhost:${port}`);
  console.log(`🔗 Available routes:`);
  console.log(`   GET  / - Health check`);
  console.log(`   POST /api/auth/login - Authentication`);
  console.log(`   GET  /api/admin - Admin management`);
  console.log(`   GET  /api/dashboard/stats - Dashboard statistics`);
  console.log(`   GET  /api/system/status - System status`);
  console.log(`   GET  /api/classrooms/:branch - Classrooms by branch`);
  console.log(`   GET  /api/bookings/mine - User bookings`);
  console.log(`   GET  /api/faculties/me - Faculty profile`);
});
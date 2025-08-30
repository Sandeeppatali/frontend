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

// 🔥 UPDATED CORS CONFIGURATION - CRITICAL FIX
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173", 
  "http://localhost:4173",
  "https://smartboard-booking-v92s.onrender.com", // Your frontend URL
  // Add CLIENT_ORIGIN from env if it exists
  ...(process.env.CLIENT_ORIGIN?.split(",") || [])
];

console.log("🌐 Allowed CORS origins:", allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      console.log("✅ Allowing request with no origin");
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Allowing origin: ${origin}`);
      return callback(null, true);
    }
    
    console.log(`❌ Rejecting origin: ${origin}`);
    console.log(`❌ Allowed origins: ${allowedOrigins.join(", ")}`);
    
    // In development, allow all origins (less secure but helpful for debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log("🔧 Development mode: allowing all origins");
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Access-Control-Allow-Origin'
  ],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// 🔥 ADDITIONAL CORS MIDDLEWARE - RENDER.COM SPECIFIC FIX
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log all requests for debugging
  console.log(`📥 ${req.method} ${req.url} from origin: ${origin || 'no-origin'}`);
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ Handling OPTIONS preflight for ${req.url}`);
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());
app.use(morgan("dev"));

// ✅ DB Connection
connectDB();

// ✅ Health check with more info
app.get("/", (_req, res) => {
  const healthData = {
    ok: true, 
    service: "smartboard-booking",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors_origins: allowedOrigins,
    version: "1.0.0"
  };
  
  console.log("🏥 Health check requested:", healthData);
  res.json(healthData);
});

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/faculties", facultyRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use("/api/email", emailTestRoute);

// ✅ Dashboard stats endpoint
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    console.log("📊 Dashboard stats requested");
    
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

    const statsData = {
      success: true,
      data: {
        classrooms: classroomCount,
        bookings: bookingCount,
        facultyMembers: facultyCount
      }
    };
    
    console.log("📊 Dashboard stats response:", statsData);
    res.json(statsData);
  } catch (error) {
    console.error("❌ Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message
    });
  }
});

// ✅ System status endpoint
app.get("/api/system/status", (req, res) => {
  const statusData = {
    success: true,
    data: {
      database: "Connected",
      api: "Responding",
      features: "Limited admin features",
      cors: "Enabled",
      environment: process.env.NODE_ENV || 'development'
    }
  };
  
  console.log("⚙️ System status requested:", statusData);
  res.json(statusData);
});

// ✅ 404 handler with better error message
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl} from origin: ${req.headers.origin}`);
  res.status(404).json({ 
    error: "Route not found",
    method: req.method,
    url: req.originalUrl,
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    available_endpoints: [
      "GET /",
      "POST /api/auth/login",
      "GET /api/dashboard/stats",
      "GET /api/system/status"
    ]
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(err.status || 500).json({ 
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ✅ Start server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API running on port ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${port}/`);
  console.log(`📊 Dashboard: http://localhost:${port}/api/dashboard/stats`);
  console.log(`🌐 Allowed CORS origins:`, allowedOrigins);
  console.log(`📝 Available routes:`);
  console.log(`   GET  / - Health check`);
  console.log(`   POST /api/auth/login - Authentication`);
  console.log(`   GET  /api/admin - Admin management`);
  console.log(`   GET  /api/dashboard/stats - Dashboard statistics`);
  console.log(`   GET  /api/system/status - System status`);
  console.log(`   GET  /api/classrooms/:branch - Classrooms by branch`);
  console.log(`   GET  /api/bookings/mine - User bookings`);
  console.log(`   GET  /api/faculties/me - Faculty profile`);
});
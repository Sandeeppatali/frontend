import express from "express";
import jwt from "jsonwebtoken";
import Faculty from "../models/Faculty.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

const router = express.Router();

// ============================
// Faculty First-Time Registration
// ============================
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const faculty = await Faculty.findOne({ email });
    if (!faculty) {
      return res.status(400).json({ error: "Faculty not found in records" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Faculty already registered. Please login." });
    }

    const newUser = new User({
      name: faculty.name,
      email: faculty.email,
      password: password,
      branch: faculty.branch,
      phone: faculty.phone || "",
      role: "faculty"
    });

    await newUser.save();

    const token = jwt.sign(
      { 
        id: newUser._id, 
        name: newUser.name, 
        role: newUser.role, 
        branch: newUser.branch 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: { 
        name: newUser.name, 
        branch: newUser.branch, 
        role: newUser.role,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error("❌ User registration failed", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ============================
// Login Route
// ============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ===== Database Admin Login =====
    const admin = await Admin.findOne({ email });
    if (admin) {
      if (password === admin.password) {
        const token = jwt.sign(
          { 
            id: admin._id, 
            name: admin.name, 
            role: admin.role,
            adminId: admin.adminId,
            userType: "admin"
          },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );

        return res.json({ 
          token, 
          user: { 
            id: admin._id,
            name: admin.name, 
            role: admin.role,
            email: admin.email,
            position: admin.position,
            branch: admin.branch,
            adminId: admin.adminId,
            userType: "admin"
          } 
        });
      } else {
        return res.status(400).json({ error: "Invalid admin password" });
      }
    }

    // ===== Faculty Login =====
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not registered. Please register first." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { 
        id: user._id, 
        name: user.name, 
        role: user.role, 
        branch: user.branch,
        userType: "faculty"
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ 
      token, 
      user: { 
        name: user.name, 
        branch: user.branch, 
        role: user.role,
        email: user.email,
        userType: "faculty"
      } 
    });
  } catch (err) {
    console.error("❌ Login failed", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ============================
// Profile Route
// ============================
router.get("/profile", async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("❌ Profile fetch failed", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ============================
// Fallback Route
// ============================
router.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default router;

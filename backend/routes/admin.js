// COMPLETE SOLUTION: Update your route structure

// 1. UPDATE YOUR admin.js file - REORDER THE ROUTES
// The key issue is route order. Move specific routes BEFORE generic ones.

import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Classroom from '../models/Classroom.js';
import Faculty from '../models/Faculty.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// ===== DASHBOARD AND SYSTEM ROUTES (keep these first) =====
router.get('/dashboard/stats', async (req, res) => {
  try {
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
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

router.get('/system/status', (req, res) => {
  res.json({
    success: true,
    data: {
      database: "Connected",
      api: "Responding",
      features: "Limited admin features"
    }
  });
});

// ===== FACULTY MANAGEMENT (MOVE BEFORE /:id route) =====
router.get('/faculty', async (req, res) => {
  try {
    const faculty = await Faculty.find().sort({ name: 1 });
    res.json({
      success: true,
      count: faculty.length,
      data: faculty
    });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty',
      error: error.message
    });
  }
});

router.post('/faculty', async (req, res) => {
  try {
    const facultyData = {
      ...req.body,
      password: req.body.password || 'ChangeMe@123'
    };
    
    const faculty = new Faculty(facultyData);
    const savedFaculty = await faculty.save();
    
    const { password, ...facultyResponse } = savedFaculty.toObject();
    
    res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      data: facultyResponse
    });
  } catch (error) {
    console.error('Error creating faculty:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating faculty',
      error: error.message
    });
  }
});

router.delete('/faculty/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }
    res.json({
      success: true,
      message: 'Faculty deleted successfully',
      data: faculty
    });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting faculty',
      error: error.message
    });
  }
});

// ===== BOOKING MANAGEMENT (MOVE BEFORE /:id route) =====
router.get('/bookings/all', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .sort({ date: -1, time: 1 });
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all bookings',
      error: error.message
    });
  }
});

router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .sort({ date: -1, time: 1 });
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

router.delete('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    res.json({
      success: true,
      message: 'Booking deleted successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting booking',
      error: error.message
    });
  }
});

// ===== CLASSROOM MANAGEMENT =====
router.get('/classrooms', async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort({ Branch: 1, Classroom: 1 });
    res.json({
      success: true,
      count: classrooms.length,
      data: classrooms
    });
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching classrooms',
      error: error.message
    });
  }
});

router.post('/classrooms', async (req, res) => {
  try {
    const classroom = new Classroom(req.body);
    const savedClassroom = await classroom.save();
    res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      data: savedClassroom
    });
  } catch (error) {
    console.error('Error creating classroom:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating classroom',
      error: error.message
    });
  }
});

router.delete('/classrooms/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }
    res.json({
      success: true,
      message: 'Classroom deleted successfully',
      data: classroom
    });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting classroom',
      error: error.message
    });
  }
});

// ===== ADMIN USER ROUTES (move general routes to END) =====
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Admin login attempt for:', email);

    const admin = await Admin.findOne({ email, isActive: true }).select('+password');
    if (!admin) {
      console.log('Admin not found or inactive:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    let isPasswordMatch = false;
    if (typeof admin.comparePassword === 'function') {
      isPasswordMatch = await admin.comparePassword(password);
    } else {
      isPasswordMatch = admin.password === password;
      console.log('Using simple password comparison (not secure)');
    }

    if (!isPasswordMatch) {
      console.log('Password mismatch for admin:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email, 
        role: admin.role || 'admin',
        adminId: admin.adminId,
        name: admin.name
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '24h' }
    );

    console.log('Admin login successful:', email);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin._id,
          adminId: admin.adminId,
          name: admin.name,
          email: admin.email,
          position: admin.position,
          branch: admin.branch,
          role: admin.role || 'admin'
        },
        token
      }
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// GET all admins
router.get('/', async (req, res) => {
  try {
    const admins = await Admin.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin details',
      error: error.message
    });
  }
});

// POST create new admin
router.post('/', async (req, res) => {
  try {
    const adminData = {
      ...req.body,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const admin = new Admin(adminData);
    const savedAdmin = await admin.save();
    
    const { password, ...adminResponse } = savedAdmin.toObject();
    
    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: adminResponse
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating admin',
      error: error.message
    });
  }
});

// ===== GENERIC ADMIN ROUTES (MOVE TO END) =====
// PUT update admin
router.put('/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    if (password) {
      updateData.password = password;
    }
    
    updateData.updatedAt = new Date();
    
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    const { password: _, ...adminResponse } = admin.toObject();
    
    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: adminResponse
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating admin',
      error: error.message
    });
  }
});

// DELETE admin (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Admin deleted successfully',
      data: admin
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting admin',
      error: error.message
    });
  }
});

// GET single admin by ID (MOVE TO VERY END)
router.get('/:id', async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin details',
      error: error.message
    });
  }
});

export default router;
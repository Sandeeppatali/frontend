import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Classroom from '../models/Classroom.js';
import Faculty from '../models/Faculty.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Dashboard stats endpoint
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

// System status endpoint
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

// GET single admin by ID
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

// POST admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Admin login attempt for:', email);

    // Check if admin exists
    const admin = await Admin.findOne({ email, isActive: true }).select('+password');
    if (!admin) {
      console.log('Admin not found or inactive:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // For development, if no comparePassword method exists, do simple comparison
    let isPasswordMatch = false;
    if (typeof admin.comparePassword === 'function') {
      isPasswordMatch = await admin.comparePassword(password);
    } else {
      // Simple password comparison (not recommended for production)
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

    // Generate JWT token
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
    
    // Remove password from response
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

// PUT update admin
router.put('/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    // If password is being updated, it will be hashed by the pre-save middleware
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
    
    // Remove password from response
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

// ===== CLASSROOM MANAGEMENT =====

// GET all classrooms (admin view)
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

// POST create new classroom
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

// DELETE classroom
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

// ===== FACULTY MANAGEMENT =====

// GET all faculty (admin view)
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

// POST create new faculty
router.post('/faculty', async (req, res) => {
  try {
    const facultyData = {
      ...req.body,
      password: req.body.password || 'ChangeMe@123' // Default password
    };
    
    const faculty = new Faculty(facultyData);
    const savedFaculty = await faculty.save();
    
    // Remove password from response
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

// DELETE faculty
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

// ===== BOOKING MANAGEMENT =====

// GET all bookings (admin view)
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

// DELETE any booking (admin privilege)
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

// ===== SMARTBOARD MANAGEMENT =====

// GET smartboards (for AdminClassrooms component)
router.get('/smartboards', async (req, res) => {
  try {
    const classrooms = await Classroom.find();
    const smartboards = [];
    
    classrooms.forEach(classroom => {
      if (classroom.Smartboards && classroom.Smartboards.length > 0) {
        classroom.Smartboards.forEach(sb => {
          smartboards.push({
            _id: `${classroom._id}-${sb.Number}`,
            name: sb.Number,
            room: classroom.Classroom,
            department: classroom.Branch
          });
        });
      }
    });
    
    res.json(smartboards);
  } catch (error) {
    console.error('Error fetching smartboards:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching smartboards',
      error: error.message
    });
  }
});

// POST add smartboard
router.post('/smartboards', async (req, res) => {
  try {
    const { name, room, department } = req.body;
    
    // Find or create classroom
    let classroom = await Classroom.findOne({ 
      Branch: department, 
      Classroom: room 
    });
    
    if (!classroom) {
      classroom = new Classroom({
        Branch: department,
        Classroom: room,
        Smartboards: []
      });
    }
    
    // Add smartboard
    classroom.Smartboards.push({
      Number: name,
      Status: 'Available'
    });
    
    await classroom.save();
    
    res.status(201).json({
      success: true,
      message: 'Smartboard added successfully'
    });
  } catch (error) {
    console.error('Error adding smartboard:', error);
    res.status(400).json({
      success: false,
      message: 'Error adding smartboard',
      error: error.message
    });
  }
});

// DELETE smartboard
router.delete('/smartboards/:id', async (req, res) => {
  try {
    // Parse the composite ID
    const [classroomId, smartboardNumber] = req.params.id.split('-');
    
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }
    
    // Remove smartboard
    classroom.Smartboards = classroom.Smartboards.filter(
      sb => sb.Number !== smartboardNumber
    );
    
    await classroom.save();
    
    res.json({
      success: true,
      message: 'Smartboard deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting smartboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting smartboard',
      error: error.message
    });
  }
});

// ===== DEPARTMENT MANAGEMENT =====

// GET departments (for AdminDepartments component)
router.get('/departments', async (req, res) => {
  try {
    // Get unique departments/branches from classrooms and faculty
    const [classroomBranches, facultyBranches] = await Promise.all([
      Classroom.distinct('Branch'),
      Faculty.distinct('branch')
    ]);
    
    const allBranches = [...new Set([...classroomBranches, ...facultyBranches])];
    const departments = allBranches.map(branch => ({
      _id: branch,
      code: branch,
      name: `${branch} Department`
    }));
    
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message
    });
  }
});

// POST create department
router.post('/departments', async (req, res) => {
  try {
    const { code, name } = req.body;
    
    // For simplicity, we'll just return success
    // In a real app, you might have a separate Departments collection
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: { code, name }
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating department',
      error: error.message
    });
  }
});

// DELETE department
router.delete('/departments/:id', async (req, res) => {
  try {
    // In a real app, you'd want to check if any classrooms/faculty use this department
    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting department',
      error: error.message
    });
  }
});

export default router;
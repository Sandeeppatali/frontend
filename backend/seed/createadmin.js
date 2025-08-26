import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';

// Admin data to seed
const adminData = {
  adminId: "ADM001",
  name: "Mr. Chandramohan D",
  position: "System Administrator",
  branch: "CS",
  email: "chandramohan.cs@sahyadri.edu.in",
  phone: "9845152665",
  password: "admin123",
  role: "admin",
  isActive: true
};

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-classroom', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [
        { email: adminData.email }, 
        { adminId: adminData.adminId },
        { phone: adminData.phone }
      ]
    });

    if (existingAdmin) {
      console.log('Admin already exists with this email, adminId, or phone');
      console.log('Existing admin:', {
        adminId: existingAdmin.adminId,
        name: existingAdmin.name,
        email: existingAdmin.email
      });
    } else {
      // Create new admin
      const admin = new Admin(adminData);
      const savedAdmin = await admin.save();
      
      console.log('Admin created successfully:');
      console.log({
        adminId: savedAdmin.adminId,
        name: savedAdmin.name,
        email: savedAdmin.email,
        position: savedAdmin.position,
        branch: savedAdmin.branch,
        phone: savedAdmin.phone,
        role: savedAdmin.role
      });
    }

  } catch (error) {
    console.error('Error seeding admin:', error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedAdmin();
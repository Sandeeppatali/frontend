import express from 'express';
import User from '../models/User.js';
import Faculty from '../models/Faculty.js';
import { 
  sendEmail, 
  createAdminNotificationTemplate, 
  createUserConfirmationTemplate 
} from '../config/email.js';

const router = express.Router();

// =======================
// PASSWORD RESET REQUEST
// =======================
router.post('/password-reset-request', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    console.log(`🔄 Processing password reset request for: ${email}`);

    // Check if user exists in Users table (registered users)
    const user = await User.findOne({ email });
    
    // Also check if they exist in Faculty table (eligible for registration)
    const faculty = await Faculty.findOne({ email });
    
    const userExists = user || faculty;
    const userName = user?.name || faculty?.name || null;
    const userBranch = user?.branch || faculty?.branch || null;
    const userRole = user?.role || 'faculty';

    // Get admin emails from environment variable
    const adminEmails = process.env.ADMIN_EMAILS ? 
      process.env.ADMIN_EMAILS.split(',').map(email => email.trim()) : 
      ['admin@sahyadri.edu.in'];

    console.log(`📧 Sending notifications to admins: ${adminEmails.join(', ')}`);

    // Prepare user details for email template
    const userDetails = {
      email,
      name: userName,
      branch: userBranch,
      role: userRole,
      requestedAt: new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      userExists: !!userExists
    };

    // Send notification email to all admins
    const emailSubject = `🔒 Password Reset Request - ${email}`;
    const adminEmailHTML = createAdminNotificationTemplate(userDetails);

    let emailResults = [];
    for (const adminEmail of adminEmails) {
      try {
        const result = await sendEmail(adminEmail, emailSubject, adminEmailHTML);
        emailResults.push({ email: adminEmail, success: result.success });
        
        if (result.success) {
          console.log(`✅ Admin notification sent to: ${adminEmail}`);
        } else {
          console.error(`❌ Failed to send to admin: ${adminEmail}`, result.error);
        }
      } catch (error) {
        console.error(`❌ Error sending to admin ${adminEmail}:`, error.message);
        emailResults.push({ email: adminEmail, success: false, error: error.message });
      }
    }

    // Send confirmation email to user (only if they exist in our system)
    if (userExists && userName) {
      try {
        const userSubject = '✅ Password Reset Request Received - Smartboard System';
        const userEmailHTML = createUserConfirmationTemplate({ name: userName, email });
        
        const userEmailResult = await sendEmail(email, userSubject, userEmailHTML);
        
        if (userEmailResult.success) {
          console.log(`✅ Confirmation sent to user: ${email}`);
        } else {
          console.error(`❌ Failed to send confirmation to user: ${email}`, userEmailResult.error);
        }
      } catch (error) {
        console.error(`❌ Error sending user confirmation:`, error.message);
      }
    }

    // Check if at least one admin email was sent successfully
    const successfulAdminEmails = emailResults.filter(result => result.success).length;
    
    if (successfulAdminEmails > 0) {
      // Log the request for admin tracking (you might want to store this in database)
      console.log(`📋 Password reset request logged:`, {
        email,
        userExists: !!userExists,
        userName,
        requestedAt: new Date(),
        adminNotificationsSent: successfulAdminEmails
      });

      res.json({ 
        success: true, 
        message: 'Your password reset request has been sent to the administrator. You will receive an email once your password has been reset.' 
      });
    } else {
      // All admin notifications failed
      console.error('❌ All admin notifications failed');
      res.status(500).json({ 
        error: 'Failed to process your request. Please try again later or contact support directly.',
        details: 'Email notification system temporarily unavailable'
      });
    }

  } catch (error) {
    console.error('❌ Password reset request error:', error);
    res.status(500).json({ 
      error: 'Failed to process password reset request. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =======================
// GET PENDING REQUESTS (for admin dashboard - optional)
// =======================
router.get('/pending-requests', async (req, res) => {
  try {
    // This is a placeholder - in production, you'd store requests in a database
    // For now, we'll just return a message
    res.json({ 
      message: 'Password reset requests are handled via email notifications to admins',
      note: 'Consider implementing a database table to track requests if needed'
    });
  } catch (error) {
    console.error('❌ Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// =======================
// ADMIN: RESET USER PASSWORD (for admin dashboard)
// =======================
router.post('/admin-reset-password', async (req, res) => {
  try {
    const { email, newPassword, adminEmail } = req.body;

    // Basic validation
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    // Verify admin credentials (simple check - you might want to add proper admin auth)
    if (adminEmail !== 'admin@sahyadri.edu.in') {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password (will be hashed by User model middleware)
    user.password = newPassword;
    user.lastPasswordReset = new Date();
    await user.save();

    // Send new password to user via email
    const passwordEmailSubject = '🔑 Your New Password - Smartboard Booking System';
    const passwordEmailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔑 Password Reset Complete</h1>
        </div>
        
        <div style="padding: 30px;">
          <p>Hello <strong>${user.name}</strong>,</p>
          
          <p>Your password has been reset by the system administrator.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c5ce7;">
            <h4 style="margin-top: 0;">🔐 Your New Login Details:</h4>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>New Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px;">${newPassword}</code></p>
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              ⚠️ <strong>Important:</strong> Please change this password after logging in for security.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
               style="background-color: #6c5ce7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Login to System
            </a>
          </div>
        </div>

        <div style="background-color: #ddd; padding: 15px; text-align: center;">
          <p style="color: #636e72; font-size: 12px; margin: 0;">
            Smartboard Booking System - Sahyadri College of Engineering & Management
          </p>
        </div>
      </div>
    `;

    const emailResult = await sendEmail(email, passwordEmailSubject, passwordEmailHTML);

    if (emailResult.success) {
      console.log(`✅ New password sent to user: ${email}`);
      res.json({ 
        success: true, 
        message: 'Password reset successfully. New password has been sent to the user via email.' 
      });
    } else {
      console.error(`❌ Failed to send new password to: ${email}`);
      res.status(500).json({ 
        error: 'Password was reset but failed to send email notification',
        details: 'User password has been updated in the system'
      });
    }

  } catch (error) {
    console.error('❌ Admin password reset error:', error);
    res.status(500).json({ 
      error: 'Failed to reset password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
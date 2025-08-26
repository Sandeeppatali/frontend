import nodemailer from "nodemailer";

// =======================
// TRANSPORTERS
// =======================

// Gmail transporter
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generic SMTP transporter (if you want to use your college mail server later)
const createSMTPTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// SendGrid transporter
const createSendGridTransporter = async () => {
  const sgMail = await import("@sendgrid/mail");
  sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);
  return sgMail.default;
};

// =======================
// EMAIL SENDING FUNCTIONS
// =======================

// Generic send email function using Nodemailer
const sendEmailWithNodemailer = async (to, subject, html) => {
  try {
    const transporter =
      process.env.EMAIL_SERVICE === "smtp"
        ? createSMTPTransporter()
        : createGmailTransporter();

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully via Nodemailer:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Email sending failed (Nodemailer):", error);
    return { success: false, error: error.message };
  }
};

// SendGrid email function
const sendEmailWithSendGrid = async (to, subject, html) => {
  try {
    const sgMail = await createSendGridTransporter();
    const msg = {
      to,
      from: process.env.FROM_EMAIL,
      subject,
      html,
    };

    await sgMail.send(msg);
    console.log("✅ Email sent successfully via SendGrid");
    return { success: true };
  } catch (error) {
    console.error("❌ SendGrid email failed:", error);
    return { success: false, error: error.message };
  }
};

// Main send email function
const sendEmail = async (to, subject, html) => {
  if (process.env.EMAIL_SERVICE === "sendgrid") {
    return await sendEmailWithSendGrid(to, subject, html);
  } else {
    return await sendEmailWithNodemailer(to, subject, html);
  }
};

// =======================
// EMAIL TEMPLATES
// =======================

const createAdminNotificationTemplate = (userDetails) => {
  const { email, name, branch, role, requestedAt, userExists } = userDetails;

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔒 Password Reset Request</h1>
        <p style="color: #f8f9fa; margin: 5px 0 0 0;">Smartboard Booking System</p>
      </div>
      
      <div style="padding: 30px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c5ce7;">
          <h3 style="margin-top: 0; color: #2d3436;">📋 Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #636e72;">Email:</td>
              <td style="padding: 8px 0; color: #2d3436;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #636e72;">Requested At:</td>
              <td style="padding: 8px 0; color: #2d3436;">${requestedAt}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #636e72;">Status:</td>
              <td style="padding: 8px 0; color: ${userExists ? "#00b894" : "#e17055"};">
                ${userExists ? "✅ Registered User" : "❌ Email not found in system"}
              </td>
            </tr>
            ${
              userExists && name
                ? `
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #636e72;">Name:</td>
                <td style="padding: 8px 0; color: #2d3436;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #636e72;">Branch:</td>
                <td style="padding: 8px 0; color: #2d3436;">${branch || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #636e72;">Role:</td>
                <td style="padding: 8px 0; color: #2d3436;">${role || "faculty"}</td>
              </tr>
            `
                : ""
            }
          </table>
        </div>

        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <h4 style="margin-top: 0; color: #856404;">⚡ Action Required</h4>
          <p style="margin-bottom: 0; color: #856404; line-height: 1.6;">
            Please log into the admin dashboard to reset this user's password and send them their new credentials via email.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #636e72; font-size: 14px; margin: 0;">
            🔗 Access your admin dashboard to take action
          </p>
        </div>
      </div>

      <div style="background-color: #ddd; padding: 15px; text-align: center;">
        <p style="color: #636e72; font-size: 12px; margin: 0;">
          This is an automated message from the Smartboard Booking System.<br>
          Sahyadri College of Engineering & Management
        </p>
      </div>
    </div>
  `;
};

const createUserConfirmationTemplate = (userDetails) => {
  const { name, email } = userDetails;

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">✅ Request Received</h1>
        <p style="color: #f8f9fa; margin: 5px 0 0 0;">Password Reset Confirmation</p>
      </div>
      
      <div style="padding: 30px;">
        <p style="color: #2d3436; font-size: 16px; line-height: 1.6;">
          Hello <strong>${name || "User"}</strong>,
        </p>
        
        <p style="color: #636e72; line-height: 1.6;">
          We have received your password reset request for the <strong>Smartboard Booking System</strong>.
        </p>
        
        <div style="background-color: #d1f2eb; padding: 20px; border-radius: 8px; border-left: 4px solid #00b894; margin: 25px 0;">
          <h4 style="margin-top: 0; color: #00695c;">📋 What happens next:</h4>
          <ol style="margin: 15px 0 0 0; padding-left: 20px; color: #004d40;">
            <li style="margin-bottom: 10px;">Your request has been forwarded to the system administrator</li>
            <li style="margin-bottom: 10px;">The administrator will reset your password manually</li>
            <li style="margin-bottom: 10px;">You will receive your new password via email within 24-48 hours</li>
            <li style="margin-bottom: 0;">Use the new password to log into the system</li>
          </ol>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            ⏰ <strong>Expected Processing Time:</strong> 24-48 hours during business days.<br>
            📞 For urgent requests, please contact your system administrator directly.
          </p>
        </div>
      </div>

      <div style="background-color: #ddd; padding: 15px; text-align: center;">
        <p style="color: #636e72; font-size: 12px; margin: 0;">
          If you did not request this password reset, please ignore this email.<br>
          Smartboard Booking System - Sahyadri College of Engineering & Management
        </p>
      </div>
    </div>
  `;
};

export {
  sendEmail,
  createAdminNotificationTemplate,
  createUserConfirmationTemplate,
};

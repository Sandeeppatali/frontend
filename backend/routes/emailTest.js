import express from "express";
import { sendEmail } from "../config/email.js"; // adjust path as needed

const router = express.Router();

// Test email route
router.post("/test-email", async (req, res) => {
  try {
    const result = await sendEmail(
      "your-email@gsahyadri.edu.com",
      "Test Email",
      "<h1>Email configuration works!</h1>"
    );
    res.json({ success: result.success, message: "Test email sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

// backend/routes/classrooms.js
import express from "express";
import Classroom from "../models/Classroom.js";

const router = express.Router();

// ✅ Fetch classrooms for a given branch (case-insensitive)
router.get("/:branch", async (req, res) => {
  try {
    const { branch } = req.params;
    
    // Use case-insensitive regex for better matching
    const rooms = await Classroom.find({ 
      Branch: { $regex: new RegExp(`^${branch}$`, 'i') }
    });
    
    console.log(`Searching for branch: ${branch}, Found ${rooms.length} classrooms`);
    res.json(rooms);
  } catch (err) {
    console.error("Error fetching classrooms:", err);
    res.status(500).json({ error: "Failed to fetch classrooms" });
  }
});

export default router;